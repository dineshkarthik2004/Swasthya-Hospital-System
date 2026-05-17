/**
 * setup4thHospital.js
 * Creates 4th hospital, links existing admin, creates doctor & receptionist.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_ID   = "cmp9p85ee000110j3uffyof9z"; // admin@hospital (already exists)
const PASSWORD   = "password123";

async function main() {
  console.log("\n🏥 Setting up 4th Hospital...\n");

  // ── 1. Create the hospital ─────────────────────────────────────────────────
  const hospital = await prisma.hospital.create({
    data: {
      name: "Hospital",
      subscriptionStatus: "ACTIVE",
      serviceFee: 0,
      featuresEnabled: "[]"
    }
  });
  console.log(`✅ Hospital created: "${hospital.name}"  [${hospital.id}]`);

  // ── 2. Link existing admin to this hospital ────────────────────────────────
  await prisma.user.update({
    where: { id: ADMIN_ID },
    data: { hospitalId: hospital.id }
  });
  console.log(`✅ Admin (admin@hospital) linked to hospital`);

  const hash = await bcrypt.hash(PASSWORD, 10);

  // ── 3. Create Doctor ───────────────────────────────────────────────────────
  const doctor = await prisma.user.create({
    data: {
      name: "Doctor",
      email: `doctor.hospital.${Date.now()}@noemail.local`,
      username: "doctor@hospital",
      password: hash,
      role: "DOCTOR",
      isActive: true,
      hospitalId: hospital.id
    }
  });
  console.log(`✅ Doctor created:       username = doctor@hospital  |  id = ${doctor.id}`);

  // ── 4. Create Receptionist ─────────────────────────────────────────────────
  const receptionist = await prisma.user.create({
    data: {
      name: "Receptionist",
      email: `receptionist.hospital.${Date.now()}@noemail.local`,
      username: "receptionist@hospital",
      password: hash,
      role: "RECEPTIONIST",
      isActive: true,
      hospitalId: hospital.id
    }
  });
  console.log(`✅ Receptionist created: username = receptionist@hospital  |  id = ${receptionist.id}`);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 4th Hospital setup complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hospital  : ${hospital.name}  [${hospital.id}]

Login credentials (all use password: password123)
  Admin        → username: admin@hospital
  Doctor       → username: doctor@hospital
  Receptionist → username: receptionist@hospital
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch(err => { console.error("❌ Error:", err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
