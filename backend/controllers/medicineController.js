import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from '../config/db.js';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let medicineCache = null;

const loadMedicines = () => {
    if (medicineCache) return medicineCache;
    try {
        const filePath = path.join(__dirname, '..', 'Medicine_List.xlsb');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = xlsx.utils.sheet_to_json(sheet);

        // Load custom hospital medicines from local JSON
        let customData = [];
        const customPath = path.join(__dirname, '..', 'Hospital_Medicines.json');
        if (fs.existsSync(customPath)) {
            try {
                customData = JSON.parse(fs.readFileSync(customPath, 'utf8'));
            } catch (e) {
                console.error("[loadMedicines] Error reading custom medicines:", e);
            }
        }

        const data = [...excelData, ...customData];

        // Map to a cleaner structure — PRESERVE original product name for search
        medicineCache = data.map(item => {
            const productName = (item["Product Name"] || "").trim();
            const composition = item["Composition"] || "";
            const productForm = item["Product Form"] || "";

            // EXTRACT GENERIC AND DOSAGE FROM COMPOSITION
            // Format is often "Drug A (100mg) + Drug B (500mg)"
            let generics = [];
            let dosages = [];

            const dosageMatches = [...composition.matchAll(/\((.*?)\)/g)];
            if (dosageMatches.length > 0) {
                dosages = dosageMatches.map(m => m[1]);
                generics = [composition.replace(/\(.*?\)/g, '').replace(/\+/g, '/').replace(/\s+/g, ' ').trim()];
            } else {
                generics = [composition];
            }

            // Determine type from product form
            const formLower = productForm.toLowerCase();
            let type = "Other";
            if (formLower.includes("tab")) type = "Tab";
            else if (formLower.includes("cap")) type = "Cap";
            else if (formLower.includes("syr") || formLower.includes("syp")) type = "Syp";
            else if (formLower.includes("inj")) type = "Inj";
            else if (formLower.includes("oint")) type = "Oint";

            return {
                name: productName,                  // ORIGINAL product name — used for display AND search
                nameLower: productName.toLowerCase(), // Pre-computed lowercase for fast search
                generic: generics.join(' + '),
                dosage: dosages.join(' / '),
                type,
                hospitalName: item["Hospital Name"] || ""
            };
        });

        console.log(`Loaded ${medicineCache.length} medicines into cache.`);
        return medicineCache;
    } catch (err) {
        console.error("Error loading medicine list:", err);
        return [];
    }
};

// ─── Reusable medicine ranking helper ─────────────────────────────────────────
// Used by BOTH manual search and voice matching for consistent behavior.
// Returns ALL matches, sorted: startsWith first, then contains.
// No result limit.
const rankMedicines = (query, allMedicines, searchField = 'name', userHospitalName = "") => {
    if (!query) return [];

    const q = query.toLowerCase().trim();
    if (q.length === 0) return [];

    // Separate global and hospital-specific medicines
    const globalMedicines = allMedicines.filter(m => !m.hospitalName);
    const hospitalMedicines = allMedicines.filter(m => m.hospitalName === userHospitalName);

    const searchInList = (list) => {
        const startsWithMatches = [];
        const containsMatches = [];

        for (const med of list) {
            let fieldToSearch = med.nameLower;
            if (searchField === 'composition') {
                fieldToSearch = (med.generic || "").toLowerCase();
            }

            if (fieldToSearch.startsWith(q)) {
                startsWithMatches.push(med);
            } else if (fieldToSearch.includes(q)) {
                containsMatches.push(med);
            }
        }

        startsWithMatches.sort((a, b) => a.nameLower.localeCompare(b.nameLower));
        containsMatches.sort((a, b) => a.nameLower.localeCompare(b.nameLower));

        return [...startsWithMatches, ...containsMatches];
    };

    // First search in global medicines
    let results = searchInList(globalMedicines);

    // If no results found in global, search in hospital-specific medicines
    if (results.length === 0 && userHospitalName) {
        console.log(`[Search] No global matches for "${query}", checking hospital medicines for "${userHospitalName}"`);
        results = searchInList(hospitalMedicines);
    }

    return results;
};

// ─── Manual search endpoint ──────────────────────────────────────────────────
export const searchMedicines = async (req, res) => {
    const query = (req.query.q || "").trim();
    const field = (req.query.field || "name").trim(); // new optional search field filter
    console.log(`Hitting searchMedicines, the query is: ${query}, field: ${field}`);

    // Minimum 3 characters to avoid excessive load
    if (query.length < 3) return res.json([]);

    let userHospitalName = "";
    if (req.user?.hospitalId) {
        const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospitalId } });
        if (hospital) userHospitalName = hospital.name;
    }

    const medicines = loadMedicines();
    const results = rankMedicines(query, medicines, field, userHospitalName);

    // Return ALL matches — no .slice() cap
    // Map to return format (exclude internal nameLower field)
    const response = results.map(m => ({
        name: m.name,
        composition: m.generic
    }));

    console.log(`Search "${query}" by ${field} → ${response.length} results`);
    res.json(response);
};

