import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractSymptoms } from "../controllers/symptomsController.js";

const router = Router();

// /api/symptoms/extract - Endpoint for voice extraction
router.post("/extract", authenticateToken, extractSymptoms);

export default router;
