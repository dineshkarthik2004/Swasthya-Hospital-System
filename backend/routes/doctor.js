// routes/doctor.js — Defines the POST /doctor route
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractPrescription } from "../controllers/doctorController.js";

const router = Router();

// POST /doctor — receives speech transcript and returns structured prescription
router.post("/", authenticateToken, extractPrescription);

export default router;
