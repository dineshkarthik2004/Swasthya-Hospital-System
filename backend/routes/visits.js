import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { createVisit, listVisits, assignDoctor, updateVisitStatus, getReceptionistStats, getVisitDetails, receptionCreateVisit } from "../controllers/visitController.js";

const router = Router();

// Receptionist, Doctor, Patient can list visits
router.get("/", authenticateToken, requireRole("RECEPTIONIST", "DOCTOR", "PATIENT", "ADMIN"), listVisits);

// Patients and Receptionists can create visits
router.get("/stats/receptionist", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), getReceptionistStats);
router.get("/:id", authenticateToken, requireRole("RECEPTIONIST", "DOCTOR", "PATIENT", "ADMIN"), getVisitDetails);
router.post("/", authenticateToken, requireRole("RECEPTIONIST", "PATIENT", "ADMIN"), createVisit);
router.post("/reception-create", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), receptionCreateVisit);
router.patch("/:id/assign", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), assignDoctor);

// Receptionist updates status generally
router.patch("/:id/status", authenticateToken, requireRole("RECEPTIONIST", "DOCTOR"), updateVisitStatus);

export default router;
