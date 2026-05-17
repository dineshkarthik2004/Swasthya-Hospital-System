/**
 * cleanPatientData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deletes ALL patient data from the DB in correct dependency order:
 *   PrescriptionItem → Prescription → Consultation → Vitals → Visit → Patient → User(PATIENT)
 *
 * ✅ Keeps: Hospitals, Admins, Doctors, Receptionists, Lab Techs, Settings
 * ❌ Deletes: Patients, Visits, Vitals, Consultations, Prescriptions, PATIENT Users
 *
 * Usage:  node cleanPatientData.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query"] });

async function main() {
  console.log("\n🧹 Starting patient data cleanup...\n");

  // ── Step 1: Delete PrescriptionItems ──────────────────────────────────────
  const deletedItems = await prisma.prescriptionItem.deleteMany({});
  console.log(`✅  PrescriptionItem  deleted: ${deletedItems.count}`);

  // ── Step 2: Delete Prescriptions ─────────────────────────────────────────
  const deletedPrescriptions = await prisma.prescription.deleteMany({});
  console.log(`✅  Prescription      deleted: ${deletedPrescriptions.count}`);

  // ── Step 3: Delete Consultations ─────────────────────────────────────────
  const deletedConsultations = await prisma.consultation.deleteMany({});
  console.log(`✅  Consultation      deleted: ${deletedConsultations.count}`);

  // ── Step 4: Delete Vitals ─────────────────────────────────────────────────
  const deletedVitals = await prisma.vitals.deleteMany({});
  console.log(`✅  Vitals            deleted: ${deletedVitals.count}`);

  // ── Step 5: Delete Visits ─────────────────────────────────────────────────
  const deletedVisits = await prisma.visit.deleteMany({});
  console.log(`✅  Visit             deleted: ${deletedVisits.count}`);

  // ── Step 6: Delete Patient records ───────────────────────────────────────
  const deletedPatients = await prisma.patient.deleteMany({});
  console.log(`✅  Patient           deleted: ${deletedPatients.count}`);

  // ── Step 6.5: Delete Sessions belonging to PATIENT users ────────────────
  const patientUserIds = (await prisma.user.findMany({
    where: { role: "PATIENT" },
    select: { id: true }
  })).map(u => u.id);

  const deletedSessions = await prisma.session.deleteMany({
    where: { userId: { in: patientUserIds } }
  });
  console.log(`✅  Session (PATIENT) deleted: ${deletedSessions.count}`);

  // ── Step 7: Delete User accounts with role = PATIENT ─────────────────────
  const deletedPatientUsers = await prisma.user.deleteMany({
    where: { role: "PATIENT" }
  });
  console.log(`✅  User (PATIENT)    deleted: ${deletedPatientUsers.count}`);

  console.log("\n🎉 Cleanup complete! All patient/visit/consultation data removed.");
  console.log("   Hospitals, Admins, Doctors, Receptionists, and Settings are untouched.\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
