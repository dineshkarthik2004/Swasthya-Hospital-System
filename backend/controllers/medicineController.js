import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let medicineCache = null;

const loadMedicines = () => {
    if (medicineCache) return medicineCache;
    try {
        const filePath = path.join(__dirname, '..', 'Medicine_List.xlsb');
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Map to a cleaner structure
        medicineCache = data.map(item => {
            const productName = item["Product Name"] || "";
            const composition = item["Composition"] || "";
            const productForm = item["Product Form"] || "";

            // CLEAN PRODUCT NAME
            // Remove dosage patterns like "500mg", "1g", "100/325"
            // Also remove words like "Tablet", "Capsule" from the name if they exist
            let cleanName = productName
                .replace(/\d+\s*(mg|g|mcg|ml|tab|cap|tablet|capsule|pill|syp|syr|inj|ointment|cream)/i, '')
                .replace(/\d+\/\d+/g, '') // remove "100/325"
                .replace(/\s(Tablet|Capsule|Syrup|Injection|Ointment|Pill|Cap|Tab|Syp|Inj)\b/i, '')
                .replace(/\s+/g, ' ')
                .trim();

            // EXTRACT GENERIC AND DOSAGE FROM COMPOSITION
            // Format is often "Drug A (100mg) + Drug B (500mg)"
            let generics = [];
            let dosages = [];

            // Find all (dosage) matches
            const dosageMatches = [...composition.matchAll(/\((.*?)\)/g)];
            if (dosageMatches.length > 0) {
                dosages = dosageMatches.map(m => m[1]);
                // Remove (dosage) from composition to get generics
                generics = [composition.replace(/\(.*?\)/g, '').replace(/\+/g, '/').replace(/\s+/g, ' ').trim()];
            } else {
                generics = [composition];
            }

            return {
                name: cleanName || productName,
                fullProductName: productName, // Keep original for dosage matching
                generic: generics.join(' + '),
                dosage: dosages.join(' / '),
                type: productForm.toLowerCase().includes("tab") ? "Tab" :
                    productForm.toLowerCase().includes("cap") ? "Cap" :
                        productForm.toLowerCase().includes("syr") || productForm.toLowerCase().includes("syp") ? "Syp" :
                            productForm.toLowerCase().includes("inj") ? "Inj" :
                                productForm.toLowerCase().includes("oint") ? "Oint" : "Other"
            };
        });

        console.log(`Loaded ${medicineCache.length} medicines into cache.`);
        return medicineCache;
    } catch (err) {
        console.error("Error loading medicine list:", err);
        return [];
    }
};

// ─── Existing search endpoint (unchanged) ───────────────────────────────────
export const searchMedicines = async (req, res) => {
    console.log("Hitting searchMedicines,the query is ", req.query.q)
    const query = req.query.q || "";
    if (query.length < 2) return res.json([]);

    const medicines = loadMedicines();
    const results = medicines
        .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10); // Limit to top 10 results
    console.log(results);
    res.json(results);
};

// ─── Helper: Extract numeric dosage value from a dosage string ──────────────
const extractDosageNumber = (dosageStr) => {
    if (!dosageStr) return 0;
    const str = String(dosageStr).toLowerCase().trim();
    // Match patterns like "500mg", "500 mg", "1.5g", "250 mcg", "10ml"
    const match = str.match(/([\d.]+)\s*(mg|g|mcg|ml|iu)?/i);
    if (!match) return 0;
    let value = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    // Normalize to mg for comparison
    if (unit === 'g') value *= 1000;
    if (unit === 'mcg') value /= 1000;
    return value;
};

