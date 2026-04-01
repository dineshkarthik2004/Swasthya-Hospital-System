import { prisma, safeQuery } from "../config/db.js";

// POST /api/visits
export async function createVisit(req, res) {
  try {
    const data = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Invalid input" });
    }
    
    const { 
      relation = "SELF",
      patientName,
      phone,
      age,
      gender,
      notes,
      feeType,
      bloodGroup,
      appointmentDate,
      appointmentTime,
      height
    } = data;

    const userRole = (req.user.role || "").toUpperCase();
    let targetPatientId = null;

    if (userRole === "PATIENT") {
       // Logic for patient-initiated booking (family support)
       if (relation.toUpperCase() === "SELF") {
          // 1. Check for logged-in user's own profile
          let profile = await prisma.patient.findUnique({ where: { userId: req.user.userId } });
          
          if (!profile) {
             // Create primary profile if missing
             profile = await prisma.patient.create({
                data: {
                   name: req.user.name || "Patient",
                   phone: phone || (req.user.email || req.user.userId).slice(0, 15),
                   email: req.user.email || null,
                   userId: req.user.userId,
                   gender: gender ? gender.toUpperCase() : "MALE",
                   dateOfBirth: age ? new Date(new Date().getFullYear() - parseInt(age), 0, 1) : null,
                   bloodGroup: bloodGroup || null
                }
             });
          } else {
             // Update primary profile with latest age/gender if provided
             const updateData = {};
             if (gender) updateData.gender = gender.toUpperCase();
             if (age) {
                const dob = new Date();
                dob.setFullYear(dob.getFullYear() - parseInt(age, 10));
                updateData.dateOfBirth = dob;
             }
             if (bloodGroup) updateData.bloodGroup = bloodGroup;
             if (Object.keys(updateData).length > 0) {
                profile = await prisma.patient.update({ where: { id: profile.id }, data: updateData });
             }
          }
          targetPatientId = profile.id;
       } else {
          // 2. Booking for Family Member
          if (!patientName) return res.status(400).json({ error: "Family member name is required" });

          // Try to find if this family member was registered before by this user
          let familyMember = await prisma.patient.findFirst({
             where: {
                name: { equals: patientName, mode: 'insensitive' },
                registeredById: req.user.userId
             }
          });

          const dob = age ? new Date(new Date().getFullYear() - parseInt(age, 10), 0, 1) : null;

          if (familyMember) {
             // Update existing family record
             familyMember = await prisma.patient.update({
                where: { id: familyMember.id },
                data: {
                   gender: gender ? gender.toUpperCase() : familyMember.gender,
                   dateOfBirth: dob || familyMember.dateOfBirth,
                   phone: phone || familyMember.phone || "",
                   bloodGroup: bloodGroup || familyMember.bloodGroup
                }
             });
          } else {
             // Create new patient record for family member
             familyMember = await prisma.patient.create({
                data: {
                   name: patientName,
                   phone: phone || `FAM-${req.user.userId.slice(-6)}-${Date.now().toString().slice(-4)}`,
                   gender: gender ? gender.toUpperCase() : "MALE",
                   dateOfBirth: dob,
                   registeredById: req.user.userId,
                   bloodGroup: bloodGroup || null
                }
             });
          }
          targetPatientId = familyMember.id;
       }
    } else {
       // Receptionist/Admin logic
       const { patientId } = data;
       if (!patientId) return res.status(400).json({ error: "Patient ID is required" });
       targetPatientId = patientId;
    }

    let parsedAppointmentTime = null;
    if (appointmentDate && appointmentTime) {
       parsedAppointmentTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    }

    // Create the Visit
    const visit = await safeQuery(() => prisma.visit.create({
      data: {
        patientId: targetPatientId,
        bookedById: userRole === "PATIENT" ? req.user.userId : null,
        receptionistId: (userRole === "RECEPTIONIST" || userRole === "ADMIN") ? req.user.userId : null,
        relation: relation.toUpperCase(),
        feeType: feeType || (userRole === "PATIENT" ? "Online Booking" : "General Consultation"),
        notes,
        status: "WAITING",
        paymentStatus: "UNPAID",
        appointmentTime: parsedAppointmentTime
      },
      include: {
        patient: true
      }
    }));

    if (height) {
      await safeQuery(() => prisma.vitals.create({
        data: {
          visitId: visit.id,
          height: height.toString()
        }
      }));
    }

    return res.status(201).json(visit);
  } catch (error) {
    console.error("[VisitController] Error creating visit:", error);
    return res.status(500).json({ error: "Failed to create visit" });
  }
}

// GET /visits
export async function listVisits(req, res) {
  try {
    // Optionally filter by date
    const { date, status } = req.query;
    
    const where = {};
    if (date) {
      // Very simple matching for same day
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.createdAt = { gte: start, lt: end };
    }
    if (status) {
      where.status = status;
    }

    const userRole = (req.user.role || "").toUpperCase();
    if (userRole === "PATIENT") {
       const profile = await prisma.patient.findUnique({ where: { userId: req.user.userId }});
       where.OR = [
         { patientId: profile?.id || 'MISSING' },
         { bookedById: req.user.userId }
       ];
    }

    const visits = await safeQuery(() => prisma.visit.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        patient: true,
        receptionist: { select: { name: true } },
        doctor: { select: { name: true } },
        vitals: true,
        consultation: {
          include: {
            prescription: { include: { items: true } }
          }
        }
      }
    }));

    return res.status(200).json(visits);
  } catch (error) {
    console.error("[VisitController] Error listing visits:", error);
    return res.status(500).json({ error: "Failed to list visits" });
  }
}

