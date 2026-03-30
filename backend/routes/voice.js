import express from "express";
import multer from "multer";
import { extractVoiceData } from "../controllers/voiceController.js";
import { authenticateToken } from "../middleware/auth.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/extract", authenticateToken, upload.single("audio"), extractVoiceData);

export default router;
