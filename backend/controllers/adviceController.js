import { callGroq } from "../services/groqService.js";
import { prisma } from "../config/db.js";

const SYSTEM_PROMPT = `You are a helpful medical assistant. 
Review the doctor's advice and extract the key notes and any follow-up return-after days.

Format:
Return ONLY valid JSON:
{
  "notes": "Advice regarding medicine and rest.",
  "return_after_days": 7
}
`;

export async function extractAdvice(req, res) {
  try {
    const { text, visitId } = req.body;

    console.log("[AdviceController] Received request with text length:", text?.length);

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Missing text" });
    }

    console.log("[AdviceController] Calling Groq...");
    const result = await callGroq(SYSTEM_PROMPT, text.trim());
    console.log("[AdviceController] Groq result:", JSON.stringify(result));

    if (visitId) {
      console.log("[AdviceController] Updating DB via Prisma...");
      
      const days = parseInt(result.return_after_days);
      const followUpDate = (!isNaN(days) && days > 0)
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) 
        : null;

      let consultation = await prisma.consultation.findUnique({ where: { visitId } });
      if (consultation) {
          const currentNotes = consultation.consultationNotes || "";
          const newNotes = result.notes || "";
          
          await prisma.consultation.update({
              where: { id: consultation.id },
              data: {
                  consultationNotes: currentNotes ? `${currentNotes}\n${newNotes}` : newNotes,
                  followUpDate: followUpDate || consultation.followUpDate
              }
          });
      } else if (req.user && req.user.role === "DOCTOR") {
          // Create consultation if it doesn't exist yet
          await prisma.consultation.create({
              data: {
                  visitId,
                  doctorId: req.user.userId,
                  consultationNotes: result.notes || null,
                  followUpDate
              }
          });
      }
      
      console.log("[AdviceController] Follow up saved to DB");
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[AdviceController] FATAL Error:", error);
    return res.status(500).json({ 
      error: "Failed to extract advice.", 
      details: error.message
    });
  }
}