// GET /visits/:id
export async function getVisitDetails(req, res) {
  const { id } = req.params;

  const fetchVisit = () => prisma.visit.findUnique({
    where: { id },
    include: {
      patient: true,
      vitals: true,
      receptionist: { select: { name: true } },
      doctor: { select: { name: true } },
      consultation: { 
        include: { 
          prescription: {
            include: { items: true }
          } 
        } 
      }
    }
  });

  try {
    const visit = await safeQuery(() => fetchVisit());

    if (!visit) return res.status(404).json({ error: "Visit not found" });
    return res.status(200).json(visit);
  } catch (error) {
    console.error("[VisitController] Error fetching visit details:", error);
    return res.status(500).json({ error: "Server Error" });
  }
}

// PATCH /visits/:id/assign
export async function assignDoctor(req, res) {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) return res.status(400).json({ error: "Doctor ID is required" });

    const visit = await prisma.visit.update({
      where: { id },
      data: { 
        doctorId, 
        status: "ASSIGNED_TO_DOCTOR" 
      },
      include: {
        patient: true,
        doctor: { select: { name: true } }
      }
    });

    return res.status(200).json(visit);
  } catch (error) {
    console.error("[VisitController] Error assigning doctor:", error);
    return res.status(500).json({ error: "Failed to assign doctor" });
  }
}

// PATCH /visits/:id/status
export async function updateVisitStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const data = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;

    const visit = await prisma.visit.update({
      where: { id },
      data
    });

    return res.status(200).json(visit);
  } catch (error) {
    console.error("[VisitController] Error updating visit status:", error);
    return res.status(500).json({ error: "Failed to update visit status" });
  }
}
// GET /visits/stats/receptionist
export async function getReceptionistStats(req, res) {
  try {
    console.log("[VisitController] Fetching Stats for Receptionist:", req.user.userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, pendingVisits, unpaidVisits] = await Promise.all([
      prisma.visit.count({
        where: { createdAt: { gte: today, lt: tomorrow } }
      }),
      prisma.visit.count({
        where: { 
           createdAt: { gte: today, lt: tomorrow },
           status: { in: ["WAITING", "VITALS_COMPLETED", "ASSIGNED_TO_DOCTOR"] } 
        }
      }),
      prisma.visit.count({
        where: { 
           createdAt: { gte: today, lt: tomorrow },
           paymentStatus: "UNPAID" 
        }
      })
    ]);

    console.log("[VisitController] Stats Calculated:", { totalPatients, pendingVisits, unpaidVisits });
    return res.status(200).json({
      totalPatients,
      pendingVisits,
      unpaidVisits
    });
  } catch (error) {
    console.error("[VisitController] Error getting stats:", error);
    return res.status(500).json({ error: "Failed to get stats", details: error.message });
  }
}

// POST /api/visits/reception-create
export async function receptionCreateVisit(req, res) {
  try {
    const { 
      name, phone, age, gender, email, 
      complaint, 
      vitals, 
      doctorId,
      bloodGroup,
      appointmentDate,
      appointmentTime
    } = req.body;

    if (!name || !phone || !age || !gender) {
      return res.status(400).json({ error: "Missing required patient fields" });
    }

    // 1. Find or create patient
    let patient = await prisma.patient.findUnique({ where: { phone } });
    
    let dob = null;
    if (age) {
       dob = new Date();
       dob.setFullYear(dob.getFullYear() - parseInt(age, 10));
       dob.setMonth(0);
       dob.setDate(1);
    }

    if (patient) {
      // Update existing patient info if provided
      const updateData = { name };
      if (email) updateData.email = email;
      if (gender) updateData.gender = gender.toUpperCase();
      if (dob) updateData.dateOfBirth = dob;
      if (bloodGroup) updateData.bloodGroup = bloodGroup;

      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: updateData
      });
    } else {
      // Create new patient
      patient = await prisma.patient.create({
        data: {
          name,
          phone,
          email,
          gender: gender ? gender.toUpperCase() : "MALE",
          dateOfBirth: dob,
          registeredById: req.user.userId,
          bloodGroup: bloodGroup || null
        }
      });
    }

    let parsedAppointmentTime = null;
    if (appointmentDate && appointmentTime) {
       parsedAppointmentTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
    }

    // 2. Create Visit
    const visit = await safeQuery(() => prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: doctorId || null,
        receptionistId: req.user.userId,
        notes: complaint,
        status: doctorId ? "ASSIGNED_TO_DOCTOR" : "WAITING",
        paymentStatus: "UNPAID",
        feeType: "Receptionist Booking",
        appointmentTime: parsedAppointmentTime
      }
    }));

    // 3. Create Vitals if provided
    if (vitals && Object.values(vitals).some(v => v)) {
      await safeQuery(() => prisma.vitals.create({
        data: {
          visitId: visit.id,
          bloodPressure: vitals.bloodPressure || vitals.bp,
          pulse: vitals.pulse,
          temperature: vitals.temperature,
          weight: vitals.weight,
          height: vitals.height ? String(vitals.height) : null
        }
      }));
    }

    const fullVisit = await safeQuery(() => prisma.visit.findUnique({
      where: { id: visit.id },
      include: {
        patient: true,
        doctor: { select: { name: true, specialization: true } },
        vitals: true
      }
    }));

    return res.status(201).json(fullVisit);
  } catch (error) {
    console.error("[VisitController] Error in reception-create:", error);
    return res.status(500).json({ error: "Failed to create visit" });
  }
}
