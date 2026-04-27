import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function dump() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true, clinicName: true, hospitalId: true }
  });
  console.log("USERS:", JSON.stringify(users, null, 2));

  const patients = await prisma.patient.findMany({
    select: { id: true, name: true, registeredById: true, hospitalId: true },
    take: 5
  });
  console.log("PATIENTS (Sample):", JSON.stringify(patients, null, 2));

  const visits = await prisma.visit.findMany({
    select: { id: true, patientId: true, doctorId: true, receptionistId: true, hospitalId: true },
    take: 5
  });
  console.log("VISITS (Sample):", JSON.stringify(visits, null, 2));
}

dump().finally(() => prisma.$disconnect());
