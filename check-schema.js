import db from './backend/config/db.js';

async function checkSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Session'
      ORDER BY column_name;
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

checkSchema();
