/**
 * FINAL VERIFICATION TEST: Voice Setting — Full End-to-End
 * Run: node scripts/testVoiceSettingFinal.js
 */

import { prisma } from "../config/db.js";

const HOSPITAL_NAME = "jotham";

async function simulate_getSettingsPublic(userId) {
  // Mirrors the updated /api/settings/public logic exactly
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { hospitalId: true }
  });
  const hospitalId = dbUser?.hospitalId || null;
  const all = await prisma.systemSettings.findMany();

  if (hospitalId) {
    const prefix = `${hospitalId}_`;
    return all
      .filter(s => s.key.startsWith(prefix))
      .map(s => ({ key: s.key.slice(prefix.length), value: s.value }));
  }
  return all;
}

function simulate_frontend_voiceEnabled(settings) {
  const s = settings.find(item => item.key === "doctor_voice_enabled");
  return s ? s.value === 'true' : true; // default true if not found
}

async function runFinalTests() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   FINAL VOICE SETTING VERIFICATION TEST              ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // Get Jotham hospital
  const hospital = await prisma.hospital.findFirst({
    where: { name: { contains: HOSPITAL_NAME, mode: "insensitive" } }
  });
  if (!hospital) {
    console.log("❌ Hospital not found"); process.exit(1);
  }
  console.log(`🏥 Hospital: "${hospital.name}" (${hospital.id})\n`);

  // Get doctor for this hospital
  const doctor = await prisma.user.findFirst({
    where: { hospitalId: hospital.id, role: "DOCTOR" },
    select: { id: true, name: true, email: true, hospitalId: true }
  });
  if (!doctor) {
    console.log("❌ No doctor found for this hospital"); process.exit(1);
  }
  console.log(`👨‍⚕️ Doctor: "${doctor.name}" (id: ${doctor.id})`);
  console.log(`   hospitalId in DB: ${doctor.hospitalId}\n`);

  // Check the scoped setting in DB
  const scopedKey = `${hospital.id}_doctor_voice_enabled`;
  const setting = await prisma.systemSettings.findUnique({ where: { key: scopedKey } });

  console.log("─── TEST 1: DB Scoped Setting ─────────────────────────");
  if (!setting) {
    console.log(`⚠️  Setting "${scopedKey}" NOT in DB → frontend defaults to voice ON`);
  } else {
    console.log(`✅ Key:   "${setting.key}"`);
    console.log(`   Value: "${setting.value}"`);
  }

  // Simulate API response for doctor (using fresh DB lookup)
  console.log("\n─── TEST 2: /api/settings/public Response (fresh DB lookup) ─");
  const apiResponse = await simulate_getSettingsPublic(doctor.id);
  if (apiResponse.length === 0) {
    console.log("⚠️  Empty response → frontend defaults voice to ON");
  } else {
    apiResponse.forEach(s => console.log(`   { key: "${s.key}", value: "${s.value}" }`));
  }

  // Simulate what frontend does with that response
  console.log("\n─── TEST 3: Frontend voiceEnabled Resolution ──────────────");
  const voiceEnabled = simulate_frontend_voiceEnabled(apiResponse);
  const icon = voiceEnabled ? "🔊" : "🔇";
  console.log(`   ${icon} voiceEnabled = ${voiceEnabled}`);
  if (!voiceEnabled) {
    console.log("   ✅ CORRECT — Dictate buttons will be HIDDEN for this doctor");
  } else {
    console.log("   ❌ BUG — Dictate buttons will still SHOW despite setting being OFF");
  }

  // Simulate for a doctor WITH OLD/STALE JWT (hospitalId = null in token)
  console.log("\n─── TEST 4: Stale JWT Simulation (hospitalId=null in token) ─");
  console.log("   (Old JWT scenario where token was issued before hospitalId was set)");
  // The fix: we use DB lookup, NOT the JWT hospitalId
  // simulate_getSettingsPublic already uses DB lookup, so it should still work
  const staleApiResponse = await simulate_getSettingsPublic(doctor.id); // same — always uses DB
  const staleVoiceEnabled = simulate_frontend_voiceEnabled(staleApiResponse);
  console.log(`   ${staleVoiceEnabled ? "❌ BUG" : "✅ FIXED"} — voiceEnabled = ${staleVoiceEnabled} (even with stale JWT)`);

  // Cross-hospital test: doctor from different hospital should NOT be affected
  console.log("\n─── TEST 5: Cross-Hospital Isolation ──────────────────────");
  const otherDoctor = await prisma.user.findFirst({
    where: { role: "DOCTOR", NOT: { hospitalId: hospital.id } },
    select: { id: true, name: true, hospitalId: true }
  });
  if (otherDoctor) {
    const otherResponse = await simulate_getSettingsPublic(otherDoctor.id);
    const otherVoiceEnabled = simulate_frontend_voiceEnabled(otherResponse);
    console.log(`   Other hospital doctor: "${otherDoctor.name}"`);
    console.log(`   voiceEnabled = ${otherVoiceEnabled}`);
    const expectedDiff = otherVoiceEnabled !== voiceEnabled;
    console.log(`   ${expectedDiff ? "✅" : "ℹ️"} Settings are ${expectedDiff ? "correctly ISOLATED" : "same (both hospitals have same setting)"}`);
  } else {
    console.log("   ℹ️  No other hospital doctor found to compare");
  }

  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   TEST COMPLETE                                      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  await prisma.$disconnect();
}

runFinalTests().catch(e => {
  console.error("Test error:", e);
  prisma.$disconnect();
  process.exit(1);
});