// ─── Helper: Extract numeric dosage value from a dosage string ──────────────
const extractDosageNumber = (dosageStr) => {
    if (!dosageStr) return 0;
    const str = String(dosageStr).toLowerCase().trim();
    const match = str.match(/([\d.]+)\s*(mg|g|mcg|ml|iu)?/i);
    if (!match) return 0;
    let value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'g') value *= 1000;
    if (unit === 'mcg') value /= 1000;
    return value;
};

// ─── Helper: Voice matching — uses the same rankMedicines logic ─────────────
// Step 1: Strict full-name ranking
// Step 2: Fallback to prefix if Step 1 finds nothing
// Returns { bestMatch, candidates, matchType }
const findBestMatch = (spokenName, spokenDosage, allMedicines, userHospitalName = "") => {
    if (!spokenName) return { bestMatch: null, candidates: [], matchType: "none" };

    const query = spokenName.toLowerCase().trim();

    // ── STEP 1: Use the same rankMedicines function ───────────────────────
    let results = rankMedicines(query, allMedicines, 'name', userHospitalName);
    let matchType = "full_name";

    // ── STEP 2: Fallback — use first 4 letters (or 3 if name is short) ────
    if (results.length === 0) {
        const prefixLen = query.length >= 4 ? 4 : Math.min(query.length, 3);
        const prefix = query.substring(0, prefixLen);

        console.log(`[voice-match] Step 1 failed for "${query}", falling back to prefix "${prefix}"`);

        results = rankMedicines(prefix, allMedicines, 'name', userHospitalName);
        matchType = "prefix_fallback";
    }

    if (results.length === 0) {
        console.log(`[voice-match] No match found for "${query}" in both steps`);
        return { bestMatch: null, candidates: [], matchType: "none" };
    }

    console.log(`[voice-match] "${query}" → ${results.length} results (${matchType})`);

    // Best match is the first result (startsWith matches come first due to rankMedicines)
    const bestMatch = results[0];

    // Return ALL candidates (no cap) — let frontend/voice flow handle display
    const candidates = results;

    // Single candidate? Return immediately
    if (candidates.length === 1) {
        return { bestMatch, candidates: [], matchType };
    }

    // Multiple candidates: return all for dropdown
    return { bestMatch, candidates, matchType };
};

// ─── Voice match endpoint ──────────────────────────────────────────────────
export const voiceMatchMedicines = async (req, res) => {
    try {
        const { medicines: spokenMedicines } = req.body;

        if (!spokenMedicines || !Array.isArray(spokenMedicines) || spokenMedicines.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No medicines provided in request body"
            });
        }

        console.log("[voice-match] Received", spokenMedicines.length, "medicines to match");

        let userHospitalName = "";
        if (req.user?.hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospitalId } });
            if (hospital) userHospitalName = hospital.name;
        }

        const allMedicines = loadMedicines();
        const results = [];

        for (const spoken of spokenMedicines) {
            const spokenName = (spoken.spoken_name || "").trim();
            const spokenDosage = (spoken.dosage || "").trim();

            console.log(`[voice-match] Matching: "${spokenName}" dosage: "${spokenDosage}"`);

            const { bestMatch, candidates, matchType } = findBestMatch(spokenName, spokenDosage, allMedicines, userHospitalName);

            if (bestMatch) {
                console.log(`[voice-match] ✅ Matched "${spokenName}" → "${bestMatch.name}" via ${matchType}`);

                const result = {
                    matched: true,
                    matchType,
                    spoken_name: spokenName,
                    name: bestMatch.name,
                    composition: bestMatch.generic || "",
                    morning: Number(spoken.morning) || 0,
                    afternoon: Number(spoken.afternoon) || 0,
                    night: Number(spoken.night) || 0,
                    timing: spoken.timing || "",
                    duration: spoken.duration || "",
                    instruction: spoken.instruction || ""
                };

                // Include candidates for dropdown if there are multiple options
                if (candidates.length > 1) {
                    result.candidates = candidates.map(c => ({
                        name: c.name,
                        composition: c.generic || ""
                    }));
                }

                results.push(result);
            } else {
                console.log(`[voice-match] ❌ No match for "${spokenName}"`);

                results.push({
                    matched: false,
                    matchType: "none",
                    spoken_name: spokenName,
                    name: spokenName,
                    composition: "",
                    morning: Number(spoken.morning) || 0,
                    afternoon: Number(spoken.afternoon) || 0,
                    night: Number(spoken.night) || 0,
                    timing: spoken.timing || "",
                    duration: spoken.duration || "",
                    instruction: spoken.instruction || "",
                    message: "No medicines matched"
                });
            }
        }

        console.log("[voice-match] Returning", results.length, "results");
        res.json({ success: true, medicines: results });

    } catch (err) {
        console.error("[voice-match] Error:", err);
        res.status(500).json({
            success: false,
            error: "Voice medicine matching failed",
            details: err.message
        });
    }
};

