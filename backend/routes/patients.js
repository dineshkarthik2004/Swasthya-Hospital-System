import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { listPatients, createPatient, getPatient } from "../controllers/patientMgmtController.js";

const router = Router();

// Receptionist and Doctor can view patients
router.get("/", authenticateToken, requireRole("RECEPTIONIST", "DOCTOR", "ADMIN"), listPatients);
router.get("/:id", authenticateToken, requireRole("RECEPTIONIST", "DOCTOR", "ADMIN"), getPatient);

// Only Receptionist/Admin can create patients
router.post("/", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), createPatient);

export default router;
