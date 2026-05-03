import { prisma } from "../config/db.js";

// GET /patients — list patients (with search/filter)
export async function listPatients(req, res) {
  try {
    const { search } = req.query;
    
    const where = {};
    if (req.user.hospitalId) {
      where.hospitalId = req.user.hospitalId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } }
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(patients);
  } catch (error) {
    console.error("[PatientMgmt] Error listing patients:", error);
    return res.status(500).json({ error: "Failed to list patients" });
  }
}

// POST /patients — register new patient
export async function createPatient(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "Invalid input" });
    const { name, phone, email, dateOfBirth, gender, bloodGroup, address } = data;
    
    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        bloodGroup,
        address,
        registeredById: req.user.userId,
        hospitalId: req.user.hospitalId
      }
    });

    return res.status(201).json(patient);
  } catch (error) {
    console.error("[PatientMgmt] Error creating patient:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Patient with this phone number already exists" });
    }
    return res.status(500).json({ error: "Failed to create patient" });
  }
}

// GET /patients/:id — patient detail
export async function getPatient(req, res) {
  try {
    const { id } = req.params;
    
    const where = { id };
    if (req.user.hospitalId) {
      where.hospitalId = req.user.hospitalId;
    }

    const patient = await prisma.patient.findFirst({
      where,
      include: {
        visits: {
          orderBy: { createdAt: "desc" },
          include: { 
             doctor: { select: { name: true } },
             vitals: true
          }
        }
      }
    });

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    
    return res.status(200).json(patient);
  } catch (error) {
    console.error("[PatientMgmt] Error getting patient:", error);
    return res.status(500).json({ error: "Failed to get patient" });
  }
}
