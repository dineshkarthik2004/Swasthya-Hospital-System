/**
 * OtpLoginPage.jsx
 * OTP-based login flow — two steps:
 *   Step 1: Enter email → request OTP
 *   Step 2: Enter OTP → verify → navigate to dashboard
 *
 * Existing password login (/login) is NOT modified.
 * This page is mounted at /otp-login in App.jsx.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, Mail, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import api from "../services/api";

// ── Helper ─────────────────────────────────────────────────────────────────────

const ROLE_REDIRECTS = {
  ADMIN: "/admin/dashboard",
  RECEPTIONIST: "/receptionist/dashboard",
  DOCTOR: "/doctor/dashboard",
  PATIENT: "/patient/records",
};

// ── OTP Input Component ────────────────────────────────────────────────────────
// A stylized 6-box OTP input that auto-advances focus.

function OtpInputGrid({ value, onChange, disabled }) {
  const inputRefs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");

  const handleChange = (index, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join("").trimEnd();
    onChange(combined);

    // Auto-advance focus
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    // Focus last filled box
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: "44px",
            height: "52px",
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "700",
            fontFamily: "'Courier New', monospace",
            border: "2px solid",
            borderColor: digits[i].trim() ? "hsl(var(--primary))" : "hsl(var(--border))",
            borderRadius: "8px",
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown Timer ────────────────────────────────────────────────────────────

function useCountdown(initialSeconds) {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const start = (secs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(secs);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { seconds, start };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OtpLoginPage() {
  const [step, setStep] = useState("email"); // "email" | "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login: authContextLogin } = useAuth(); // existing context login (sets localStorage)
  const navigate = useNavigate();
  const { toast } = useToast();
  const countdown = useCountdown(60);

  // ── Step 1: Request OTP ────────────────────────────────────────────────────

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    console.log("[OtpLoginPage] Requesting OTP for:", email);

    try {
      const res = await api.post("/auth/otp/request", { email: email.trim() });
      const { userName: name, cooldownSeconds } = res.data;

      setUserName(name || "");
      setStep("otp");
      setOtp("");
      countdown.start(cooldownSeconds || 60);

      toast({
        title: "OTP Sent!",
        description: `A 6-digit code was sent to ${email}.`,
      });
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Failed to send OTP.";
      setError(msg);

      // Handle cooldown error
      if (err.response?.status === 429) {
        const secs = err.response?.data?.cooldownSeconds;
        if (secs) countdown.start(secs);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.replace(/\s/g, "");
    if (cleanOtp.length !== 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setLoading(true);
    console.log("[OtpLoginPage] Verifying OTP for:", email);

    try {
      const res = await api.post("/auth/otp/verify", {
        email: email.trim(),
        otp: cleanOtp,
      });

      const { token, user: userData } = res.data;

      // Use the same AuthContext mechanism as password login
      // Manually set localStorage to match pattern in AuthContext
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Trigger a soft reload of context state (matches existing flow)
      const role = (userData.role || "").toUpperCase();

      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.name}!`,
      });

      console.log("[OtpLoginPage] Login successful, redirecting:", role);
      navigate(ROLE_REDIRECTS[role] || "/login");
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "OTP verification failed.";
      setError(msg);
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (countdown.seconds > 0) return;
    setError("");

    try {
      const res = await api.post("/auth/otp/resend", { email: email.trim() });
      const { cooldownSeconds } = res.data;
      setOtp("");
      countdown.start(cooldownSeconds || 60);
      toast({ title: "OTP Resent", description: "A new OTP has been sent to your email." });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to resend OTP.";
      const secs = err.response?.data?.cooldownSeconds;
      setError(msg);
      if (secs) countdown.start(secs);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen w-full items-center justify-center bg-muted/40 px-4"
      style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e8f4f8 50%, #f0f4ff 100%)" }}
    >
      <Card className="w-full max-w-sm shadow-xl border-0" style={{ backdropFilter: "blur(12px)" }}>
        {/* Header */}
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-3">
            <div
              className="text-white p-3 rounded-xl"
              style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
            >
              {step === "email" ? (
                <Activity className="h-7 w-7" />
              ) : (
                <ShieldCheck className="h-7 w-7" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "email" ? "Swasthya Clinic" : "Verify Your Identity"}
          </CardTitle>
          <CardDescription>
            {step === "email"
              ? "Sign in with a one-time code sent to your email."
              : userName
              ? `Hi ${userName}! Enter the 6-digit code sent to ${email}.`
              : `Enter the 6-digit code sent to ${email}.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Step 1: Email Form ── */}
          {step === "email" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">
                  <Mail className="inline h-4 w-4 mr-1 mb-0.5" />
                  Email Address
                </Label>
                <Input
                  id="otp-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium rounded-md bg-destructive/10 px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>

              {/* Link back to password login */}
              <div className="text-center text-sm mt-2 text-muted-foreground">
                Prefer password?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in with password
                </Link>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP Verification Form ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* 6-box OTP grid */}
              <div className="space-y-2">
                <Label className="block text-center text-sm mb-3">
                  One-Time Password
                </Label>
                <OtpInputGrid
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive font-medium rounded-md bg-destructive/10 px-3 py-2 text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.replace(/\s/g, "").length < 6}
                style={{ background: "linear-gradient(135deg, #1a56db, #0ea5e9)" }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify & Sign In"
                )}
              </Button>

              {/* Resend + Back */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                  }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change email
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown.seconds > 0 || loading}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    countdown.seconds > 0
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-primary hover:underline"
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  {countdown.seconds > 0
                    ? `Resend in ${countdown.seconds}s`
                    : "Resend OTP"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
