import pkg from "pg";
const { Client } = pkg;

const SG_DIRECT =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString: SG_DIRECT, connectionTimeoutMillis: 30000 });
  await client.connect();
  console.log("Connected!\n");

  // Add all columns that might be missing from migrations that partially applied
  const fixes = [
    // User table - doctor clinic fields (migration 2)
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "branchName" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "doorNo" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "street" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pincode" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clinicName" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qualification" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialization" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hospitalId" TEXT`,
    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`,
    // Patient table
    `ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hospitalId" TEXT`,
    `ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "abha" TEXT`,
    `ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "uhid" TEXT`,
    `ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "bloodGroup" TEXT`,
    `ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "address" TEXT`,
    // Visit table
    `ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "hospitalId" TEXT`,
    `ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "relation" TEXT`,
    `ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "appointmentTime" TIMESTAMP(3)`,
    `ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "bookedById" TEXT`,
    `ALTER TABLE "Visit" ADD COLUMN IF NOT EXISTS "feeType" TEXT`,
    // Consultation table
    `ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "hospitalId" TEXT`,
    `ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "adviceInstructions" TEXT`,
    `ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "consultationNotes" TEXT`,
    `ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "labPending" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Consultation" ADD COLUMN IF NOT EXISTS "followUpDate" TIMESTAMP(3)`,
    // PrescriptionItem
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "composition" TEXT`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "dosageMorning" DOUBLE PRECISION`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "dosageAfternoon" DOUBLE PRECISION`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "dosageNight" DOUBLE PRECISION`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "frequency" TEXT`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "days" INTEGER`,
    `ALTER TABLE "PrescriptionItem" ADD COLUMN IF NOT EXISTS "instructions" TEXT`,
    // Session
    `ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT`,
    `ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT`,
    // Hospital FK on User
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'User_hospitalId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
    // Unique constraint on username
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'User_username_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
      END IF;
    END $$`,
  ];

  for (const sql of fixes) {
    try {
      await client.query(sql);
      const col = sql.match(/COLUMN IF NOT EXISTS "(\w+)"/)?.[1] || sql.slice(0, 60);
      console.log(`✅ ${col}`);
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(`⚠️  Already exists (ok)`);
      } else {
        console.error(`❌ ${e.message}`);
      }
    }
  }

  // Show final User columns
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='User' ORDER BY ordinal_position`
  );
  console.log(`\n✅ User table columns (${rows.length}): ${rows.map((r) => r.column_name).join(", ")}`);

  await client.end();
  console.log("\n✅ All missing columns added!");
}

run().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
