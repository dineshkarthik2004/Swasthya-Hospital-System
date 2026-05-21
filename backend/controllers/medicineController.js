import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../config/db.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Same composition parsing logic as original loadMedicines() ───────────────
// Extracts generic name and dosage from composition strings like "Drug A (100mg) + Drug B (200mg)"
const parseComposition = (composition, productForm) => {
    const comp = composition || '';
    const dosageMatches = [...comp.matchAll(/\((.*?)\)/g)];
    let generics = [];
    let dosages = [];

    if (dosageMatches.length > 0) {
        dosages = dosageMatches.map(m => m[1]);
        generics = [comp.replace(/\(.*?\)/g, '').replace(/\+/g, '/').replace(/\s+/g, ' ').trim()];
    } else {
        generics = [comp];
    }

    const formLower = (productForm || '').toLowerCase();
    let type = 'Other';
    if (formLower.includes('tab')) type = 'Tab';
    else if (formLower.includes('cap')) type = 'Cap';
    else if (formLower.includes('syr') || formLower.includes('syp')) type = 'Syp';
    else if (formLower.includes('inj')) type = 'Inj';
    else if (formLower.includes('oint')) type = 'Oint';

    return {
        generic: generics.join(' + '),
        dosage: dosages.join(' / '),
        type
    };
};

// ─── DB-backed medicine ranking — preserves exact same priority logic ─────────
// Priority order:
//   1. Global medicines (hospitalId = null) that startsWith query
//   2. Global medicines that contains query (but NOT startsWith)
//   3. If no global results → hospital medicines (hospitalName match) that startsWith query
//   4. If no global results → hospital medicines that contains query (but NOT startsWith)
const rankMedicinesFromDB = async (q, userHospitalName = '') => {
    if (!q || q.trim().length === 0) return [];
    const query = q.toLowerCase().trim();

    // ── Global medicines search ──────────────────────────────────────────────
    const [globalStartsWith, globalContains] = await Promise.all([
        prisma.medicine.findMany({
            where: {
                hospitalId: null,
                nameLower: { startsWith: query }
            },
            orderBy: { nameLower: 'asc' },
            take: 100
        }),
        prisma.medicine.findMany({
            where: {
                hospitalId: null,
                nameLower: { contains: query },
                NOT: { nameLower: { startsWith: query } }
            },
            orderBy: { nameLower: 'asc' },
            take: 100
        })
    ]);

    let results = [...globalStartsWith, ...globalContains];

    // ── Hospital-specific fallback — ONLY if no global results found ──────────
    if (results.length === 0 && userHospitalName) {
        console.log(`[Search] No global matches for "${query}", checking hospital medicines for "${userHospitalName}"`);

        const [hospStartsWith, hospContains] = await Promise.all([
            prisma.medicine.findMany({
                where: {
                    hospitalName: userHospitalName,
                    nameLower: { startsWith: query }
                },
                orderBy: { nameLower: 'asc' },
                take: 100
            }),
            prisma.medicine.findMany({
                where: {
                    hospitalName: userHospitalName,
                    nameLower: { contains: query },
                    NOT: { nameLower: { startsWith: query } }
                },
                orderBy: { nameLower: 'asc' },
                take: 100
            })
        ]);

        results = [...hospStartsWith, ...hospContains];
    }

    return results;
};

// ─── Helper: resolve hospital name from JWT user ──────────────────────────────
const resolveHospitalName = async (user) => {
    if (!user?.hospitalId) return '';
    try {
        const hospital = await prisma.hospital.findUnique({ where: { id: user.hospitalId } });
        return hospital ? hospital.name : '';
    } catch {
        return '';
    }
};

