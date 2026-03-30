import express from "express";
import { extractAiData } from "../controllers/aiController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/extract", authenticateToken, extractAiData);

export default router;
