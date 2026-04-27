import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const userCount = await prisma.user.count({ where: { hospitalId: { not: null } } });
  const totalUsers = await prisma.user.count();
  const patientCount = await prisma.patient.count({ where: { hospitalId: { not: null } } });
  const totalPatients = await prisma.patient.count();
  const visitCount = await prisma.visit.count({ where: { hospitalId: { not: null } } });
  const totalVisits = await prisma.visit.count();
  const hospitalCount = await prisma.hospital.count();

  console.log({
    hospitals: hospitalCount,
    usersWithHospital: userCount,
    totalUsers,
    patientsWithHospital: patientCount,
    totalPatients,
    visitsWithHospital: visitCount,
    totalVisits
  });
}

check().finally(() => prisma.$disconnect());
