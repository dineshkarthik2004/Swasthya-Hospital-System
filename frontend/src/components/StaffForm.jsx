import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, ShieldCheck, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import api from "@/services/api";

// ── Countdown helper (same pattern used in OtpLoginPage) ──────────────────────
function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  const start = (secs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(secs);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);
  return { seconds, start };
}

// ── Inline 6-box OTP grid ──────────────────────────────────────────────────────
function OtpGrid({ value, onChange, disabled }) {
  const refs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").trimEnd());
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: "38px",
            height: "44px",
            textAlign: "center",
            fontSize: "18px",
            fontWeight: "800",
            fontFamily: "'Courier New', monospace",
            border: "2px solid",
            borderColor: digits[i].trim() ? "#3b82f6" : "#e5e7eb",
            borderRadius: "10px",
            background: "#f9fafb",
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// StaffForm — main component
// ONLY CHANGE vs original: email verification UI added for Doctor role (new only)
// All existing logic, fields, layout, and submit behaviour unchanged.
// ══════════════════════════════════════════════════════════════════════════════

export default function StaffForm({ initialData = {}, onSubmit, isSubmitting, onCancel, isEdit = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    password: initialData.password || "",
    role: initialData.role || "DOCTOR",
    phone: initialData.phone || "",
    specialization: initialData.specialization || "",
    licenseNumber: initialData.licenseNumber || "",
    qualification: initialData.qualification || "",
    clinicName: initialData.clinicName || "",
    doorNo: initialData.doorNo || "",
    street: initialData.street || "",
    area: initialData.area || "",
    city: initialData.city || "",
    state: initialData.state || "",
    pincode: initialData.pincode || "",
    branchName: initialData.branchName || ""
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [canAddDoctors, setCanAddDoctors] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(!isAdmin);

  // ── Email verification state (Doctor-only, new registration only) ────────────
  const [emailVerified, setEmailVerified] = useState(false);        // final green-tick state
  const [verifyStep, setVerifyStep] = useState("idle");             // "idle" | "sending" | "otp" | "checking"
  const [verifyOtpValue, setVerifyOtpValue] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const countdown = useCountdown();

  // Reset verification whenever email changes
  useEffect(() => {
    setEmailVerified(false);
    setVerifyStep("idle");
    setVerifyOtpValue("");
    setVerifyError("");
  }, [formData.email]);

  // Also reset when role changes away from DOCTOR
  useEffect(() => {
    if (formData.role !== "DOCTOR") {
      setEmailVerified(false);
      setVerifyStep("idle");
      setVerifyOtpValue("");
      setVerifyError("");
    }
  }, [formData.role]);

  // ── Settings fetch (unchanged from original) ─────────────────────────────────
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await api.get("/api/settings/public");
        const settings = res.data || [];
        const s = settings.find(item => item.key === "receptionist_add_doctors");
        const allowed = s ? s.value === 'true' : true;
        setCanAddDoctors(allowed);
        if (!allowed) {
          setFormData(prev => ({ ...prev, role: prev.role === 'DOCTOR' ? 'RECEPTIONIST' : prev.role }));
        }
      } catch (err) {
        console.error("Failed to fetch settings in StaffForm:", err);
        setCanAddDoctors(true);
      } finally {
        setIsSettingsLoading(false);
      }
    };
    if (!isAdmin) {
      console.log("Fetching public settings for receptionist...");
      fetchSetting();
    } else {
      console.log("User is Admin, skipping settings fetch.");
      setIsSettingsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    console.log("StaffForm render state:", { isAdmin, canAddDoctors, role: formData.role });
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    } else if (user?.hospitalId && !isEdit) {
      const addr = user.hospitalAddress || {};
      setFormData(prev => ({
        ...prev,
        clinicName: user.hospitalName || "",
        doorNo: addr.doorNo || "",
        street: addr.street || "",
        area: addr.area || "",
        city: addr.city || "",
        state: addr.state || "",
        pincode: addr.pincode || ""
      }));
    }
  }, [initialData.id, user?.hospitalName, user?.hospitalAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Email verification handlers ───────────────────────────────────────────────

  const handleSendVerification = async () => {
    setVerifyError("");
    const email = formData.email.trim();
    if (!email) { setVerifyError("Please enter an email address first."); return; }

    setVerifyStep("sending");
    try {
      const res = await api.post("/auth/otp/send-verification", {
        email,
        name: formData.name.trim() || "Doctor",
      });
      const { cooldownSeconds } = res.data;
      setVerifyStep("otp");
      setVerifyOtpValue("");
      countdown.start(cooldownSeconds || 60);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send OTP.";
      const secs = err.response?.data?.cooldownSeconds;
      setVerifyError(msg);
      if (secs) countdown.start(secs);
      setVerifyStep("idle");
    }
  };

  const handleResendVerification = async () => {
    if (countdown.seconds > 0) return;
    setVerifyError("");
    setVerifyOtpValue("");
    await handleSendVerification();
  };

  const handleCheckVerification = async () => {
    const cleanOtp = verifyOtpValue.replace(/\s/g, "");
    if (cleanOtp.length < 6) { setVerifyError("Please enter all 6 digits."); return; }

    setVerifyError("");
    setVerifyStep("checking");
    try {
      await api.post("/auth/otp/check-verification", {
        email: formData.email.trim(),
        otp: cleanOtp,
      });
      setEmailVerified(true);
      setVerifyStep("done");
      setVerifyError("");
    } catch (err) {
      const msg = err.response?.data?.error || "Incorrect OTP. Please try again.";
      setVerifyError(msg);
      setVerifyStep("otp");
    }
  };

  // Whether Doctor registration requires email verification (new only)
  const needsEmailVerification = !isEdit && formData.role === "DOCTOR";
  // Block submit if verification needed but not done
  const submitBlocked = needsEmailVerification && !emailVerified;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitBlocked) {
      setVerifyError("Please verify the doctor's email before creating the account.");
      return;
    }
    onSubmit(formData);
  };

  if (isSettingsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Full Name</Label>
          <Input name="name" value={formData.name || ""} onChange={handleChange} required className="h-12 rounded-2xl bg-gray-50/50" />
        </div>

        {/* ── Email field + Verify button ────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">
            Email Address
            {needsEmailVerification && !emailVerified && (
              <span className="ml-2 text-red-500 normal-case font-semibold tracking-normal text-[10px]">* Verification required</span>
            )}
            {emailVerified && (
              <span className="ml-2 text-green-600 normal-case font-semibold tracking-normal text-[10px] inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            )}
          </Label>

          <div className="flex gap-2">
            <Input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              required
              disabled={verifyStep === "otp" || verifyStep === "checking" || emailVerified}
              className={`h-12 rounded-2xl bg-gray-50/50 flex-1 ${emailVerified ? "border-green-400 bg-green-50/40" : ""}`}
            />
            {/* Show Verify Email button only for Doctor new registration */}
            {needsEmailVerification && !emailVerified && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSendVerification}
                disabled={!formData.email.trim() || verifyStep === "sending" || verifyStep === "otp" || verifyStep === "checking"}
                className="h-12 px-4 rounded-2xl border-blue-300 text-blue-600 hover:bg-blue-50 font-bold text-xs whitespace-nowrap shrink-0"
              >
                {verifyStep === "sending" ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Sending…</>
                ) : (
                  <><Mail className="w-3 h-3 mr-1" /> Verify Email</>
                )}
              </Button>
            )}
          </div>

          {/* ── OTP Input (appears after email is sent) ────────────────────── */}
          {needsEmailVerification && verifyStep === "otp" && !emailVerified && (
            <div className="mt-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
              <p className="text-xs text-blue-700 font-semibold">
                📧 OTP sent to <span className="font-black">{formData.email}</span>. Enter below:
              </p>

              <OtpGrid
                value={verifyOtpValue}
                onChange={setVerifyOtpValue}
                disabled={verifyStep === "checking"}
              />

              {verifyError && (
                <p className="text-xs text-red-500 font-semibold">{verifyError}</p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Resend */}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={countdown.seconds > 0}
                  className={`text-xs flex items-center gap-1 font-semibold ${
                    countdown.seconds > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  {countdown.seconds > 0 ? `Resend in ${countdown.seconds}s` : "Resend OTP"}
                </button>

                {/* Confirm button */}
                <Button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={verifyOtpValue.replace(/\s/g, "").length < 6 || verifyStep === "checking"}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                >
                  {verifyStep === "checking" ? (
                    <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Verifying…</>
                  ) : (
                    <><ShieldCheck className="w-3 h-3 mr-1" /> Confirm OTP</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error shown when step is still idle */}
          {verifyStep === "idle" && verifyError && (
            <p className="text-xs text-red-500 font-semibold mt-1">{verifyError}</p>
          )}
        </div>
      </div>

      {/* ── Role + Password row (unchanged) ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Role</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}>
            <SelectTrigger className="h-12 rounded-2xl bg-gray-50/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(isAdmin || canAddDoctors) && (
                <SelectItem value="DOCTOR">Doctor</SelectItem>
              )}
              <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
              <SelectItem value="LAB_TECH">Lab Tech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isEdit && (
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
                required={!isEdit}
                className="h-12 rounded-2xl bg-gray-50/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Doctor & Clinic Information (unchanged) ───────────────────────────── */}
      {formData.role === "DOCTOR" && (
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-black text-black tracking-wider">Doctor & Clinic Information</h3>

          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Specialization</Label>
              <Input name="specialization" value={formData.specialization || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Qualification</Label>
              <Input name="qualification" value={formData.qualification || ""} onChange={handleChange} placeholder="MBBS, MD" className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">License ID</Label>
              <Input name="licenseNumber" value={formData.licenseNumber || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Clinic Name</Label>
              <Input name="clinicName" value={formData.clinicName || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Branch Name</Label>
              <Input name="branchName" value={formData.branchName || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Phone</Label>
              <Input name="phone" value={formData.phone || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Door No</Label>
              <Input name="doorNo" value={formData.doorNo || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Street</Label>
              <Input name="street" value={formData.street || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Area</Label>
              <Input name="area" value={formData.area || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">City</Label>
              <Input name="city" value={formData.city || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">State</Label>
              <Input name="state" value={formData.state || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">Pincode</Label>
              <Input name="pincode" value={formData.pincode || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>
        </div>
      )}

      {/* ── Submit row (unchanged) ────────────────────────────────────────────── */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1 h-12 rounded-[1rem] font-bold" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className={`flex-1 h-12 text-white rounded-[1rem] font-bold shadow-xl ${
            submitBlocked
              ? "bg-gray-300 shadow-gray-100 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
          }`}
          disabled={isSubmitting || submitBlocked}
          title={submitBlocked ? "Verify the doctor's email before creating the account" : ""}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isEdit ? (
            "Save Changes"
          ) : submitBlocked ? (
            "Verify Email to Continue"
          ) : (
            "Create Account"
          )}
        </Button>
      </div>
    </form>
  );
}
