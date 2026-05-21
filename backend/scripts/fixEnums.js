import pkg from "pg";
const { Client } = pkg;

const SG_DIRECT =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString: SG_DIRECT, connectionTimeoutMillis: 30000 });
  await client.connect();
  console.log("Connected!\n");

  // Check current Role enum values
  const { rows: enumRows } = await client.query(`
    SELECT e.enumlabel AS val
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Role'
    ORDER BY e.enumsortorder;
  `);
  console.log("Current Role enum values:", enumRows.map((r) => r.val).join(", "));

  // Check Gender enum
  const { rows: genderRows } = await client.query(`
    SELECT e.enumlabel AS val
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Gender'
    ORDER BY e.enumsortorder;
  `);
  console.log("Current Gender enum values:", genderRows.map((r) => r.val).join(", "));

  // Check VisitStatus enum
  const { rows: vsRows } = await client.query(`
    SELECT e.enumlabel AS val
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'VisitStatus'
    ORDER BY e.enumsortorder;
  `);
  console.log("Current VisitStatus enum values:", vsRows.map((r) => r.val).join(", "));

  // Check PaymentStatus enum
  const { rows: psRows } = await client.query(`
    SELECT e.enumlabel AS val
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PaymentStatus'
    ORDER BY e.enumsortorder;
  `);
  console.log("Current PaymentStatus enum values:", psRows.map((r) => r.val).join(", "));

  // Add all required enum values
  const requiredRoles = ["PATIENT", "RECEPTIONIST", "DOCTOR", "LAB_TECH", "ADMIN"];
  const requiredGender = ["MALE", "FEMALE", "OTHER"];
  const requiredVisitStatus = ["WAITING", "VITALS_COMPLETED", "ASSIGNED_TO_DOCTOR", "CONSULTED", "PRESCRIPTION_COMPLETED", "PAYMENT_COLLECTED"];
  const requiredPaymentStatus = ["UNPAID", "PAID", "WAIVED"];

  const existing = {
    Role: enumRows.map((r) => r.val),
    Gender: genderRows.map((r) => r.val),
    VisitStatus: vsRows.map((r) => r.val),
    PaymentStatus: psRows.map((r) => r.val),
  };

  const toAdd = [
    ...requiredRoles.filter((v) => !existing.Role.includes(v)).map((v) => ({ type: "Role", val: v })),
    ...requiredGender.filter((v) => !existing.Gender.includes(v)).map((v) => ({ type: "Gender", val: v })),
    ...requiredVisitStatus.filter((v) => !existing.VisitStatus.includes(v)).map((v) => ({ type: "VisitStatus", val: v })),
    ...requiredPaymentStatus.filter((v) => !existing.PaymentStatus.includes(v)).map((v) => ({ type: "PaymentStatus", val: v })),
  ];

  if (toAdd.length === 0) {
    console.log("\n✅ All enum values already present!");
  } else {
    console.log(`\nAdding ${toAdd.length} missing enum values...`);
    for (const { type, val } of toAdd) {
      await client.query(`ALTER TYPE "${type}" ADD VALUE IF NOT EXISTS '${val}'`);
      console.log(`✅ Added ${type}.${val}`);
    }
  }

  await client.end();
  console.log("\n✅ Enum fix complete!");
}

run().catch((e) => { console.error("Failed:", e.message); process.exit(1); });
