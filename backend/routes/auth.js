import express from "express";
import { register, login, changePassword } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

// ── OTP Login (additive — does NOT change existing password login) ─────────────
import { requestOtp, verifyOtpAndLogin, resendOtp, sendVerificationOtp, checkVerificationOtp } from "../controllers/otpController.js";

const router = express.Router();

// ── Existing routes (unchanged) ────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/change-password", authenticateToken, changePassword);

// ── OTP Routes ─────────────────────────────────────────────────────────────────
router.post("/otp/request", requestOtp);        // Step 1: Send OTP (login)
router.post("/otp/verify", verifyOtpAndLogin);  // Step 2: Verify & issue JWT (login)
router.post("/otp/resend", resendOtp);          // Optional: Resend OTP (login)

// ── Pre-Registration Email Verification (for Doctor registration) ──────────────
router.post("/otp/send-verification", sendVerificationOtp);   // Send OTP to any email
router.post("/otp/check-verification", checkVerificationOtp); // Verify OTP (no JWT issued)

export default router;
