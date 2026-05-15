/**
 * mailService.js
 * Centralized email sending service using Resend.
 * Reusable across the project — does NOT modify existing auth flow.
 */

import { Resend } from "resend";

// Initialize Resend client with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const SENDER_EMAIL = "auth@samjnaanalytics.ai";
const SENDER_NAME = "Swasthya Clinic";

/**
 * Sends an OTP email to the specified address.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} userName - Display name of the user
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendOtpEmail(toEmail, otp, userName = "User") {
  try {
    console.log(`[MailService] Sending OTP to: ${toEmail}`);

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [toEmail],
      subject: "Your Login OTP – Swasthya Clinic",
      html: buildOtpEmailHtml(otp, userName),
    });

    if (error) {
      console.error("[MailService] Resend API Error:", error);
      return { success: false, error: error.message || "Failed to send email" };
    }

    console.log(`[MailService] OTP email sent successfully. Email ID: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error("[MailService] Unexpected error sending email:", err);
    return { success: false, error: err.message || "Unexpected mail error" };
  }
}

/**
 * Builds the HTML template for the OTP email.
 * @param {string} otp
 * @param {string} userName
 * @returns {string} HTML string
 */
function buildOtpEmailHtml(otp, userName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Login OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a56db,#0ea5e9);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">🏥 Swasthya Clinic</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Secure Login Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 12px;font-size:16px;color:#374151;">Hello, <strong>${userName}</strong>!</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                We received a login request for your account. Use the OTP below to complete your sign-in.
                This code is valid for <strong>5 minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#f0f9ff;border:2px dashed #0ea5e9;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your One-Time Password</p>
                <p style="margin:0;font-size:40px;font-weight:800;color:#1a56db;letter-spacing:10px;font-family:'Courier New',monospace;">${otp}</p>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">⚠️ Do not share this OTP with anyone. Our team will never ask for it.</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">If you did not request this, please ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Swasthya Clinic · Powered by SamjnaAnalytics.ai</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
