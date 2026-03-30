// controllers/vitalsController.js — Extracts patient vitals
import { callGroq } from "../services/groqService.js";
import { prisma } from "../config/db.js";

const SYSTEM_PROMPT = `You are a medical information extractor. 
Extract only the mentioned vital signs (blood pressure, pulse/heart rate, temperature, weight).

Rules:
- If a value is missing or unclear, return null for that field.
- For BP, extract it as a string like "120/80".
- For Pulse (bpm), Temp (°F/°C), Weight (kg/lbs), extract just the number or the number with unit if specified.
- Remove filler words.
- Return ONLY valid JSON in this exact format:
{
  "bp": "120/80",
  "pulse": "72",
  "temperature": "98.2",
  "weight": "70"
}`;

export async function extractVitals(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { text, visitId } = data;

    console.log("[VitalsController] Request received for text:", text?.substring(0, 50));

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("[VitalsController] Calling Groq...");
    const result = await callGroq(SYSTEM_PROMPT, text.trim());
    console.log("[VitalsController] Groq extracted vitals:", JSON.stringify(result));

    if (visitId) {
      console.log("[VitalsController] Upserting Vitals in DB via Prisma...");
      await prisma.vitals.upsert({
        where: { visitId },
        update: {
          bloodPressure: result.bp || null,
          pulse: result.pulse || null,
          temperature: result.temperature || null,
          weight: result.weight || null
        },
        create: {
          visitId,
          bloodPressure: result.bp || null,
          pulse: result.pulse || null,
          temperature: result.temperature || null,
          weight: result.weight || null
        }
      });
      
      // Update visit status
      await prisma.visit.update({
        where: { id: visitId },
        data: { status: "VITALS_COMPLETED" }
      });
      console.log("[VitalsController] Vitals saved to DB for visit:", visitId);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[VitalsController] FATAL Error:", error);
    return res.status(500).json({ error: "Failed to extract vitals.", details: error.message });
  }
}
export async function saveVitalsManual(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    let { visitId, bloodPressure, pulse, temperature, weight, sugar } = data;
    
    // Also accept it from URL parameters if provided in the path mapping
    visitId = visitId || req.params.visitId || req.params.id;

    if (!visitId) return res.status(400).json({ error: "Visit ID is required" });

    console.log("Incoming visitId:", visitId);

    const existingVitals = await prisma.vitals.findFirst({
      where: { visitId }
    });

    console.log("Existing record:", existingVitals);

    let vitals;

    if (existingVitals) {
      vitals = await prisma.vitals.update({
        where: { id: existingVitals.id },
        data: {
          bloodPressure: bloodPressure ? String(bloodPressure) : null,
          pulse: pulse ? String(pulse) : null,
          temperature: temperature ? String(temperature) : null,
          weight: weight ? String(weight) : null
        }
      });
    } else {
      vitals = await prisma.vitals.create({
        data: {
          visitId,
          bloodPressure: bloodPressure ? String(bloodPressure) : null,
          pulse: pulse ? String(pulse) : null,
          temperature: temperature ? String(temperature) : null,
          weight: weight ? String(weight) : null
        }
      });
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: "VITALS_COMPLETED" }
    });

    return res.status(200).json(vitals);
  } catch (error) {
    console.error("[VitalsController] Error saving vitals manual:", error);
    return res.status(500).json({ error: "Failed to save vitals manual" });
  }
}
