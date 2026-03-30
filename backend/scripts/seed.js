import db from "../config/db.js";
import bcrypt from "bcryptjs";

async function seed() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  console.log("[Seed] Cleaning up old test data...");
  try {
    await db.query('DELETE FROM "Session" WHERE token = $1', ["test_token_123"]);
    
    console.log("[Seed] Upserting test user...");
    const userRes = await db.query('SELECT id FROM "User" WHERE email = $1', ["test@medvoice.com"]);
    let userId;
    
    if (userRes.rowCount > 0) {
      userId = userRes.rows[0].id;
      await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    } else {
      const newUserRes = await db.query(
        'INSERT INTO "User" (name, email, password, "updatedAt") VALUES ($1, $2, $3, NOW()) RETURNING id',
        ["Dr. Test", "test@medvoice.com", hashedPassword]
      );
      userId = newUserRes.rows[0].id;
    }

    console.log("[Seed] Seeded user ID:", userId);

    console.log("[Seed] Create test session...");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'INSERT INTO "Session" (token, "userId", "expiresAt", "isValid") VALUES ($1, $2, $3, $4)',
      ["test_token_123", userId, expiresAt, true]
    );

    console.log("[Seed] Successfully seeded session: test_token_123");
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
