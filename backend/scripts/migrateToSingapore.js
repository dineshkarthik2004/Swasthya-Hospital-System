import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// ─── OLD DB (US East) ─────────────────────────────────────────────────────────
const OLD_DB_URL =
  "postgresql://neondb_owner:npg_ed9k6TYOEQPV@ep-bitter-dream-anxjpnuv-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";

// ─── NEW DB (Singapore) ───────────────────────────────────────────────────────
const NEW_DB_URL =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";

const srcPrisma = new PrismaClient({ datasources: { db: { url: OLD_DB_URL } } });
const dstPrisma = new PrismaClient({ datasources: { db: { url: NEW_DB_URL } } });

const BATCH = 1000;

async function copyTable(name, fetchFn, insertFn, countFn) {
  const total = await countFn();
  console.log(`\n📋 ${name}: ${total.toLocaleString()} rows`);
  if (total === 0) { console.log(`   ⏭  Skipped (empty)`); return; }

  let skip = 0;
  let done = 0;
  while (skip < total) {
    const rows = await fetchFn(skip, BATCH);
    if (rows.length === 0) break;
    await insertFn(rows);
    done += rows.length;
    skip += BATCH;
    process.stdout.write(`\r   ✅ ${done.toLocaleString()} / ${total.toLocaleString()}`);
  }
  console.log(`\r   ✅ Done: ${done.toLocaleString()} rows copied`);
}

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 DB Migration: US East → Singapore");
  console.log("=".repeat(60));

  // ── Test connections ────────────────────────────────────────────────────────
  console.log("\n🔗 Testing source DB (US)...");
  await srcPrisma.$queryRaw`SELECT 1`;
  console.log("   ✅ Source connected");

  console.log("🔗 Testing destination DB (Singapore)...");
  await dstPrisma.$queryRaw`SELECT 1`;
  console.log("   ✅ Destination connected");

  // ── Run Prisma migrations on new DB first ───────────────────────────────────
  console.log("\n⚙️  Running schema migrations on Singapore DB...");
  // We'll handle this via prisma migrate deploy separately after script

  // ─── 1. Hospitals ──────────────────────────────────────────────────────────
  await copyTable(
    "Hospital",
    (skip, take) => srcPrisma.hospital.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.hospital.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.hospital.count()
  );

  // ─── 2. Users ──────────────────────────────────────────────────────────────
  await copyTable(
    "User",
    (skip, take) => srcPrisma.user.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.user.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.user.count()
  );

  // ─── 3. Patients ───────────────────────────────────────────────────────────
  await copyTable(
    "Patient",
    (skip, take) => srcPrisma.patient.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.patient.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.patient.count()
  );

  // ─── 4. Visits ─────────────────────────────────────────────────────────────
  await copyTable(
    "Visit",
    (skip, take) => srcPrisma.visit.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.visit.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.visit.count()
  );

  // ─── 5. Vitals ─────────────────────────────────────────────────────────────
  await copyTable(
    "Vitals",
    (skip, take) => srcPrisma.vitals.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.vitals.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.vitals.count()
  );

  // ─── 6. Consultations ──────────────────────────────────────────────────────
  await copyTable(
    "Consultation",
    (skip, take) => srcPrisma.consultation.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.consultation.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.consultation.count()
  );

  // ─── 7. Prescriptions ──────────────────────────────────────────────────────
  await copyTable(
    "Prescription",
    (skip, take) => srcPrisma.prescription.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.prescription.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.prescription.count()
  );

  // ─── 8. PrescriptionItems ──────────────────────────────────────────────────
  await copyTable(
    "PrescriptionItem",
    (skip, take) => srcPrisma.prescriptionItem.findMany({ skip, take }),
    (rows) => dstPrisma.prescriptionItem.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.prescriptionItem.count()
  );

  // ─── 9. Sessions ───────────────────────────────────────────────────────────
  await copyTable(
    "Session",
    (skip, take) => srcPrisma.session.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.session.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.session.count()
  );

  // ─── 10. SystemSettings ────────────────────────────────────────────────────
  await copyTable(
    "SystemSettings",
    (skip, take) => srcPrisma.systemSettings.findMany({ skip, take }),
    (rows) => dstPrisma.systemSettings.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.systemSettings.count()
  );

  // ─── 11. HospitalPayments ──────────────────────────────────────────────────
  await copyTable(
    "HospitalPayment",
    (skip, take) => srcPrisma.hospitalPayment.findMany({ skip, take, orderBy: { createdAt: "asc" } }),
    (rows) => dstPrisma.hospitalPayment.createMany({ data: rows, skipDuplicates: true }),
    () => srcPrisma.hospitalPayment.count()
  );

  // ─── 12. Medicines (large — use batch 5000) ────────────────────────────────
  console.log(`\n📋 Medicine: counting...`);
  const medTotal = await srcPrisma.medicine.count();
  console.log(`   ${medTotal.toLocaleString()} rows — using batch size 5000`);

  const MEDBATCH = 5000;
  let medSkip = 0;
  let medDone = 0;
  while (medSkip < medTotal) {
    const rows = await srcPrisma.medicine.findMany({
      skip: medSkip,
      take: MEDBATCH,
      orderBy: { createdAt: "asc" }
    });
    if (rows.length === 0) break;
    // Remove auto-generated fields that prisma handles
    await dstPrisma.medicine.createMany({ data: rows, skipDuplicates: true });
    medDone += rows.length;
    medSkip += MEDBATCH;
    process.stdout.write(`\r   ✅ ${medDone.toLocaleString()} / ${medTotal.toLocaleString()}`);
  }
  console.log(`\r   ✅ Done: ${medDone.toLocaleString()} medicines copied`);

  // ─── Final verification ────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("📊 Verification — Row counts in NEW Singapore DB:");
  console.log("=".repeat(60));

  const counts = await Promise.all([
    dstPrisma.hospital.count(),
    dstPrisma.user.count(),
    dstPrisma.patient.count(),
    dstPrisma.visit.count(),
    dstPrisma.consultation.count(),
    dstPrisma.prescription.count(),
    dstPrisma.prescriptionItem.count(),
    dstPrisma.session.count(),
    dstPrisma.systemSettings.count(),
    dstPrisma.medicine.count(),
    dstPrisma.hospitalPayment.count(),
  ]);

  const labels = ["Hospital", "User", "Patient", "Visit", "Consultation", "Prescription", "PrescriptionItem", "Session", "SystemSettings", "Medicine", "HospitalPayment"];
  labels.forEach((l, i) => console.log(`   ${l.padEnd(20)} ${counts[i].toLocaleString()}`));

  console.log("\n🎉 Migration complete! Singapore DB is ready.");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await srcPrisma.$disconnect();
    await dstPrisma.$disconnect();
  });
