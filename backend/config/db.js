import pkg from "pg";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const { Pool } = pkg;

// ─── Raw SQL Pool (legacy / session management) ────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 20000,
});

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("[DB] Database connection error:", err.message);
  } else {
    console.log("[DB] Database connected successfully at:", res.rows[0].now);
  }
});

// singleton prisma
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ─── Retry-on-demand Helper ──────────────────────────────────────────────────
// This handles Neon cold starts (P1001 errors) gracefully by retrying once.
export async function safeQuery(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err.code === "P1001" || err.message?.includes("Can't reach database server")) {
      console.log("[DB] Neon waking up, retrying query in 2s...");
      await new Promise(res => setTimeout(res, 2000));
      return await fn(); 
    }
    throw err;
  }
}

export default pool;
