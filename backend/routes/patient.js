// routes/patient.js — Defines the POST /patient route
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractDiseases } from "../controllers/patientController.js";

const router = Router();

// POST /patient — receives speech transcript and returns extracted diseases
router.post("/", authenticateToken, extractDiseases);

export default router;
