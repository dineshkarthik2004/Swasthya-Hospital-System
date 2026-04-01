import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Legacy AI Extractors (now updated to use Prisma)
import patientRouter from "./routes/patient.js";
import doctorRouter from "./routes/doctor.js";
import patientInfoRouter from "./routes/patientInfo.js";
import adviceRouter from "./routes/advice.js";
import vitalsRouter from "./routes/vitals.js";

// New REST Endpoints
import authRouter from "./routes/auth.js";
import patientsCrudRouter from "./routes/patients.js";
import visitsCrudRouter from "./routes/visits.js";
import consultationsRouter from "./routes/consultations.js";
import staffRouter from "./routes/staff.js";
import symptomsRouter from "./routes/symptoms.js";
import medicineRouter from "./routes/medicineRoutes.js";

import { authenticateToken } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

import aiRouter from "./routes/ai.js";
import voiceRouter from "./routes/voice.js"; // just in case we need it too

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan("tiny"));

// Robust CORS origin detector
const prepareOrigins = () => {
  const defaults = ["http://localhost:5173", "http://localhost:3000"];
  let envOrigin = process.env.FRONTEND_URL;
  
  if (envOrigin) {
    envOrigin = envOrigin.trim();
    if (envOrigin.endsWith("/")) envOrigin = envOrigin.slice(0, -1);
    if (!envOrigin.startsWith("http") && envOrigin.includes(".")) {
      envOrigin = `https://${envOrigin}`;
    }
    // Strip any path (e.g. /login) — CORS only cares about the origin
    try {
      const parsed = new URL(envOrigin);
      envOrigin = parsed.origin; // e.g. "https://example.vercel.app"
    } catch (e) {
      // If URL parsing fails, use as-is
    }
    defaults.push(envOrigin);
  }
  return [...new Set(defaults)].filter(Boolean);
};

const allowedOrigins = prepareOrigins();
console.log(`[CORS] Allowed Origins:`, allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow server-to-server / non-browser requests
    if (!origin) return callback(null, true);
    
    // 2. Exact match check
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    
    // 3. Normalized check (in case of subtle mismatch)
    const normalized = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    console.warn(`[CORS REJECTION] Origin: ${origin} (Not in: ${allowedOrigins.join(', ')})`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Enable CORS for all routes (handles OPTIONS preflight automatically)
app.use(cors(corsOptions));

app.use(express.json());

// ─── Global Request Logger (Legacy fallback) ──────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[ROUTER LOG] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRouter); // Authentication endpoint (login/register)

// Protect routes using JWT middleware
// Legacy Groq Voice API
app.use("/patient", authenticateToken, patientRouter); // Patient symptoms extraction
app.use("/doctor", authenticateToken, doctorRouter);   // Doctor prescription extraction
app.use("/patient-info", authenticateToken, patientInfoRouter); // Patient info extraction
app.use("/advice", authenticateToken, adviceRouter);   // Advice & follow-up extraction
app.use("/vitals", authenticateToken, vitalsRouter);   // Patient vitals extraction

// New CRUD API
app.use("/api/patients", patientsCrudRouter);
app.use("/api/visits", visitsCrudRouter);
app.use("/api/consultations", consultationsRouter); // Mounted as /api/consultations/:id/... etc
app.use("/api/vitals", vitalsRouter); // Frontend uses /api/vitals/manual
app.use("/api/staff", staffRouter);
app.use("/api/symptoms", symptomsRouter); // Added for symptom extraction
app.use("/api/ai", aiRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/medicines", medicineRouter);
// Direct aliases requested by user workflow
import { assignDoctor } from "./controllers/visitController.js";
import { saveVitalsManual } from "./controllers/vitalsController.js";
import { prisma } from "./config/db.js";

app.post("/api/assign-doctor/:id", authenticateToken, assignDoctor);
app.post("/api/vitals/:visitId", authenticateToken, saveVitalsManual); // Frontend uses /api/vitals/manual
app.get("/api/doctors", authenticateToken, async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
        isActive: true
      },
      select: {
        id: true,
        name: true
      }
    });
    res.json(doctors || []);
  } catch (err) {
    console.error("Fetch doctors error:", err);
    res.status(500).json([]);
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "MedVoice Server API is running." });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Handle CORS errors explicitly — do NOT send a 500 as it strips CORS headers
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: "CORS: Origin not allowed" });
  }
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ─── Start server ─────────────────────────────────────────────────────────────
// (Server initialization triggered via nodemon)
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error("Server 'error' event:", err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Is another instance running?`);
    process.exit(1);
  }
});
