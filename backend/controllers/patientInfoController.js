// controllers/patientInfoController.js — Extracts patient demographic info
import { callGroq } from "../services/groqService.js";
import db from "../config/db.js";

const SYSTEM_PROMPT = `You are an information extractor. 
Extract the patient's name, age (in years), and gender from the speech.

Rules:
- If a value is missing or unclear, return null for that field.
- Remove filler words.
- Return ONLY valid JSON in this exact format:
{
  "name": "John Doe",
  "age": 32,
  "gender": "Male"
}`;

export async function extractPatientInfo(req, res) {
  try {
    const { text } = req.body;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    console.log("[PatientInfoController] Request received for text:", text?.substring(0, 50));

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("[PatientInfoController] Calling Groq...");
    const result = await callGroq(SYSTEM_PROMPT, text.trim());
    console.log("[PatientInfoController] Groq Result:", JSON.stringify(result));

    console.log("[PatientInfoController] Updating Session in DB via SQL...");
    const query = `
      UPDATE "Session"
      SET "patientName" = $1, "patientAge" = $2, "patientGender" = $3
      WHERE token = $4
    `;
    
    await db.query(query, [
      result.name || null,
      result.age ? parseInt(result.age) : null,
      result.gender || null,
      token
    ]);
    
    console.log("[PatientInfoController] Session updated successfully");

    return res.status(200).json(result);
  } catch (error) {
    console.error("[PatientInfoController] FATAL Error:", error);
    return res.status(500).json({ error: "Failed to extract info.", details: error.message });
  }
}
