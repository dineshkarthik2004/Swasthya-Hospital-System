// routes/advice.js
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { extractAdvice } from "../controllers/adviceController.js";

const router = Router();
router.post("/", authenticateToken, extractAdvice);

export default router;
