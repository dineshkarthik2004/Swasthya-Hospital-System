/**
 * VERIFICATION TEST: Receptionist Add Doctors Setting
 * Run: node scripts/testReceptionistSetting.js
 */

import { prisma } from "../config/db.js";

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   RECEPTIONIST SETTING TEST                          ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // 1. Check Dinesh's hospitalId
  const dinesh = await prisma.user.findFirst({ where: { email: 'jotham@receptionist.com', role: 'RECEPTIONIST' } });
  if (!dinesh) {
    console.log("❌ Dinesh not found");
    process.exit(1);
  }
  console.log(`👨‍💼 Receptionist: "${dinesh.name}"`);
  console.log(`   hospitalId in DB: ${dinesh.hospitalId}\n`);

  // 2. Simulate API response for public settings
  const all = await prisma.systemSettings.findMany();
  let scoped = all;
  
  if (dinesh.hospitalId) {
    const prefix = `${dinesh.hospitalId}_`;
    scoped = all
      .filter(s => s.key.startsWith(prefix))
      .map(s => ({ key: s.key.slice(prefix.length), value: s.value }));
  }

  console.log("─── TEST 1: Public Settings Fetch ──────────────────────");
  console.log(`   Returned ${scoped.length} settings for this hospital.`);
  const setting = scoped.find(s => s.key === "receptionist_add_doctors");
  if (setting) {
    console.log(`   ✅ receptionist_add_doctors = "${setting.value}"`);
  } else {
    console.log("   ⚠️  Setting NOT FOUND. Defaults to ON.");
  }

  // 3. Simulate StaffForm logic
  console.log("\n─── TEST 2: StaffForm Visibility Logic ─────────────────");
  const allowed = setting ? setting.value === 'true' : true;
  console.log(`   allowed = ${allowed}`);
  if (!allowed) {
    console.log("   ✅ CORRECT — The 'Doctor' option will be HIDDEN from the dropdown");
  } else {
    console.log("   ❌ BUG — The 'Doctor' option will be SHOWN");
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   TEST COMPLETE                                      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  await prisma.$disconnect();
}

runTests().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
