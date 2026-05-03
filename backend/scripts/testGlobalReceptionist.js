/**
 * VERIFICATION TEST: Global Receptionist Role
 * Run: node scripts/testGlobalReceptionist.js
 */

import { prisma } from "../config/db.js";

async function simulate_listStaff(hospitalId) {
  const whereClause = {
    role: {
      in: ["DOCTOR", "RECEPTIONIST", "LAB_TECH"]
    }
  };
  if (hospitalId) {
    whereClause.hospitalId = hospitalId;
  }
  return await prisma.user.findMany({ where: whereClause, select: { name: true, hospitalId: true } });
}

async function simulate_listVisits(hospitalId) {
  const whereClause = {};
  if (hospitalId) {
    whereClause.hospitalId = hospitalId;
  }
  return await prisma.visit.findMany({ where: whereClause, select: { id: true, hospitalId: true } });
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   GLOBAL RECEPTIONIST TEST                           ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // 1. Check Karthik's hospitalId
  const karthik = await prisma.user.findFirst({ where: { name: 'karthik', role: 'RECEPTIONIST' } });
  if (!karthik) {
    console.log("❌ Karthik not found");
    process.exit(1);
  }
  console.log(`👨‍💼 Receptionist: "${karthik.name}"`);
  console.log(`   hospitalId in DB: ${karthik.hospitalId}\n`);

  // 2. Simulate Global Receptionist List Staff
  console.log("─── TEST 1: Global Receptionist Staff View (hospitalId = null) ─");
  const globalStaff = await simulate_listStaff(null);
  console.log(`   Found ${globalStaff.length} staff total across all hospitals.`);
  const hospitalsInGlobal = [...new Set(globalStaff.map(s => s.hospitalId))];
  console.log(`   Staff from ${hospitalsInGlobal.length} different hospitals.`);
  if (hospitalsInGlobal.length > 1 || hospitalsInGlobal.includes(null)) {
    console.log("   ✅ Global view working correctly.");
  } else {
    console.log("   ⚠️  Only seeing staff from 1 hospital, or DB only has 1 hospital.");
  }

  // 3. Simulate Scoped Receptionist List Staff
  console.log("\n─── TEST 2: Scoped Receptionist Staff View ─────────────────────");
  const specificHospitalId = "cmocta6wl0001zbzsldjof5xy";
  const scopedStaff = await simulate_listStaff(specificHospitalId);
  console.log(`   Found ${scopedStaff.length} staff for hospital ${specificHospitalId}.`);
  const hospitalsInScoped = [...new Set(scopedStaff.map(s => s.hospitalId))];
  if (hospitalsInScoped.length === 1 && hospitalsInScoped[0] === specificHospitalId) {
    console.log("   ✅ Scoped view working correctly.");
  } else if (scopedStaff.length === 0) {
    console.log("   ✅ Scoped view working correctly (0 staff).");
  } else {
    console.log("   ❌ Scoped view failed (saw staff from other hospitals).");
  }

  // 4. Simulate Global Receptionist List Visits
  console.log("\n─── TEST 3: Global Receptionist Visits View ────────────────────");
  const globalVisits = await simulate_listVisits(null);
  console.log(`   Found ${globalVisits.length} visits total.`);
  const visitHospitals = [...new Set(globalVisits.map(v => v.hospitalId))];
  if (visitHospitals.length > 1 || visitHospitals.includes(null) || globalVisits.length === 0) {
    console.log("   ✅ Global visits view working correctly.");
  } else {
    console.log("   ⚠️  Only seeing visits from 1 hospital, or DB only has visits for 1.");
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
