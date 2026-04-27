import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  console.log("--- Starting Backfill Analysis ---");

  const hospitals = await prisma.hospital.findMany();
  console.log(`Hospitals available: ${hospitals.map(h => h.name).join(", ")}`);

  // 1. Users by ClinicName
  const users = await prisma.user.findMany();
  let userUpdates = 0;
  for (const user of users) {
    if (!user.hospitalId && user.clinicName) {
      const hospital = hospitals.find(h => h.name.toLowerCase() === user.clinicName.toLowerCase());
      if (hospital) {
        await prisma.user.update({ where: { id: user.id }, data: { hospitalId: hospital.id } });
        userUpdates++;
      }
    }
  }
  console.log(`Step 1: Updated ${userUpdates} Users via clinicName match.`);

  // 2. Cascade to Visits (easiest to link via doctorId)
  let visitUpdates = 0;
  const visits = await prisma.visit.findMany({ where: { hospitalId: null } });
  for (const visit of visits) {
    let hId = null;
    if (visit.doctorId) {
      const doc = await prisma.user.findUnique({ where: { id: visit.doctorId } });
      if (doc?.hospitalId) hId = doc.hospitalId;
    }
    if (!hId && visit.receptionistId) {
      const rec = await prisma.user.findUnique({ where: { id: visit.receptionistId } });
      if (rec?.hospitalId) hId = rec.hospitalId;
    }

    if (hId) {
      await prisma.visit.update({ where: { id: visit.id }, data: { hospitalId: hId } });
      visitUpdates++;
    }
  }
  console.log(`Step 2: Updated ${visitUpdates} Visits via Doctor/Receptionist links.`);

  // 3. Cascade to Patients
  let patientUpdates = 0;
  const patients = await prisma.patient.findMany({ where: { hospitalId: null } });
  for (const patient of patients) {
    let hId = null;
    
    // Try via registeredBy
    if (patient.registeredById) {
      const regUser = await prisma.user.findUnique({ where: { id: patient.registeredById } });
      if (regUser?.hospitalId) hId = regUser.hospitalId;
    }

    // Try via existing visits
    if (!hId) {
      const firstVisit = await prisma.visit.findFirst({
        where: { patientId: patient.id, hospitalId: { not: null } }
      });
      if (firstVisit) hId = firstVisit.hospitalId;
    }

    if (hId) {
      await prisma.patient.update({ where: { id: patient.id }, data: { hospitalId: hId } });
      patientUpdates++;
    }
  }
  console.log(`Step 3: Updated ${patientUpdates} Patients via User/Visit links.`);

  // 4. Backward Link Users (Receptionists who didn't have clinicName)
  let userBackUpdates = 0;
  const usersNoHosp = await prisma.user.findMany({ where: { hospitalId: null } });
  for (const user of usersNoHosp) {
    let hId = null;
    // Check if they registered a patient who now has a hospital
    const patient = await prisma.patient.findFirst({
      where: { registeredById: user.id, hospitalId: { not: null } }
    });
    if (patient) hId = patient.hospitalId;

    // Check if they handled a visit
    if (!hId) {
      const visit = await prisma.visit.findFirst({
        where: { OR: [{ receptionistId: user.id }, { bookedById: user.id }], hospitalId: { not: null } }
      });
      if (visit) hId = visit.hospitalId;
    }

    if (hId) {
      await prisma.user.update({ where: { id: user.id }, data: { hospitalId: hId } });
      userBackUpdates++;
    }
  }
  console.log(`Step 4: Updated ${userBackUpdates} Staff members via Patient/Visit relationships.`);

  // 5. Final Consultation Sync
  let consultationUpdates = 0;
  const consultations = await prisma.consultation.findMany({ where: { hospitalId: null } });
  for (const cons of consultations) {
    const visit = await prisma.visit.findUnique({ where: { id: cons.visitId } });
    if (visit?.hospitalId) {
      await prisma.consultation.update({ where: { id: cons.id }, data: { hospitalId: visit.hospitalId } });
      consultationUpdates++;
    }
  }
  console.log(`Step 5: Updated ${consultationUpdates} Consultations.`);

  console.log("\n--- Backfill Completed ---");
}

backfill()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
