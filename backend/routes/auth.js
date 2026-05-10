import express from "express";
import { register, login, changePassword } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authenticateToken, changePassword);

export default router;
