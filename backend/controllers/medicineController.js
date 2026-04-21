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
                type
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
const rankMedicines = (query, allMedicines, searchField = 'name') => {
    if (!query) return [];

    const q = query.toLowerCase().trim();
    if (q.length === 0) return [];

    const startsWithMatches = [];
    const containsMatches = [];

    for (const med of allMedicines) {
        let fieldToSearch = med.nameLower; // default to name search
        // Check if searching by composition
        if (searchField === 'composition') {
             fieldToSearch = (med.generic || "").toLowerCase();
        }

        if (fieldToSearch.startsWith(q)) {
            startsWithMatches.push(med);
        } else if (fieldToSearch.includes(q)) {
            containsMatches.push(med);
        }
    }

    // Sort each group alphabetically by name for consistent ordering
    startsWithMatches.sort((a, b) => a.nameLower.localeCompare(b.nameLower));
    containsMatches.sort((a, b) => a.nameLower.localeCompare(b.nameLower));

    // Priority 1 first, then Priority 2
    return [...startsWithMatches, ...containsMatches];
};

// ─── Manual search endpoint ──────────────────────────────────────────────────
export const searchMedicines = async (req, res) => {
    const query = (req.query.q || "").trim();
    const field = (req.query.field || "name").trim(); // new optional search field filter
    console.log(`Hitting searchMedicines, the query is: ${query}, field: ${field}`);

    // Minimum 3 characters to avoid excessive load
    if (query.length < 3) return res.json([]);

    const medicines = loadMedicines();
    const results = rankMedicines(query, medicines, field);

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
const findBestMatch = (spokenName, spokenDosage, allMedicines) => {
    if (!spokenName) return { bestMatch: null, candidates: [], matchType: "none" };

    const query = spokenName.toLowerCase().trim();

    // ── STEP 1: Use the same rankMedicines function ───────────────────────
    let results = rankMedicines(query, allMedicines);
    let matchType = "full_name";

    // ── STEP 2: Fallback — use first 4 letters (or 3 if name is short) ────
    if (results.length === 0) {
        const prefixLen = query.length >= 4 ? 4 : Math.min(query.length, 3);
        const prefix = query.substring(0, prefixLen);

        console.log(`[voice-match] Step 1 failed for "${query}", falling back to prefix "${prefix}"`);

        results = rankMedicines(prefix, allMedicines);
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

        const allMedicines = loadMedicines();
        const results = [];

        for (const spoken of spokenMedicines) {
            const spokenName = (spoken.spoken_name || "").trim();
            const spokenDosage = (spoken.dosage || "").trim();

            console.log(`[voice-match] Matching: "${spokenName}" dosage: "${spokenDosage}"`);

            const { bestMatch, candidates, matchType } = findBestMatch(spokenName, spokenDosage, allMedicines);

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
