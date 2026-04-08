import { prisma } from "../config/db.js";

// GET /doctor/assigned
export async function getAssignedPatients(req, res) {
  try {
    const doctorId = req.user.userId;

    // Get visits assigned to this doctor that are not fully completed
    const visits = await prisma.visit.findMany({
      where: {
        doctorId,
        status: {
          in: ["ASSIGNED_TO_DOCTOR", "WAITING", "VITALS_COMPLETED"]
        }
      },
      include: {
        patient: true,
        vitals: true,
        receptionist: { select: { name: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.status(200).json(visits);
  } catch (error) {
    console.error("[ConsultationController] Error getting assigned patients:", error);
    return res.status(500).json({ error: "Failed to get assigned patients" });
  }
}

export async function finalizeConsultation(req, res) {
  try {
    const { 
      visitId, 
      diagnosis, 
      notes, 
      prescription, 
      adviceInstructions, 
      followUpDate, 
      labPending,
      feeType
    } = req.body;
    const doctorId = req.user.userId;

    if (!visitId) return res.status(400).json({ error: "Missing visitId" });

    const prescriptionList = Array.isArray(prescription) ? prescription.map(item => ({
      medicineName: item.medicineName || "Unknown",
      composition: item.composition || "",
      dosageMorning: Number(item.dosageMorning) || 0,
      dosageAfternoon: Number(item.dosageAfternoon) || 0,
      dosageNight: Number(item.dosageNight) || 0,
      days: Number(item.days) || 1,
      instructions: item.instructions || ""
    })) : [];
    
    console.log("Finalize Data:", {
      visitId,
      diagnosis,
      consultationNotes: notes,
      adviceInstructions,
      followUpDate,
      labPending,
      feeType,
      prescription: prescriptionList
    });

    const followUp = (followUpDate && !isNaN(new Date(followUpDate).getTime())) ? new Date(followUpDate) : null;

    await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: "PRESCRIPTION_COMPLETED",
        feeType: feeType || undefined, // Save fee type to visit
        consultation: {
          upsert: {
            create: {
              doctorId,
              diagnosis: diagnosis || "Consultation Completed",
              consultationNotes: notes || "",
              adviceInstructions: adviceInstructions || "",
              followUpDate: followUp,
              labPending: !!labPending,
              ...(prescriptionList.length > 0 && {
                prescription: {
                  create: {
                    items: {
                      create: prescriptionList
                    }
                  }
                }
              })
            },
            update: {
              diagnosis: diagnosis || "Consultation Completed",
              consultationNotes: notes || "",
              adviceInstructions: adviceInstructions || "",
              followUpDate: followUp,
              labPending: !!labPending,
              prescription: prescriptionList.length > 0 ? {
                upsert: {
                   create: {
                     items: { create: prescriptionList }
                   },
                   update: {
                     items: {
                       deleteMany: {},
                       create: prescriptionList
                     }
                   }
                }
              } : undefined
            }
          }
        }
      }
    });

    return res.status(200).json({ success: true, message: "Consultation finalized successfully" });
  } catch (err) {
    console.error("[ConsultationController] Finalize Error details:", err);
    if (err.meta) console.error("Prisma Error Meta:", err.meta);
    if (err.code) console.error("Prisma Error Code:", err.code);
    return res.status(500).json({ error: "Failed to finalize consultation", details: err.message });
  }
}

// POST /visits/:id/consultation
// Manual fallback if not using Voice/Groq
export async function saveConsultation(req, res) {
  try {
    const { id } = req.params; // visitId
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { diagnosis, notes, followUpDate } = data;
    const doctorId = req.user.userId;

    const consultation = await prisma.consultation.upsert({
      where: { visitId: id },
      update: {
        diagnosis,
        consultationNotes: notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      create: {
        visitId: id,
        doctorId,
        diagnosis,
        consultationNotes: notes,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      }
    });

    // Update visit status
    await prisma.visit.update({
      where: { id },
      data: { status: "CONSULTED" }
    });

    return res.status(200).json(consultation);
  } catch (error) {
    console.error("[ConsultationController] Error saving consultation:", error);
    return res.status(500).json({ error: "Failed to save consultation" });
  }
}

// PATCH /visits/:id/complete
export async function completeConsultation(req, res) {
  try {
    const { id } = req.params;

    const visit = await prisma.visit.update({
      where: { id },
      data: { status: "PRESCRIPTION_COMPLETED" }
    });

    return res.status(200).json(visit);
  } catch (error) {
    console.error("[ConsultationController] Error completing consultation:", error);
    return res.status(500).json({ error: "Failed to complete consultation" });
  }
}

// POST /visits/:id/prescription
// Manual saving of prescription
export async function savePrescription(req, res) {
  try {
    const { id } = req.params; // visitId
    const { items } = req.body; // array of items

    // Find the consultation for this visit
    let consultation = await prisma.consultation.findUnique({ where: { visitId: id } });
    if (!consultation) {
      if (req.user.role !== "DOCTOR") {
          return res.status(403).json({ error: "Consultation not created yet" });
      }
      // Create empty consultation to attach prescription
      consultation = await prisma.consultation.create({
          data: { visitId: id, doctorId: req.user.userId }
      });
    }

    // Upsert Prescription
    const prescription = await prisma.prescription.upsert({
      where: { consultationId: consultation.id },
      update: {},
      create: { consultationId: consultation.id }
    });

    // Delete old items and insert new ones
    if (items && items.length > 0) {
      await prisma.prescriptionItem.deleteMany({
        where: { prescriptionId: prescription.id }
      });

      const itemsData = items.map(item => ({
        prescriptionId: prescription.id,
        medicineName: item.medicineName || item.name,
        composition: item.composition || "",
        dosageMorning: item.dosageMorning || 0,
        dosageAfternoon: item.dosageAfternoon || 0,
        dosageNight: item.dosageNight || 0,
        frequency: item.frequency || "",
        days: item.days ? parseInt(item.days) : null,
        instructions: item.instructions || item.instruction || ""
      }));

      await prisma.prescriptionItem.createMany({ data: itemsData });
    }

    // Update visit status
    await prisma.visit.update({
      where: { id },
      data: { status: "PRESCRIPTION_COMPLETED" }
    });

    const populatedPrescription = await prisma.prescription.findUnique({
      where: { id: prescription.id },
      include: { items: true }
    });

    return res.status(200).json(populatedPrescription);
  } catch (error) {
    console.error("[ConsultationController] Error saving prescription:", error);
    return res.status(500).json({ error: "Failed to save prescription" });
  }
}
