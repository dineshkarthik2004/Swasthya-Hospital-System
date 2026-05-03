/**
 * DIAGNOSTIC TEST: Voice Setting Scoping
 * Run: node scripts/testVoiceSetting.js
 * 
 * Tests:
 * 1. What settings currently exist in DB?
 * 2. For a given hospital, does the key prefix work correctly?
 * 3. Simulates what /api/settings/public returns for a doctor
 */

import { prisma } from "../config/db.js";

const HOSPITAL_NAME_FILTER = "jotham"; // Change to test different hospitals

async function runTests() {
  console.log("\n======================================================");
  console.log("  VOICE SETTING DIAGNOSTIC TEST");
  console.log("======================================================\n");

  // ── TEST 1: Show all SystemSettings in DB ─────────────────────────────────
  console.log("TEST 1: All SystemSettings in DB");
  console.log("─────────────────────────────────");
  const allSettings = await prisma.systemSettings.findMany();
  if (allSettings.length === 0) {
    console.log("  ⚠️  NO settings found in DB at all!");
    console.log("  This means the admin never saved any settings.");
    console.log("  The frontend will default to voiceEnabled = true.\n");
  } else {
    allSettings.forEach(s => {
      console.log(`  key: "${s.key}" | value: "${s.value}"`);
    });
  }

  // ── TEST 2: Find Jotham hospital and its ID ───────────────────────────────
  console.log("\nTEST 2: Find hospital by name");
  console.log("─────────────────────────────");
  const hospital = await prisma.hospital.findFirst({
    where: { name: { contains: HOSPITAL_NAME_FILTER, mode: "insensitive" } }
  });

  if (!hospital) {
    console.log(`  ❌ Hospital matching "${HOSPITAL_NAME_FILTER}" NOT FOUND`);
    console.log("  Available hospitals:");
    const all = await prisma.hospital.findMany({ select: { id: true, name: true } });
    all.forEach(h => console.log(`    - ${h.name} (id: ${h.id})`));
    process.exit(1);
  }

  console.log(`  ✅ Found: "${hospital.name}" (id: ${hospital.id})`);
  const hospitalId = hospital.id;
  const expectedKey = `${hospitalId}_doctor_voice_enabled`;

  // ── TEST 3: Check if the scoped setting exists ────────────────────────────
  console.log("\nTEST 3: Scoped setting lookup");
  console.log("─────────────────────────────");
  console.log(`  Looking for key: "${expectedKey}"`);
  const scopedSetting = allSettings.find(s => s.key === expectedKey);

  if (!scopedSetting) {
    console.log(`  ❌ SETTING NOT FOUND in DB!`);
    console.log(`  This is the BUG — the admin saved with a DIFFERENT key.`);
    console.log(`  Checking if non-scoped key exists...`);
    const globalSetting = allSettings.find(s => s.key === "doctor_voice_enabled");
    if (globalSetting) {
      console.log(`  ⚠️  Found GLOBAL (unscoped) key: "doctor_voice_enabled" = "${globalSetting.value}"`);
      console.log(`  BUG: Admin saved without hospitalId prefix — setting is global, not per-hospital`);
    } else {
      console.log(`  ❌ Neither scoped nor global key found.`);
    }
  } else {
    console.log(`  ✅ Scoped setting found: value = "${scopedSetting.value}"`);
  }

  // ── TEST 4: Simulate /api/settings/public response for this hospital ──────
  console.log("\nTEST 4: Simulated /api/settings/public for hospital doctor");
  console.log("──────────────────────────────────────────────────────────");
  const prefix = `${hospitalId}_`;
  const simulatedResponse = allSettings
    .filter(s => s.key.startsWith(prefix))
    .map(s => ({ key: s.key.slice(prefix.length), value: s.value }));

  if (simulatedResponse.length === 0) {
    console.log("  ⚠️  Response would be EMPTY ARRAY");
    console.log("  Frontend falls to default → voiceEnabled = true");
    console.log("  BUG CONFIRMED: This is why voice still shows!\n");
  } else {
    simulatedResponse.forEach(s => {
      console.log(`  key: "${s.key}" | value: "${s.value}"`);
    });
    const voiceVal = simulatedResponse.find(s => s.key === "doctor_voice_enabled");
    if (voiceVal) {
      const enabled = voiceVal.value === "true";
      console.log(`\n  📣 voice_enabled for doctors: ${enabled ? "✅ ON" : "❌ OFF"}`);
    }
  }

  // ── TEST 5: Check admin user for this hospital ────────────────────────────
  console.log("\nTEST 5: Admin user for this hospital");
  console.log("─────────────────────────────────────");
  const adminUser = await prisma.user.findFirst({
    where: { hospitalId, role: "ADMIN" },
    select: { id: true, name: true, email: true, hospitalId: true, role: true }
  });
  if (adminUser) {
    console.log(`  Admin: ${adminUser.name} (${adminUser.email})`);
    console.log(`  hospitalId in DB: ${adminUser.hospitalId}`);
    console.log(`  This hospitalId MUST match prefix used in settings keys.`);
    const matches = adminUser.hospitalId === hospitalId;
    console.log(`  Match check: ${matches ? "✅ MATCHES" : "❌ MISMATCH"}`);
  } else {
    console.log("  ❌ No ADMIN found for this hospital");
  }

  console.log("\n======================================================");
  console.log("  DIAGNOSIS COMPLETE");
  console.log("======================================================\n");

  await prisma.$disconnect();
}

runTests().catch(e => {
  console.error("Test script error:", e);
  prisma.$disconnect();
  process.exit(1);
});
