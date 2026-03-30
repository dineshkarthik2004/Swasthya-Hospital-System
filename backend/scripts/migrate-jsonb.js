import db from '../config/db.js';

async function migrate() {
  try {
    console.log("Starting JSONB migration for symptoms...");
    await db.query(`ALTER TABLE "Session" ALTER COLUMN symptoms TYPE jsonb USING symptoms::jsonb;`);
    console.log("Migration SUCCESS: symptoms is now jsonb");
  } catch (e) {
    console.error("Migration FAILED:", e.message);
    if (e.message.includes("cannot be cast automatically")) {
        console.log("Attempting more aggressive migration (resetting symptoms column)...");
        await db.query(`ALTER TABLE "Session" DROP COLUMN symptoms;`);
        await db.query(`ALTER TABLE "Session" ADD COLUMN symptoms jsonb;`);
        console.log("Migration SUCCESS: symptoms recreated as jsonb");
    }
  } finally {
    process.exit(0);
  }
}

migrate();
