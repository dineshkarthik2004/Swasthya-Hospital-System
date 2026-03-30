import { callGroq } from "../services/groqService.js";
import { prisma } from "../config/db.js";

const DOCTOR_SYSTEM_PROMPT = `You are a senior physician. 
Extract the clinical diagnosis and a list of medicines from the transcript.

Rules:
- For medicines, return an array of objects.
- Each medicine object MUST have: {"name": "...", "dosage_morning": number, "dosage_afternoon": number, "dosage_night": number, "instruction": "...", "days": number}
- Use 0 for dosage slots not mentioned.
- Example: "Take Paracetamol 500mg morning and night for 3 days" -> {"name": "Paracetamol 500mg", "dosage_morning": 1, "dosage_afternoon": 0, "dosage_night": 1, "instruction": "After food", "days": 3}
- Return ONLY valid JSON:
{
  "diagnosis": "...",
  "medicines": [...],
  "follow_up": { "instruction": "...", "return_after_days": ... }
}`;

export async function extractPrescription(req, res) {
  try {
    const { text, visitId } = req.body;

    console.log("[DoctorController] Prescription request received");

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Request body must include a non-empty 'text' field." });
    }

    console.log("[DoctorController] Calling Groq...");
    const result = await callGroq(DOCTOR_SYSTEM_PROMPT, text.trim());
    console.log("[DoctorController] Groq extraction complete");

    if (visitId) {
      console.log("[DoctorController] Updating DB via Prisma...");
      
      const days = parseInt(result.follow_up?.return_after_days);
      const followUpDate = (!isNaN(days) && days > 0)
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) 
        : null;

      // Ensure Consultation exists
      let consultation = await prisma.consultation.findUnique({ where: { visitId } });
      if (!consultation && req.user && req.user.role === "DOCTOR") {
          consultation = await prisma.consultation.create({
              data: {
                  visitId,
                  doctorId: req.user.userId,
                  diagnosis: result.diagnosis || null,
                  consultationNotes: result.follow_up?.instruction || null,
                  followUpDate
              }
          });
      } else if (consultation) {
          consultation = await prisma.consultation.update({
              where: { id: consultation.id },
              data: {
                  diagnosis: result.diagnosis || consultation.diagnosis,
                  consultationNotes: result.follow_up?.instruction || consultation.consultationNotes,
                  followUpDate: followUpDate || consultation.followUpDate
              }
          });
      }

      if (consultation && result.medicines && result.medicines.length > 0) {
          // Ensure Prescription exists
          const prescription = await prisma.prescription.upsert({
              where: { consultationId: consultation.id },
              update: {},
              create: { consultationId: consultation.id }
          });

          // Just append items (don't delete existing)
          const itemsData = result.medicines.map(item => ({
              prescriptionId: prescription.id,
              medicineName: item.name,
              dosage: "", // Can be filled if the prompt had a field
              dosageMorning: item.dosage_morning || 0,
              dosageAfternoon: item.dosage_afternoon || 0,
              dosageNight: item.dosage_night || 0,
              frequency: "", 
              days: item.days ? parseInt(item.days) : null,
              instructions: item.instruction || ""
          }));

          await prisma.prescriptionItem.createMany({ data: itemsData });

          // Update visit status
          await prisma.visit.update({
              where: { id: visitId },
              data: { status: "PRESCRIPTION_COMPLETED" }
          });
          
          console.log("[DoctorController] Data saved to DB for visit:", visitId);
      }
    }

    return res.status(200).json({
      extracted: result,
      message: "Prescription extracted successfully"
    });
  } catch (error) {
    console.error("[DoctorController] FATAL Error:", error);
    return res.status(500).json({
      error: "Failed to extract prescription and save to DB.",
      details: error.message,
    });
  }
}
