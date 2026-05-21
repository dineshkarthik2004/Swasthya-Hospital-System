import { PrismaClient } from "@prisma/client";

const OLD_URL =
  "postgresql://neondb_owner:npg_ed9k6TYOEQPV@ep-bitter-dream-anxjpnuv-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";
const NEW_URL =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=60&pool_timeout=60&connection_limit=3";

const old = new PrismaClient({ datasources: { db: { url: OLD_URL } } });
const neu = new PrismaClient({ datasources: { db: { url: NEW_URL } } });

const BATCH = 5000;

async function main() {
  console.log("=".repeat(60));
  console.log("🔧 Filling Missing Medicines: US → Singapore");
  console.log("=".repeat(60));

  console.log("\n📊 Counting medicines in both DBs...");
  const [oldTotal, newTotal] = await Promise.all([
    old.medicine.count(),
    neu.medicine.count(),
  ]);
  console.log(`   OLD (US):        ${oldTotal.toLocaleString()}`);
  console.log(`   NEW (Singapore): ${newTotal.toLocaleString()}`);
  console.log(`   Gap:             ${(oldTotal - newTotal).toLocaleString()}`);

  if (oldTotal === newTotal) {
    console.log("\n✅ Both DBs already have the same count. Nothing to do!");
    return;
  }

  // ── Step 1: Fetch all existing IDs from Singapore in pages ─────────────────
  console.log("\n📥 Loading all existing medicine IDs from Singapore...");
  const existingIds = new Set();
  // Use cursor-based pagination — reliable with PgBouncer (no skip/offset)
  let cursor = undefined;
  while (true) {
    const rows = await neu.medicine.findMany({
      select: { id: true },
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    if (rows.length === 0) break;
    rows.forEach((r) => existingIds.add(r.id));
    cursor = rows[rows.length - 1].id;
    process.stdout.write(`\r   Loaded ${existingIds.size.toLocaleString()} IDs...`);
  }
  console.log(`\r   ✅ ${existingIds.size.toLocaleString()} existing IDs loaded from Singapore`);

  // ── Step 2: Stream all medicines from OLD DB and insert missing ones ────────
  console.log("\n🔄 Scanning OLD DB for missing medicines...");
  let scanned = 0;
  let inserted = 0;
  let oldSkip = 0;

  while (true) {
    const rows = await old.medicine.findMany({
      skip: oldSkip,
      take: BATCH,
      orderBy: { createdAt: "asc" },
    });

    if (rows.length === 0) break;

    // Filter to only missing rows
    const missing = rows.filter((r) => !existingIds.has(r.id));

    if (missing.length > 0) {
      await neu.medicine.createMany({ data: missing, skipDuplicates: true });
      inserted += missing.length;
      missing.forEach((r) => existingIds.add(r.id)); // update tracking set
    }

    scanned += rows.length;
    oldSkip += BATCH;
    process.stdout.write(
      `\r   Scanned: ${scanned.toLocaleString()} / ${oldTotal.toLocaleString()} | Inserted: ${inserted.toLocaleString()}`
    );
  }

  // ── Step 3: Final verification ─────────────────────────────────────────────
  console.log(`\r   ✅ Scanned: ${scanned.toLocaleString()} | Inserted: ${inserted.toLocaleString()} missing medicines\n`);

  const finalCount = await neu.medicine.count();
  console.log("=".repeat(60));
  console.log(`📊 Final Singapore Medicine Count: ${finalCount.toLocaleString()}`);
  console.log(`📊 Old US Medicine Count:          ${oldTotal.toLocaleString()}`);

  if (finalCount === oldTotal) {
    console.log("🎉 PERFECT MATCH! All medicines are now in Singapore DB.");
  } else {
    console.log(`⚠️  Still ${(oldTotal - finalCount).toLocaleString()} short. Run script again.`);
  }
  console.log("=".repeat(60));
}

main()
  .catch((e) => { console.error("❌ Failed:", e.message); process.exit(1); })
  .finally(async () => { await old.$disconnect(); await neu.$disconnect(); });
