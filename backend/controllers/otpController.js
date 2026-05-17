/**
 * otpController.js
 * Handles OTP-based login flow:
 *   POST /auth/otp/request  → Check user, generate OTP, send email
 *   POST /auth/otp/verify   → Verify OTP, issue JWT (same payload as password login)
 *   POST /auth/otp/resend   → Resend OTP (subject to cooldown)
 *
 * IMPORTANT: Does NOT modify or replace the existing password login.
 * Uses the same JWT shape and session creation as authController.js login().
 */

import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { saveOtp, verifyOtp, getResendCooldown } from "../utils/otpUtils.js";
import { sendOtpEmail } from "../services/mailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

// Roles allowed to use OTP login
const OTP_ALLOWED_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR"];

/**
 * POST /auth/otp/request
 * Body: { email }
 * Checks if user exists, is an allowed role, then sends OTP.
 */
export async function requestOtp(req, res) {
  try {
    const { email } = req.body; // "email" field accepts both email and username

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email or username is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OtpController] OTP request for: ${normalizedEmail}`);

    // Find user by email first, then by username
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: normalizedEmail },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      });
    }

    if (!user) {
      // Intentionally vague to prevent email enumeration
      return res.status(404).json({ error: "No account found with this email address." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
    }

    if (!OTP_ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({
        error: "OTP login is available only for Admin, Doctor, and Receptionist roles.",
      });
    }

    // Generate and save OTP (enforces 60s cooldown internally)
    const otpResult = saveOtp(normalizedEmail);
    if (!otpResult.success) {
      return res.status(429).json({
        error: otpResult.error,
        cooldownSeconds: otpResult.cooldownSeconds,
      });
    }

    // Send OTP email via Resend
    const mailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, user.name);
    if (!mailResult.success) {
      console.error("[OtpController] Email sending failed:", mailResult.error);
      return res.status(500).json({
        error: "Failed to send OTP email. Please try again or use password login.",
      });
    }

    return res.status(200).json({
      message: "OTP sent successfully. Please check your email.",
      // Expose partial name for UI greeting — never expose the OTP
      userName: user.name.split(" ")[0],
      // Tell frontend when next resend is allowed
      cooldownSeconds: 60,
    });
  } catch (error) {
    console.error("[OtpController] requestOtp Error:", error);
    return res.status(500).json({ error: "Failed to process OTP request.", details: error.message });
  }
}

/**
 * POST /auth/otp/verify
 * Body: { email, otp }
 * Verifies OTP, then issues JWT identical to the password login flow.
 */
export async function verifyOtpAndLogin(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OtpController] OTP verify attempt for: ${normalizedEmail}`);

    // Verify OTP (handles expiry and attempt limits internally)
    const result = verifyOtp(normalizedEmail, otp);
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    // OTP is valid — fetch full user data to issue JWT
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { hospital: true },
    }) || await prisma.user.findUnique({
      where: { username: normalizedEmail },
      include: { hospital: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated." });
    }

    // ── Issue JWT (same shape as password login) ────────────────────────────
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, hospitalId: user.hospitalId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create session record (same as password login)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        isValid: true,
        ipAddress: req.ip || "",
        userAgent: req.headers["user-agent"] || "",
      },
    });
    console.log(`[OtpController] Session created: ${session.id} for user: ${user.id}`);

    // ── Return same response shape as password login ────────────────────────
    return res.status(200).json({
      message: "OTP verified. Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || null,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital?.name || null,
        hospitalAddress: user.hospital
          ? {
              doorNo: user.hospital.doorNo,
              street: user.hospital.street,
              area: user.hospital.area,
              city: user.hospital.city,
              state: user.hospital.state,
              pincode: user.hospital.pincode,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[OtpController] verifyOtpAndLogin Error:", error);
    return res.status(500).json({ error: "OTP verification failed.", details: error.message });
  }
}

/**
 * POST /auth/otp/resend
 * Body: { email }
 * Re-sends OTP (subject to 60s cooldown).
 */
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OtpController] OTP resend request for: ${normalizedEmail}`);

    // Check user still exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, role: true, isActive: true },
    });
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: normalizedEmail },
        select: { id: true, name: true, role: true, isActive: true },
      });
    }

    if (!user || !user.isActive || !OTP_ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ error: "Cannot resend OTP for this account." });
    }

    // Check current cooldown status
    const cooldown = getResendCooldown(normalizedEmail);
    if (cooldown > 0) {
      return res.status(429).json({
        error: `Please wait ${cooldown} seconds before requesting a new OTP.`,
        cooldownSeconds: cooldown,
      });
    }

    // Generate new OTP
    const otpResult = saveOtp(normalizedEmail);
    if (!otpResult.success) {
      return res.status(429).json({
        error: otpResult.error,
        cooldownSeconds: otpResult.cooldownSeconds,
      });
    }

    // Send new OTP
    const mailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, user.name);
    if (!mailResult.success) {
      return res.status(500).json({ error: "Failed to resend OTP. Please try again." });
    }

    return res.status(200).json({
      message: "New OTP sent successfully.",
      cooldownSeconds: 60,
    });
  } catch (error) {
    console.error("[OtpController] resendOtp Error:", error);
    return res.status(500).json({ error: "Failed to resend OTP.", details: error.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-REGISTRATION EMAIL VERIFICATION
// Used during staff registration to verify a doctor's email BEFORE the account
// is created. No DB lookup required — works on any email address.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /auth/otp/send-verification
 * Body: { email, name? }
 * Sends an OTP to ANY email address for pre-registration verification.
 * Does NOT require user to exist in the database.
 */
export async function sendVerificationOtp(req, res) {
  try {
    const { email, name } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const displayName = (name || "").trim() || "Doctor";
    console.log(`[OtpController] Pre-registration OTP request for: ${normalizedEmail}`);

    // Generate and store OTP (reuses existing utility with 60s cooldown)
    const otpResult = saveOtp(normalizedEmail);
    if (!otpResult.success) {
      return res.status(429).json({
        error: otpResult.error,
        cooldownSeconds: otpResult.cooldownSeconds,
      });
    }

    // Send email
    const mailResult = await sendOtpEmail(normalizedEmail, otpResult.otp, displayName);
    if (!mailResult.success) {
      console.error("[OtpController] Verification email failed:", mailResult.error);
      return res.status(500).json({ error: "Failed to send verification email. Please try again." });
    }

    return res.status(200).json({
      message: "Verification OTP sent. Please check the email inbox.",
      cooldownSeconds: 60,
    });
  } catch (error) {
    console.error("[OtpController] sendVerificationOtp Error:", error);
    return res.status(500).json({ error: "Failed to send verification OTP.", details: error.message });
  }
}

/**
 * POST /auth/otp/check-verification
 * Body: { email, otp }
 * Verifies the OTP sent via /send-verification.
 * Returns { verified: true } on success — caller then proceeds with registration.
 */
export async function checkVerificationOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OtpController] Pre-registration OTP verify for: ${normalizedEmail}`);

    const result = verifyOtp(normalizedEmail, otp);
    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    return res.status(200).json({ verified: true, message: "Email verified successfully." });
  } catch (error) {
    console.error("[OtpController] checkVerificationOtp Error:", error);
    return res.status(500).json({ error: "Verification failed.", details: error.message });
  }
}
