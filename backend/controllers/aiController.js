import { callGroq } from "../services/groqService.js";

export const extractAiData = async (req, res) => {
  try {
    const { text, type } = req.body;

    if (!text || !type) {
      return res.status(400).json({ error: "Missing text or type" });
    }

    let prompt = "";

    const englishConstraint = " IMPORTANT: All extracted text values (medicine names, symptoms, notes, etc.) MUST be returned in English ONLY. If the input is in another language, translate it to English before returning.";

    if (type === "symptoms") {
      prompt = `Extract only medical symptoms from this text and return JSON:
{ "symptoms": [] }` + englishConstraint;
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
      prompt = `You are a medical prescription parser. Extract ALL medicines from the spoken text.

For EACH medicine, extract these fields:
- "medicine": the medicine/drug name only (e.g. "Paracetamol", "Azithromycin", "Dolo")
- "dosage": the dosage mentioned (e.g. "650mg", "500mg", "10ml"). Keep as spoken.
- "m": morning frequency as a number (1, 0.5, 0). Default 0 if not mentioned.
- "a": afternoon frequency as a number (1, 0.5, 0). Default 0 if not mentioned.
- "n": night frequency as a number (1, 0.5, 0). Default 0 if not mentioned.
- "timing": one of: "After Food", "Before Food", "Empty Stomach", "Bedtime", "SOS", or "". 
  Map spoken phrases: "after food"/"after lunch"/"after dinner"/"after breakfast" → "After Food",
  "before food"/"before lunch"/"before dinner"/"before breakfast" → "Before Food",
  "empty stomach" → "Empty Stomach", "bedtime"/"before sleep"/"at night" → "Bedtime",
  "when needed"/"if required"/"sos"/"only if pain" → "SOS".
- "duration": number of days as a NUMBER only. Extract from phrases like "for 5 days" → 5, "for one week" → 7, "for 2 weeks" → 14, "for 10 days" → 10, "for a month" → 30. If not mentioned, use 0.
- "instruction": any special instruction like "take with warm water", "take after lunch", "apply on affected area", "use only when required", "do not take on empty stomach". If none mentioned, use "".

Frequency mapping:
- "once daily" or "once a day" → m:1, a:0, n:0
- "twice daily" or "twice a day" → m:1, a:0, n:1
- "thrice daily" or "three times a day" → m:1, a:1, n:1
- "morning one afternoon zero night one" → m:1, a:0, n:1
- "morning 1 night 1" → m:1, a:0, n:1
- Numbers spoken as words: "one" → 1, "half" → 0.5, "zero" → 0

IMPORTANT: Return a JSON object with a "medicines" array containing ALL extracted medicines.
If only one medicine is found, still return it inside the array.

Example output:
{
  "medicines": [
    {
      "medicine": "Paracetamol",
      "dosage": "650mg",
      "m": 1,
      "a": 0,
      "n": 1,
      "timing": "After Food",
      "duration": 5,
      "instruction": "Take after lunch"
    },
    {
      "medicine": "Azithromycin",
      "dosage": "500mg",
      "m": 1,
      "a": 0,
      "n": 0,
      "timing": "After Food",
      "duration": 3,
      "instruction": "Take with warm water"
    }
  ]
}` + englishConstraint;
    } else if (type === "diagnosis") {
      prompt = `Extract only the clinical diagnosis from this text. Return JSON exactly like:
{ "diagnosis": "Hypertension" }` + englishConstraint;
    } else if (type === "notes") {
      prompt = `Extract the clinical notes, remarks, or initial observation from this text. Return JSON exactly like:
{ "notes": "" }` + englishConstraint;
    } else if (type === "diseases_only") {
      prompt = `Extract ONLY the medical diseases/symptoms from this text. Capitalize the first letter of each disease. Return them as a comma-separated string. Return JSON exactly like:
{ "diseases": "Fever, Cold, Headache" }` + englishConstraint;
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
