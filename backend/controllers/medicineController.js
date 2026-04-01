import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let medicineCache = null;

const loadMedicines = () => {
    if (medicineCache) return medicineCache;
    try {
        const filePath = path.join(__dirname, '..', '..', 'Medicine_List.xlsb');
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

export const searchMedicines = async (req, res) => {
    const query = req.query.q || "";
    if (query.length < 2) return res.json([]);
    
    const medicines = loadMedicines();
    const results = medicines
        .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10); // Limit to top 10 results
        
    res.json(results);
};