// ─── Manual search endpoint ───────────────────────────────────────────────────
// GET /api/medicines/search?q=&field=
export const searchMedicines = async (req, res) => {
    const query = (req.query.q || '').trim();
    const field = (req.query.field || 'name').trim();
    console.log(`Hitting searchMedicines, the query is: ${query}, field: ${field}`);

    // Minimum 3 characters to avoid excessive load
    if (query.length < 3) return res.json([]);

    const userHospitalName = await resolveHospitalName(req.user);
    const q = query.toLowerCase();

    let results;

    if (field === 'composition') {
        // ── Composition/generic field search ─────────────────────────────────
        // Search the generic field using same priority logic
        const [globalStartsWith, globalContains] = await Promise.all([
            prisma.medicine.findMany({
                where: {
                    hospitalId: null,
                    generic: { startsWith: q, mode: 'insensitive' }
                },
                orderBy: { nameLower: 'asc' }
            }),
            prisma.medicine.findMany({
                where: {
                    hospitalId: null,
                    generic: { contains: q, mode: 'insensitive' },
                    NOT: { generic: { startsWith: q, mode: 'insensitive' } }
                },
                orderBy: { nameLower: 'asc' }
            })
        ]);

        results = [...globalStartsWith, ...globalContains];

        if (results.length === 0 && userHospitalName) {
            const [hospStartsWith, hospContains] = await Promise.all([
                prisma.medicine.findMany({
                    where: {
                        hospitalName: userHospitalName,
                        generic: { startsWith: q, mode: 'insensitive' }
                    },
                    orderBy: { nameLower: 'asc' }
                }),
                prisma.medicine.findMany({
                    where: {
                        hospitalName: userHospitalName,
                        generic: { contains: q, mode: 'insensitive' },
                        NOT: { generic: { startsWith: q, mode: 'insensitive' } }
                    },
                    orderBy: { nameLower: 'asc' }
                })
            ]);
            results = [...hospStartsWith, ...hospContains];
        }
    } else {
        // ── Default: search by name (nameLower field) ─────────────────────────
        results = await rankMedicinesFromDB(query, userHospitalName);
    }

    // Return top 100 matches — enough for any dropdown, avoids massive payloads
    const response = results.slice(0, 100).map(m => ({
        name: m.name,
        composition: m.generic || ''
    }));

    console.log(`Search "${query}" by ${field} → ${response.length} results`);
    res.json(response);
};

// ─── Helper: Voice matching — same 2-step logic as original findBestMatch() ───
// Step 1: Full-name ranking via rankMedicinesFromDB
// Step 2: Prefix fallback (first 4 chars or min 3) if Step 1 finds nothing
const findBestMatch = async (spokenName, allMedicinesFn, userHospitalName) => {
    if (!spokenName) return { bestMatch: null, candidates: [], matchType: 'none' };

    const query = spokenName.toLowerCase().trim();

    // ── STEP 1: Full name match ───────────────────────────────────────────────
    let results = await rankMedicinesFromDB(query, userHospitalName);
    let matchType = 'full_name';

    // ── STEP 2: Prefix fallback ───────────────────────────────────────────────
    if (results.length === 0) {
        const prefixLen = query.length >= 4 ? 4 : Math.min(query.length, 3);
        const prefix = query.substring(0, prefixLen);

        console.log(`[voice-match] Step 1 failed for "${query}", falling back to prefix "${prefix}"`);

        results = await rankMedicinesFromDB(prefix, userHospitalName);
        matchType = 'prefix_fallback';
    }

    if (results.length === 0) {
        console.log(`[voice-match] No match found for "${query}" in both steps`);
        return { bestMatch: null, candidates: [], matchType: 'none' };
    }

    console.log(`[voice-match] "${query}" → ${results.length} results (${matchType})`);

    const bestMatch = results[0];
    const candidates = results;

    // Single candidate — return immediately with no candidates array
    if (candidates.length === 1) {
        return { bestMatch, candidates: [], matchType };
    }

    // Multiple candidates — return all for dropdown
    return { bestMatch, candidates, matchType };
};

// ─── Voice match endpoint ─────────────────────────────────────────────────────
// POST /api/medicines/voice-match
export const voiceMatchMedicines = async (req, res) => {
    try {
        const { medicines: spokenMedicines } = req.body;

        if (!spokenMedicines || !Array.isArray(spokenMedicines) || spokenMedicines.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No medicines provided in request body'
            });
        }

        console.log('[voice-match] Received', spokenMedicines.length, 'medicines to match');

        const userHospitalName = await resolveHospitalName(req.user);
        const results = [];

        for (const spoken of spokenMedicines) {
            const spokenName = (spoken.spoken_name || '').trim();
            const spokenDosage = (spoken.dosage || '').trim();

            console.log(`[voice-match] Matching: "${spokenName}" dosage: "${spokenDosage}"`);

            const { bestMatch, candidates, matchType } = await findBestMatch(spokenName, null, userHospitalName);

            if (bestMatch) {
                console.log(`[voice-match] ✅ Matched "${spokenName}" → "${bestMatch.name}" via ${matchType}`);

                const result = {
                    matched: true,
                    matchType,
                    spoken_name: spokenName,
                    name: bestMatch.name,
                    composition: bestMatch.generic || '',
                    morning: Number(spoken.morning) || 0,
                    afternoon: Number(spoken.afternoon) || 0,
                    night: Number(spoken.night) || 0,
                    timing: spoken.timing || '',
                    duration: spoken.duration || '',
                    instruction: spoken.instruction || ''
                };

                // Include candidates for dropdown if there are multiple options
                if (candidates.length > 1) {
                    result.candidates = candidates.map(c => ({
                        name: c.name,
                        composition: c.generic || ''
                    }));
                }

                results.push(result);
            } else {
                console.log(`[voice-match] ❌ No match for "${spokenName}"`);

                results.push({
                    matched: false,
                    matchType: 'none',
                    spoken_name: spokenName,
                    name: spokenName,
                    composition: '',
                    morning: Number(spoken.morning) || 0,
                    afternoon: Number(spoken.afternoon) || 0,
                    night: Number(spoken.night) || 0,
                    timing: spoken.timing || '',
                    duration: spoken.duration || '',
                    instruction: spoken.instruction || '',
                    message: 'No medicines matched'
                });
            }
        }

        console.log('[voice-match] Returning', results.length, 'results');
        res.json({ success: true, medicines: results });

    } catch (err) {
        console.error('[voice-match] Error:', err);
        res.status(500).json({
            success: false,
            error: 'Voice medicine matching failed',
            details: err.message
        });
    }
};

