import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { listStaff, listDoctors, createStaff, updateStaff, toggleStaffStatus } from "../controllers/staffController.js";

const router = Router();

// All authenticated roles can list doctors (e.g. receptionist for assignment)
router.get("/doctors", authenticateToken, listDoctors);

// Only receptionist/admin can list all staff
router.get("/", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), listStaff);

// Create staff member (receptionist registers new doctor/receptionist)
router.post("/create", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), createStaff);

// Update staff profile
router.put("/:id", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), updateStaff);

// Toggle staff active/inactive status
router.patch("/:id/status", authenticateToken, requireRole("RECEPTIONIST", "ADMIN"), toggleStaffStatus);

export default router;
