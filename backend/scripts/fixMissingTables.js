import pkg from "pg";
import { fileURLToPath } from "url";

const { Client } = pkg;

const NEW_DIRECT_URL =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const missingTablesSQL = `
CREATE TABLE IF NOT EXISTS "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "serviceFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "featuresEnabled" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HospitalPayment" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HospitalPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (add only if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'HospitalPayment_hospitalId_fkey'
  ) THEN
    ALTER TABLE "HospitalPayment" ADD CONSTRAINT "HospitalPayment_hospitalId_fkey"
      FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SystemSettings_key_key'
  ) THEN
    ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_key_key" UNIQUE ("key");
  END IF;
END $$;

-- Add hospitalId column to tables that need it (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='hospitalId') THEN
    ALTER TABLE "User" ADD COLUMN "hospitalId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Patient' AND column_name='hospitalId') THEN
    ALTER TABLE "Patient" ADD COLUMN "hospitalId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Visit' AND column_name='hospitalId') THEN
    ALTER TABLE "Visit" ADD COLUMN "hospitalId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultation' AND column_name='hospitalId') THEN
    ALTER TABLE "Consultation" ADD COLUMN "hospitalId" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='username') THEN
    ALTER TABLE "User" ADD COLUMN "username" TEXT;
  END IF;
END $$;
`;

async function run() {
  const client = new Client({
    connectionString: NEW_DIRECT_URL,
    connectionTimeoutMillis: 30000,
  });

  console.log("Connecting to Singapore DB...");
  await client.connect();
  console.log("✅ Connected!\n");

  console.log("Creating missing tables...");
  await client.query(missingTablesSQL);
  console.log("✅ Tables created!\n");

  // Verify all tables now
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log("📋 All tables in Singapore DB:");
  rows.forEach((r) => console.log(`   ✅ ${r.table_name}`));

  await client.end();
  console.log("\n✅ Schema complete! Ready for data migration.");
}

run().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