// ─── Add single custom medicine to DB ────────────────────────────────────────
// POST /api/medicines/add
export const addMedicine = async (req, res) => {
    try {
        const { productName, composition, productForm } = req.body;
        if (!productName) {
            return res.status(400).json({ success: false, error: 'Product Name is required' });
        }

        let hospitalName = '';
        const hospitalId = req.user?.hospitalId || null;

        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
            if (hospital) hospitalName = hospital.name;
        }

        const { generic, dosage, type } = parseComposition(composition || '', productForm || '');

        await prisma.medicine.create({
            data: {
                name: productName,
                nameLower: productName.toLowerCase(),
                generic,
                dosage,
                type,
                hospitalId: hospitalId || null,
                hospitalName: hospitalName || null
            }
        });

        console.log('--------------------------------------------------');
        console.log(`[MEDICINE_ADD_SUCCESS]`);
        console.log(`Product: ${productName}`);
        console.log(`Hospital: ${hospitalName || 'Global'}`);
        console.log(`Hospital ID: ${hospitalId || 'N/A'}`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log('--------------------------------------------------');

        res.json({ success: true, message: 'Medicine added successfully' });
    } catch (err) {
        console.error('Error adding medicine:', err);
        res.status(500).json({ success: false, error: 'Failed to add medicine' });
    }
};

// ─── Multer Config for Bulk Upload ───────────────────────────────────────────
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            let hospitalFolderName = 'Global';
            if (req.user?.hospitalId) {
                const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospitalId } });
                if (hospital) hospitalFolderName = hospital.name.replace(/[^a-z0-9]/gi, '_');
            }
            const uploadPath = path.join(__dirname, '..', 'uploads', 'medicines', hospitalFolderName);
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

export const upload = multer({ storage });

// ─── Bulk Upload Medicines Controller ────────────────────────────────────────
// POST /api/medicines/upload
export const uploadMedicines = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();

        let hospitalName = '';
        let hospitalId = req.user?.hospitalId || null;

        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
            if (hospital) hospitalName = hospital.name;
        }

        // If it's an Excel file, parse and insert into DB
        if (['.xlsx', '.xls', '.xlsb', '.csv'].includes(fileExt)) {
            console.log(`[Upload] Parsing Excel/CSV file: ${req.file.originalname}`);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = xlsx.utils.sheet_to_json(sheet);

            if (excelData.length > 0) {
                const newMedicines = excelData
                    .map(item => {
                        const productName = (
                            item['Product Name'] || item['name'] || item['Product'] || ''
                        ).trim();
                        if (!productName) return null;

                        const rawComposition = item['Composition'] || item['generic'] || item['content'] || '';
                        const rawForm = item['Product Form'] || item['type'] || item['form'] || 'Tablet';

                        const { generic, dosage, type } = parseComposition(rawComposition, rawForm);

                        return {
                            name: productName,
                            nameLower: productName.toLowerCase(),
                            generic,
                            dosage,
                            type,
                            hospitalId: hospitalId || null,
                            hospitalName: hospitalName || null,
                            sourceFile: req.file.originalname
                        };
                    })
                    .filter(Boolean);

                await prisma.medicine.createMany({ data: newMedicines, skipDuplicates: false });

                console.log(`[Upload] Added ${newMedicines.length} medicines from ${req.file.originalname} → DB`);
            }
        } else {
            console.log(`[Upload] Non-Excel file saved: ${req.file.originalname}. (Not parsed for search)`);
        }

        res.json({
            success: true,
            message: 'File uploaded successfully',
            filename: req.file.originalname,
            path: req.file.path
        });
    } catch (err) {
        console.error('Error uploading medicines:', err);
        res.status(500).json({ success: false, error: 'Failed to upload file' });
    }
};
