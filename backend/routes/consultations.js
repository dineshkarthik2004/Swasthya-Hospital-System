import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { getAssignedPatients, saveConsultation, savePrescription, completeConsultation, finalizeConsultation } from "../controllers/consultationController.js";

const router = Router();

router.post("/finalize", authenticateToken, finalizeConsultation);

// All Doctor specific routes
router.get("/assigned", authenticateToken, requireRole("DOCTOR"), getAssignedPatients);

// Operating on a specific visit
router.post("/:id/consultation", authenticateToken, requireRole("DOCTOR"), saveConsultation);
router.post("/:id/prescription", authenticateToken, requireRole("DOCTOR"), savePrescription);
router.patch("/:id/complete", authenticateToken, requireRole("DOCTOR"), completeConsultation);

export default router;
