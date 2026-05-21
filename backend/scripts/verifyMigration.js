import { PrismaClient } from "@prisma/client";

const OLD_URL = "postgresql://neondb_owner:npg_ed9k6TYOEQPV@ep-bitter-dream-anxjpnuv-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";
const NEW_URL = "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";

const old = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
const neu = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

async function main() {
  console.log("=".repeat(65));
  console.log("🔍 DB Verification: US East (OLD) vs Singapore (NEW)");
  console.log("=".repeat(65));

  const tables = [
    { name: "Hospital",         fn: (p) => p.hospital.count() },
    { name: "User",             fn: (p) => p.user.count() },
    { name: "Patient",          fn: (p) => p.patient.count() },
    { name: "Visit",            fn: (p) => p.visit.count() },
    { name: "Vitals",           fn: (p) => p.vitals.count() },
    { name: "Consultation",     fn: (p) => p.consultation.count() },
    { name: "Prescription",     fn: (p) => p.prescription.count() },
    { name: "PrescriptionItem", fn: (p) => p.prescriptionItem.count() },
    { name: "Session",          fn: (p) => p.session.count() },
    { name: "SystemSettings",   fn: (p) => p.systemSettings.count() },
    { name: "HospitalPayment",  fn: (p) => p.hospitalPayment.count() },
    { name: "Medicine",         fn: (p) => p.medicine.count() },
  ];

  console.log(`\n${"Table".padEnd(22)} ${"OLD (US)".padStart(12)} ${"NEW (SG)".padStart(12)}  ${"Status".padStart(10)}`);
  console.log("-".repeat(65));

  let allMatch = true;
  const mismatches = [];

  for (const t of tables) {
    const [oldCount, newCount] = await Promise.all([t.fn(old), t.fn(neu)]);
    const match = oldCount === newCount;
    const status = match ? "✅ OK" : "❌ MISMATCH";
    if (!match) { allMatch = false; mismatches.push({ name: t.name, oldCount, newCount }); }
    console.log(`${t.name.padEnd(22)} ${oldCount.toLocaleString().padStart(12)} ${newCount.toLocaleString().padStart(12)}  ${status}`);
  }

  console.log("-".repeat(65));

  if (allMatch) {
    console.log("\n🎉 ALL TABLES MATCH PERFECTLY! Singapore DB is complete.");
  } else {
    console.log("\n⚠️  MISMATCHES FOUND:");
    for (const m of mismatches) {
      const diff = m.oldCount - m.newCount;
      console.log(`   ❌ ${m.name}: OLD=${m.oldCount.toLocaleString()}, NEW=${m.newCount.toLocaleString()}, MISSING=${diff.toLocaleString()}`);
    }
  }

  // Also verify Singapore has data by sampling key records
  console.log("\n📋 Sample Data Verification (Singapore DB):");
  console.log("-".repeat(65));

  const hospitals = await neu.hospital.findMany({ select: { id: true, name: true } });
  console.log("Hospitals:");
  hospitals.forEach(h => console.log(`   ✅ ${h.name} (${h.id})`));

  const users = await neu.user.findMany({ select: { name: true, role: true, email: true } });
  console.log("\nUsers:");
  users.forEach(u => console.log(`   ✅ ${u.name} | ${u.role} | ${u.email}`));

  const settings = await neu.systemSettings.findMany({ select: { key: true, value: true } });
  console.log(`\nSystem Settings (${settings.length} entries):`);
  settings.slice(0, 5).forEach(s => console.log(`   ✅ ${s.key} = ${s.value.slice(0, 40)}`));
  if (settings.length > 5) console.log(`   ... and ${settings.length - 5} more`);

  const sampleMeds = await neu.medicine.findMany({ take: 3, where: { hospitalId: null }, select: { name: true, type: true } });
  console.log("\nSample Global Medicines:");
  sampleMeds.forEach(m => console.log(`   ✅ ${m.name} (${m.type})`));

  const hospitalMeds = await neu.medicine.findMany({ where: { hospitalId: { not: null } }, select: { name: true, hospitalName: true } });
  console.log(`\nHospital-Specific Medicines (${hospitalMeds.length} total):`);
  hospitalMeds.forEach(m => console.log(`   ✅ ${m.name} → ${m.hospitalName}`));

  console.log("\n" + "=".repeat(65));
  console.log("✅ Verification complete. Singapore DB is ACTIVE.");
  console.log("=".repeat(65));
}

main()
  .catch(e => { console.error("❌ Verification failed:", e.message); process.exit(1); })
  .finally(async () => { await old.$disconnect(); await neu.$disconnect(); });
