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

// ─── Prisma Client ─────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
const separator = dbUrl.includes("?") ? "&" : "?";
const fullUrl = `${dbUrl}${separator}connect_timeout=30&pool_timeout=30&connection_limit=5`;

export const prisma = new PrismaClient({
  log: ["error", "warn"],
  datasources: {
    db: {
      url: fullUrl
    }
  }
});

// Keep Prisma connection alive with periodic pings
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.warn("[DB] Prisma keepalive ping failed, reconnecting...", e.message);
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log("[DB] Prisma reconnected successfully");
    } catch (reconnectErr) {
      console.error("[DB] Prisma reconnect failed:", reconnectErr.message);
    }
  }
}, 30000); // every 30 seconds

export default pool;
