import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractVitals, saveVitalsManual } from "../controllers/vitalsController.js";

const router = Router();
router.post("/", authenticateToken, extractVitals);
router.post("/manual", authenticateToken, saveVitalsManual);
router.put("/:visitId", authenticateToken, saveVitalsManual);

export default router;
