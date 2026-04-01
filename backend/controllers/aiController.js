import { callGroq } from "../services/groqService.js";

export const extractAiData = async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text || !type) {
      return res.status(400).json({ error: "Missing text or type" });
    }

    let prompt = "";

    if (type === "symptoms") {
      prompt = `Extract only medical symptoms from this text and return JSON:
{ "symptoms": [] }`;
    } else if (type === "vitals") {
      prompt = `Extract vitals like bp, pulse, temperature, weight, and height from text. Return JSON ONLY exactly like:
{ "bp": "", "pulse": "", "temperature": "", "weight": "", "height": "" }`;
    } else if (type === "vital_bp") {
      prompt = `Extract ONLY the blood pressure reading from this text. Return JSON exactly like: { "bp": "120/80" }`;
    } else if (type === "vital_pulse") {
      prompt = `Extract ONLY the pulse/heart rate from this text. Return JSON exactly like: { "pulse": "72" }`;
    } else if (type === "vital_temperature") {
      prompt = `Extract ONLY the body temperature from this text. Return JSON exactly like: { "temperature": "98.6" }`;
    } else if (type === "vital_weight") {
      prompt = `Extract ONLY the body weight from this text. Return JSON exactly like: { "weight": "70" }`;
    } else if (type === "vital_height") {
      prompt = `Extract ONLY the height from this text. Return JSON exactly like: { "height": "175" }`;
    } else if (type === "prescription") {
      prompt = `Extract structured prescription data.
type (e.g. Tab, Syp, Cap, Inj), medicine, dosage, genericName (e.g. Paracetamol), timing (e.g. After Food/Before Food), and duration (days).
Extract the pill frequency precisely into three separate numerical fields:
"m" for morning (e.g., 1 for one pill, 0.5 for half a pill, 0 for none)
"a" for afternoon
"n" for night
Return JSON ONLY exactly like this format:
{
"type": "Tab",
"medicine": "Dolo",
"genericName": "Paracetamol",
"dosage": "650mg",
"m": 1,
"a": 0,
"n": 0.5,
"timing": "After Food",
"duration": "3"
}`;
    } else if (type === "diagnosis") {
      prompt = `Extract only the clinical diagnosis from this text. Return JSON exactly like:
{ "diagnosis": "Hypertension" }`;
    } else if (type === "notes") {
      prompt = `Extract the clinical notes, remarks, or initial observation from this text. Return JSON exactly like:
{ "notes": "Patient complains of headache for 3 days." }`;
    } else if (type === "diseases_only") {
      prompt = `Extract ONLY the medical diseases/symptoms from this text. Capitalize the first letter of each disease. Return them as a comma-separated string. Return JSON exactly like:
{ "diseases": "Fever, Cold, Headache" }`;
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }

    const structuredData = await callGroq(prompt, text);
    res.json(structuredData);

  } catch (err) {
    console.error("AI Extraction Error:", err);
    res.status(500).json({ error: "AI extraction failed" });
  }
};
