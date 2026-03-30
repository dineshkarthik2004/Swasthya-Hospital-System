import { callGroq } from "../services/groqService.js";

const SYMPTOMS_PROMPT = `Extract all medical symptoms from the following sentence. 
Return only a JSON object containing a "symptoms" array. 
Do not include any extra text. 

Example Output:
{
  "symptoms": ["fever", "cold", "stomach pain"]
}`;

export async function extractSymptoms(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { text } = data;
    console.log("[SymptomsController] Processing symptoms for text:", text?.substring(0, 50));

    if (!text || typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({ error: "Missing text for symptom extraction" });
    }

    console.log("[SymptomsController] Calling Groq...");
    const result = await callGroq(SYMPTOMS_PROMPT, text.trim());
    
    // Explicitly check for 'symptoms' key to avoid silent failure if AI changes format
    if (!result || !result.symptoms) {
        console.warn("[SymptomsController] Groq returned unexpected format:", result);
        return res.status(200).json({ symptoms: [] });
    }

    console.log("[SymptomsController] Groq extracted symptoms:", JSON.stringify(result.symptoms));
    return res.status(200).json(result);
  } catch (error) {
    console.error("[SymptomsController] Symptom Extraction Error:", error);
    return res.status(500).json({ error: "Failed to extract symptoms.", details: error.message });
  }
}
