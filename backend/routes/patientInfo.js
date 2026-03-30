// routes/patientInfo.js
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractPatientInfo } from "../controllers/patientInfoController.js";

const router = Router();
router.post("/", authenticateToken, extractPatientInfo);

export default router;
