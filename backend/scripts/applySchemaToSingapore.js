import pkg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct (non-pooler) connection for DDL
const NEW_DIRECT_URL =
  "postgresql://neondb_owner:npg_GbLP0MJk7HxF@ep-lucky-rain-aooanpd5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function runSQL() {
  const client = new Client({
    connectionString: NEW_DIRECT_URL,
    connectionTimeoutMillis: 30000,
    query_timeout: 60000,
  });

  console.log("Connecting to Singapore DB (direct)...");
  await client.connect();
  console.log("✅ Connected!\n");

  const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
  const migrationFolders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  for (const folder of migrationFolders) {
    const sqlFile = path.join(migrationsDir, folder, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;

    const sql = fs.readFileSync(sqlFile, "utf8");
    console.log(`Running migration: ${folder}`);
    try {
      await client.query(sql);
      console.log(`✅ Done\n`);
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log(`⚠️  Already exists (skipping): ${err.message.slice(0, 80)}\n`);
      } else {
        console.error(`❌ Error: ${err.message}`);
        throw err;
      }
    }
  }

  // Create _prisma_migrations tracking table + mark all as applied
  console.log("Setting up Prisma migration tracking...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      id VARCHAR(36) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      finished_at TIMESTAMPTZ,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT,
      rolled_back_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      applied_steps_count INTEGER NOT NULL DEFAULT 0
    );
  `);

  for (const folder of migrationFolders) {
    const sqlFile = path.join(migrationsDir, folder, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;
    await client.query(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, applied_steps_count)
      VALUES (gen_random_uuid()::text, 'manual', now(), $1, 1)
      ON CONFLICT DO NOTHING;
    `, [folder]);
  }

  console.log("✅ Migration tracking set up\n");

  // Verify tables exist
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.log("📋 Tables in Singapore DB:");
  rows.forEach((r) => console.log(`   - ${r.table_name}`));

  await client.end();
  console.log("\n✅ Schema ready in Singapore DB!");
}

runSQL().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
