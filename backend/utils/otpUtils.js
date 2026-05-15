/**
 * otpUtils.js
 * Utility for generating, storing, and verifying OTPs.
 *
 * Storage: In-memory Map (no DB required, ephemeral by design).
 * Each entry: { otp, expiresAt, attempts, lastSentAt }
 *
 * OTP_EXPIRY_MS  = 5 minutes
 * RESEND_COOLDOWN_MS = 60 seconds (prevent spam)
 * MAX_ATTEMPTS   = 5 (lock out after 5 wrong guesses)
 */

const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;       // 60 seconds
const MAX_ATTEMPTS = 5;

// Map<email, { otp, expiresAt, attempts, lastSentAt }>
const otpStore = new Map();

/**
 * Generates a secure 6-digit numeric OTP.
 * @returns {string}
 */
export function generateOtp() {
  // Use crypto-safe random number for better entropy
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Saves an OTP for a given email, enforcing resend cooldown.
 * @param {string} email
 * @returns {{ success: boolean, otp?: string, cooldownSeconds?: number, error?: string }}
 */
export function saveOtp(email) {
  const key = email.toLowerCase().trim();
  const now = Date.now();

  // Check cooldown — prevent spamming
  const existing = otpStore.get(key);
  if (existing) {
    const timeSinceSent = now - existing.lastSentAt;
    if (timeSinceSent < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - timeSinceSent) / 1000);
      return {
        success: false,
        cooldownSeconds: remainingSeconds,
        error: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      };
    }
  }

  const otp = generateOtp();
  otpStore.set(key, {
    otp,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: now,
  });

  console.log(`[OtpUtils] OTP stored for ${key}, expires in 5 min.`);
  return { success: true, otp };
}

/**
 * Verifies an OTP for a given email.
 * @param {string} email
 * @param {string} inputOtp
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyOtp(email, inputOtp) {
  const key = email.toLowerCase().trim();
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, error: "No OTP found. Please request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { valid: false, error: "Too many incorrect attempts. Please request a new OTP." };
  }

  if (record.otp !== String(inputOtp).trim()) {
    record.attempts += 1;
    otpStore.set(key, record);
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      valid: false,
      error: `Incorrect OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // Successful verification — remove from store immediately (single-use)
  otpStore.delete(key);
  console.log(`[OtpUtils] OTP verified successfully for ${key}`);
  return { valid: true };
}

/**
 * Returns remaining cooldown seconds for a given email (0 if no cooldown active).
 * @param {string} email
 * @returns {number}
 */
export function getResendCooldown(email) {
  const key = email.toLowerCase().trim();
  const record = otpStore.get(key);
  if (!record) return 0;
  const elapsed = Date.now() - record.lastSentAt;
  if (elapsed >= RESEND_COOLDOWN_MS) return 0;
  return Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
}

/**
 * Cleanup stale OTPs (call periodically or on-demand).
 * Safe to call at any time.
 */
export function cleanupExpiredOtps() {
  const now = Date.now();
  let removed = 0;
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[OtpUtils] Cleaned up ${removed} expired OTP(s).`);
  }
}

// Auto-cleanup every 10 minutes
setInterval(cleanupExpiredOtps, 10 * 60 * 1000);
