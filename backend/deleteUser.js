/**
 * deleteUser.js — Safely deletes a specific user and all their dependent records.
 * Usage: node deleteUser.js
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET_ID = "cmp9mauhf000110b2soorp8vy";

async function main() {
  // 1. Find the user first
  const user = await prisma.user.findUnique({ where: { id: TARGET_ID } });
  if (!user) {
    console.log(`❌ No user found with id: ${TARGET_ID}`);
    return;
  }
  console.log(`\n🔍 Found user:`);
  console.log(`   Name    : ${user.name}`);
  console.log(`   Email   : ${user.email}`);
  console.log(`   Username: ${user.username || "—"}`);
  console.log(`   Role    : ${user.role}`);
  console.log(`   Hospital: ${user.hospitalId || "none"}\n`);

  // 2. If PATIENT role — delete related visits/consultations too
  if (user.role === "PATIENT") {
    const patient = await prisma.patient.findFirst({ where: { userId: TARGET_ID } });
    if (patient) {
      const visits = await prisma.visit.findMany({ where: { patientId: patient.id }, select: { id: true } });
      const visitIds = visits.map(v => v.id);

      if (visitIds.length > 0) {
        await prisma.prescriptionItem.deleteMany({ where: { prescription: { consultation: { visitId: { in: visitIds } } } } });
        await prisma.prescription.deleteMany({ where: { consultation: { visitId: { in: visitIds } } } });
        await prisma.consultation.deleteMany({ where: { visitId: { in: visitIds } } });
        await prisma.vitals.deleteMany({ where: { visitId: { in: visitIds } } });
        await prisma.visit.deleteMany({ where: { id: { in: visitIds } } });
        console.log(`✅ Deleted ${visitIds.length} visit(s) and all dependent records.`);
      }
      await prisma.patient.delete({ where: { id: patient.id } });
      console.log(`✅ Deleted Patient record.`);
    }
  }

  // 3. If DOCTOR role — delete consultations they are the doctor of (keep visits)
  if (user.role === "DOCTOR") {
    const consultations = await prisma.consultation.findMany({ where: { doctorId: TARGET_ID }, select: { id: true } });
    const consultIds = consultations.map(c => c.id);
    if (consultIds.length > 0) {
      await prisma.prescriptionItem.deleteMany({ where: { prescription: { consultationId: { in: consultIds } } } });
      await prisma.prescription.deleteMany({ where: { consultationId: { in: consultIds } } });
      await prisma.consultation.deleteMany({ where: { id: { in: consultIds } } });
      console.log(`✅ Deleted ${consultIds.length} consultation(s) and prescriptions.`);
    }
  }

  // 4. Delete Sessions
  const sessions = await prisma.session.deleteMany({ where: { userId: TARGET_ID } });
  console.log(`✅ Deleted ${sessions.count} session(s).`);

  // 5. Delete the User
  await prisma.user.delete({ where: { id: TARGET_ID } });
  console.log(`✅ User deleted successfully.\n`);
  console.log(`🎉 Done — user "${user.name}" (${user.role}) has been removed from the database.\n`);
}

main()
  .catch(err => { console.error("❌ Error:", err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