// ─── Helper: Score medicines against a query (used by voice matching) ───────
const scoreMedicines = (query, allMedicines) => {
    const scored = [];

    for (const med of allMedicines) {
        const medName = med.name.toLowerCase().trim();
        let score = 0;

        // Priority 1 (100): Exact full name match
        if (medName === query) {
            score = 100;
        }
        // Priority 2 (90): Medicine name starts with full spoken name
        else if (medName.startsWith(query)) {
            score = 90;
        }
        // Priority 3 (80): Spoken name starts with medicine name
        else if (query.startsWith(medName)) {
            score = 80;
        }
        // Priority 4 (70): Full spoken name appears as a whole word in medicine name
        else if (query.length >= 3 && new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(medName)) {
            score = 70;
        }
        // Priority 5 (50): Medicine name contains full spoken name as substring (min 4 chars)
        else if (query.length >= 4 && medName.includes(query)) {
            score = 50;
        }

        if (score > 0) {
            scored.push({ med, score });
        }
    }

    return scored;
};

// ─── Helper: Voice matching — 2-step strategy ──────────────────────────────
// Step 1: Strict full-name match
// Step 2: Fallback to first 4 letters if Step 1 finds nothing
// Returns { bestMatch, candidates, matchType }
const findBestMatch = (spokenName, spokenDosage, allMedicines) => {
    if (!spokenName) return { bestMatch: null, candidates: [], matchType: "none" };

    const query = spokenName.toLowerCase().trim();
    const spokenDosageNum = extractDosageNumber(spokenDosage);

    // ── STEP 1: Strict full-name matching ──────────────────────────────────
    let scored = scoreMedicines(query, allMedicines);

    let matchType = "full_name";

    // ── STEP 2: Fallback — use first 4 letters (or 3 if name is short) ────
    if (scored.length === 0) {
        const prefixLen = query.length >= 4 ? 4 : Math.min(query.length, 3);
        const prefix = query.substring(0, prefixLen);

        console.log(`[voice-match] Step 1 failed for "${query}", falling back to prefix "${prefix}"`);

        // Search using prefix — startsWith only (not includes, to avoid false positives)
        for (const med of allMedicines) {
            const medName = med.name.toLowerCase().trim();
            if (medName.startsWith(prefix)) {
                scored.push({ med, score: 30 }); // Lower score for fallback matches
            }
        }
        matchType = "prefix_fallback";
    }

    if (scored.length === 0) {
        console.log(`[voice-match] No match found for "${query}" in both steps`);
        return { bestMatch: null, candidates: [], matchType: "none" };
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Get top-tier candidates (same highest score)
    const topScore = scored[0].score;
    let candidates = scored.filter(s => s.score === topScore).map(s => s.med);

    console.log(`[voice-match] "${query}" → ${candidates.length} candidates at score ${topScore} (${matchType})`);

    // ── Single candidate? Return immediately ───────────────────────────────
    if (candidates.length === 1) {
        return { bestMatch: candidates[0], candidates: [], matchType };
    }

    // ── Multiple candidates: always show dropdown, let doctor pick ──────────
    // Pre-fill the first match, but show all options in dropdown
    return { bestMatch: candidates[0], candidates: candidates.slice(0, 10), matchType };
};

// ─── NEW: Voice match endpoint ──────────────────────────────────────────────
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

        const allMedicines = loadMedicines();
        const results = [];

        for (const spoken of spokenMedicines) {
            const spokenName = (spoken.spoken_name || "").trim();
            const spokenDosage = (spoken.dosage || "").trim();

            console.log(`[voice-match] Matching: "${spokenName}" dosage: "${spokenDosage}"`);

            const { bestMatch, candidates, matchType } = findBestMatch(spokenName, spokenDosage, allMedicines);

            if (bestMatch) {
                console.log(`[voice-match] ✅ Matched "${spokenName}" → "${bestMatch.name}" (${bestMatch.dosage}) via ${matchType}`);

                // Smart dosage: prefer dataset dosage, use voice dosage as fallback
                let finalDosage = bestMatch.dosage || spokenDosage || "";

                const result = {
                    matched: true,
                    matchType,
                    spoken_name: spokenName,
                    name: bestMatch.name,
                    generic: bestMatch.generic || "",
                    dosage: finalDosage,
                    type: bestMatch.type || "Tab",
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
                        generic: c.generic || "",
                        dosage: c.dosage || "",
                        type: c.type || "Tab"
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
                    generic: "",
                    dosage: spokenDosage || "",
                    type: "",
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
