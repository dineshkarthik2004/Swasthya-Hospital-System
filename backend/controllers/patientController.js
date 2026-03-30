import { callGroq } from "../services/groqService.js";
import { prisma } from "../config/db.js";

const PATIENT_SYSTEM_PROMPT = `You are a medical assistant.
Extract a list of symptoms mentioned by the patient.

Rules:
- ONLY return symptoms EXPLICITLY mentioned.
- Format the symptoms as a list of strings.
- Return ONLY valid JSON:
{
  "symptoms": ["fever", "cold", "stomach pain"]
}`;

export async function extractDiseases(req, res) {
  try {
    const { text, visitId } = req.body;

    console.log("[PatientController] Extracted diseases request received");

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("[PatientController] Calling Groq...");
    const result = await callGroq(PATIENT_SYSTEM_PROMPT, text.trim());
    console.log("[PatientController] Groq found symptoms:", result.symptoms);

    if (visitId) {
        console.log("[PatientController] Updating DB via Prisma...");
        const symptomsList = result.symptoms || [];
        
        await prisma.vitals.upsert({
            where: { visitId },
            update: { symptoms: symptomsList },
            create: { visitId, symptoms: symptomsList }
        });
        
        console.log("[PatientController] Visit updated with symptoms");
    }

    result.rawText = text;
    return res.status(200).json(result);
  } catch (error) {
    console.error("[PatientController] FATAL Error:", error);
    return res.status(500).json({ error: "Failed to extract diseases.", details: error.message });
  }
}
