import express from "express";
import { 
  getHospitals, createHospital, updateHospital, deleteHospital,
  getDoctors, getPatients, getHospitalPayments, updatePaymentStatus,
  getSettings, updateSetting, getHospitalDashboardStats
} from "../controllers/adminController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateToken, requireRole("ADMIN"));

// Dashboard Stats (Scoped to Hospital)
router.get("/stats", getHospitalDashboardStats);

// Hospitals
router.get("/hospitals", getHospitals);
router.post("/hospitals", createHospital);
router.put("/hospitals/:id", updateHospital);
router.delete("/hospitals/:id", deleteHospital);

// Doctors & Patients
router.get("/doctors", getDoctors);
router.get("/patients", getPatients);

// Payments
router.get("/payments", getHospitalPayments);
router.put("/payments/:id", updatePaymentStatus);

// Settings
router.get("/settings", getSettings);
router.post("/settings", updateSetting);

export default router;
