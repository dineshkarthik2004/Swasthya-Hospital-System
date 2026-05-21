import pkg from "pg";
const { Client } = pkg;

// Direct connections (not pooler) for accurate counts
const OLD_DIRECT = "postgresql://neondb_owner:npg_ed9k6TYOEQPV@ep-bitter-dream-anxjpnuv.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";
const NEW_DIRECT = "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function countDirect(url, label) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 30000 });
  await c.connect();
  const { rows } = await c.query(`SELECT COUNT(*) FROM "Medicine"`);
  const count = parseInt(rows[0].count);
  console.log(`${label}: ${count.toLocaleString()} medicines`);
  await c.end();
  return count;
}

async function main() {
  console.log("=".repeat(55));
  console.log("🔍 True Medicine Count (Direct Non-Pooler Connections)");
  console.log("=".repeat(55));

  const oldCount = await countDirect(OLD_DIRECT, "OLD DB (US East) ");
  const newCount = await countDirect(NEW_DIRECT, "NEW DB (Singapore)");

  const diff = oldCount - newCount;
  console.log("-".repeat(55));

  if (diff === 0) {
    console.log("🎉 PERFECT MATCH! Both DBs have identical medicine counts.");
  } else {
    console.log(`⚠️  Gap: ${diff.toLocaleString()} medicines`);
  }
  console.log("=".repeat(55));
}

main().catch(e => { console.error("Failed:", e.message); process.exit(1); });