// ─── Add medicine to JSON storage ──────────────────────────────────────────
export const addMedicine = async (req, res) => {
    try {
        const { productName, composition, productForm } = req.body;
        if (!productName) {
            return res.status(400).json({ success: false, error: "Product Name is required" });
        }

        let hospitalName = "";
        const hospitalId = req.user?.hospitalId;
        
        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }});
            if (hospital) hospitalName = hospital.name;
        }

        const customPath = path.join(__dirname, '..', 'Hospital_Medicines.json');
        let customData = [];
        if (fs.existsSync(customPath)) {
            try {
                customData = JSON.parse(fs.readFileSync(customPath, 'utf8'));
            } catch (e) {}
        }

        // Add new entry
        customData.push({
            "Product Name": productName,
            "Composition": composition || "",
            "Product Form": productForm || "",
            "Hospital Name": hospitalName,
            "Hospital ID": hospitalId || "",
            "Created At": new Date().toISOString()
        });

        // Save back to JSON (fast)
        fs.writeFileSync(customPath, JSON.stringify(customData, null, 2));
        
        // Invalidate cache so it reloads on next search
        medicineCache = null;
        
        console.log("--------------------------------------------------");
        console.log(`[MEDICINE_ADD_SUCCESS]`);
        console.log(`Product: ${productName}`);
        console.log(`Hospital: ${hospitalName || 'Global'}`);
        console.log(`Hospital ID: ${hospitalId || 'N/A'}`);
        console.log(`Time: ${new Date().toISOString()}`);
        console.log("--------------------------------------------------");
        
        res.json({ success: true, message: "Medicine added successfully" });
    } catch (err) {
        console.error("Error adding medicine:", err);
        res.status(500).json({ success: false, error: "Failed to add medicine" });
    }
};

// ─── Multer Config for Bulk Upload ──────────────────────────────────────────
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            let hospitalName = "Global";
            if (req.user?.hospitalId) {
                const hospital = await prisma.hospital.findUnique({ where: { id: req.user.hospitalId } });
                if (hospital) hospitalName = hospital.name.replace(/[^a-z0-9]/gi, '_');
            }
            const uploadPath = path.join(__dirname, '..', 'uploads', 'medicines', hospitalName);
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
export const uploadMedicines = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        
        let hospitalName = "";
        let hospitalId = req.user?.hospitalId;
        
        if (hospitalId) {
            const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }});
            if (hospital) hospitalName = hospital.name;
        }

        // If it's an Excel file, parse and add to Hospital_Medicines.json
        if (['.xlsx', '.xls', '.xlsb', '.csv'].includes(fileExt)) {
            console.log(`[Upload] Parsing Excel/CSV file: ${req.file.originalname}`);
            const workbook = xlsx.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const excelData = xlsx.utils.sheet_to_json(sheet);

            if (excelData.length > 0) {
                const customPath = path.join(__dirname, '..', 'Hospital_Medicines.json');
                let customData = [];
                if (fs.existsSync(customPath)) {
                    try {
                        customData = JSON.parse(fs.readFileSync(customPath, 'utf8'));
                    } catch (e) {}
                }

                const newMedicines = excelData.map(item => ({
                    "Product Name": item["Product Name"] || item["name"] || item["Product"] || "",
                    "Composition": item["Composition"] || item["generic"] || item["content"] || "",
                    "Product Form": item["Product Form"] || item["type"] || item["form"] || "Tablet",
                    "Hospital Name": hospitalName,
                    "Hospital ID": hospitalId || "",
                    "Source File": req.file.originalname,
                    "Created At": new Date().toISOString()
                })).filter(m => m["Product Name"]);

                customData.push(...newMedicines);
                fs.writeFileSync(customPath, JSON.stringify(customData, null, 2));
                
                // Invalidate cache
                medicineCache = null;
                
                console.log(`[Upload] Added ${newMedicines.length} medicines from ${req.file.originalname}`);
            }
        } else {
            console.log(`[Upload] Non-Excel file saved: ${req.file.originalname}. (Not parsed for search)`);
        }

        res.json({ 
            success: true, 
            message: "File uploaded successfully", 
            filename: req.file.originalname,
            path: req.file.path 
        });
    } catch (err) {
        console.error("Error uploading medicines:", err);
        res.status(500).json({ success: false, error: "Failed to upload file" });
    }
};
