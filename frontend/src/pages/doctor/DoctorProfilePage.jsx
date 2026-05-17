/**
 * DoctorProfilePage.jsx
 * Allows a doctor to:
 *   1. View their current registered email
 *   2. Add/update their email
 *   3. Verify their email via OTP
 * Accessible at /doctor/settings
 */

import { useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Loader2, MailCheck, ShieldCheck, RefreshCw,
  CheckCircle2, Mail, User, AtSign
} from "lucide-react"
import api from "@/services/api"

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown() {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef(null)
  const start = (secs) => {
    if (ref.current) clearInterval(ref.current)
    setSeconds(secs)
    ref.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(ref.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }
  return { seconds, start }
}

export default function DoctorProfilePage() {
  const { user, login: refreshAuth } = useAuth()
  const { toast } = useToast()
  const countdown = useCountdown()

  // Current email (may be a placeholder @noemail.local)
  const currentEmail = user?.email || ""
  const isPlaceholder = currentEmail.endsWith("@noemail.local")

  // ── Email edit state ──────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState(isPlaceholder ? "" : currentEmail)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // ── Verify state ──────────────────────────────────────────────────────────────
  const [verifyStep, setVerifyStep] = useState("idle") // idle | sending | sent | verifying | done
  const [otp, setOtp] = useState("")
  const [verifyError, setVerifyError] = useState("")

  const emailToVerify = newEmail.trim() || currentEmail

  // Save new email first, then send OTP
  const handleSaveAndVerify = async () => {
    setSaveError("")
    setVerifyError("")
    if (!newEmail.trim()) { setSaveError("Please enter an email address."); return }

    setSaving(true)
    try {
      // 1. Save email to DB
      await api.post("/auth/update-email", { email: newEmail.trim() })

      // 2. Send OTP to that email
      setVerifyStep("sending")
      const res = await api.post("/auth/otp/send-verification", {
        email: newEmail.trim(),
        name: user?.name || "Doctor"
      })
      countdown.start(res.data.cooldownSeconds || 60)
      setVerifyStep("sent")
      setOtp("")
      toast({ title: "Email Saved", description: "OTP sent to " + newEmail.trim() })
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save email."
      setSaveError(msg)
      setVerifyStep("idle")
    } finally {
      setSaving(false)
    }
  }

  // Just send OTP (email already saved)
  const handleSendOtp = async () => {
    setVerifyError("")
    setVerifyStep("sending")
    try {
      const res = await api.post("/auth/otp/send-verification", {
        email: emailToVerify,
        name: user?.name || "Doctor"
      })
      countdown.start(res.data.cooldownSeconds || 60)
      setVerifyStep("sent")
      setOtp("")
    } catch (err) {
      setVerifyError(err.response?.data?.error || "Failed to send OTP.")
      setVerifyStep("idle")
    }
  }

  // Verify OTP
  const handleVerify = async () => {
    setVerifyError("")
    setVerifyStep("verifying")
    try {
      await api.post("/auth/otp/check-verification", {
        email: emailToVerify,
        otp: otp.trim()
      })
      setVerifyStep("done")
      toast({ title: "✅ Email Verified!", description: "You can now use OTP login with this email." })
    } catch (err) {
      setVerifyError(err.response?.data?.error || "Incorrect OTP. Please try again.")
      setVerifyStep("sent")
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-black tracking-tight">My Profile & Email</h1>
        <p className="text-black font-black uppercase tracking-widest text-[11px]">
          Manage your account email and verification
        </p>
      </div>

      {/* Account info card */}
      <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-white p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-black text-lg">{user?.name || "—"}</p>
            <p className="text-[11px] font-black uppercase tracking-widest text-black opacity-50">
              {user?.role} · {user?.hospitalName || "Hospital"}
            </p>
          </div>
        </div>

        {/* Current email display */}
        <div className="space-y-1 mb-6">
          <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">
            Current Email
          </Label>
          <div className="h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center px-4 gap-2">
            <AtSign className="w-4 h-4 text-black opacity-30" />
            <span className={`font-black text-sm ${isPlaceholder ? "text-gray-400 italic" : "text-black"}`}>
              {isPlaceholder ? "No email set yet" : currentEmail}
            </span>
          </div>
        </div>

        {/* Email update form */}
        <div className="space-y-3">
          <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">
            {isPlaceholder ? "Add Your Email" : "Update Email"}
          </Label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setSaveError(""); setVerifyStep("idle") }}
              placeholder="your@email.com"
              className="h-12 rounded-2xl bg-gray-50/50 flex-1"
              disabled={verifyStep === "sent" || verifyStep === "verifying" || verifyStep === "done"}
            />
          </div>
          {saveError && <p className="text-xs text-red-500 font-semibold">{saveError}</p>}
        </div>
      </Card>

      {/* Email Verification Card */}
      <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-white p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-50">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <MailCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black tracking-tight">Email Verification</h2>
            <p className="text-[11px] font-black uppercase tracking-widest text-black mt-1">
              Verify your email to enable OTP login
            </p>
          </div>
        </div>

        {verifyStep === "done" ? (
          <div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-black text-emerald-700 text-sm">Email Verified Successfully!</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{emailToVerify}</p>
              <p className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold mt-1">
                You can now log in with OTP using this email.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step: idle — show action button */}
            {verifyStep === "idle" && (
              <div className="space-y-3">
                {/* If email is new (different from current), save+verify together */}
                {newEmail.trim() && newEmail.trim() !== currentEmail ? (
                  <Button
                    onClick={handleSaveAndVerify}
                    disabled={saving}
                    className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving & Sending OTP...</>
                      : <><Mail className="w-4 h-4 mr-2" />Save Email & Send OTP</>
                    }
                  </Button>
                ) : !isPlaceholder ? (
                  /* Email already in DB, just send OTP */
                  <Button
                    onClick={handleSendOtp}
                    disabled={verifyStep === "sending"}
                    className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100"
                  >
                    {verifyStep === "sending"
                      ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending OTP...</>
                      : <><Mail className="w-4 h-4 mr-2" />Send Verification OTP</>
                    }
                  </Button>
                ) : (
                  <p className="text-sm text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                    ⚠️ Enter your email above first, then click <strong>Save Email & Send OTP</strong> to verify it.
                  </p>
                )}
              </div>
            )}

            {/* Sending state */}
            {verifyStep === "sending" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50/60 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-bold text-blue-700">Sending OTP to {emailToVerify}...</span>
              </div>
            )}

            {/* OTP input step */}
            {verifyStep === "sent" && (
              <div className="space-y-4 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                <p className="text-xs text-blue-700 font-semibold">
                  📧 OTP sent to <span className="font-black">{emailToVerify}</span>. Enter the 6-digit code:
                </p>
                <Input
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="h-12 rounded-2xl text-center text-lg font-black tracking-[0.5em] bg-white"
                  maxLength={6}
                  autoFocus
                />
                {verifyError && <p className="text-xs text-red-500 font-semibold">{verifyError}</p>}

                <div className="flex items-center justify-between gap-3">
                  {/* Resend */}
                  <button
                    type="button"
                    disabled={countdown.seconds > 0}
                    onClick={async () => {
                      if (countdown.seconds > 0) return
                      setVerifyError("")
                      try {
                        const res = await api.post("/auth/otp/send-verification", {
                          email: emailToVerify, name: user?.name || "Doctor"
                        })
                        countdown.start(res.data.cooldownSeconds || 60)
                        setOtp("")
                      } catch (err) {
                        setVerifyError(err.response?.data?.error || "Failed to resend OTP")
                      }
                    }}
                    className={`text-xs flex items-center gap-1 font-semibold ${
                      countdown.seconds > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    {countdown.seconds > 0 ? `Resend in ${countdown.seconds}s` : "Resend OTP"}
                  </button>

                  {/* Confirm */}
                  <Button
                    onClick={handleVerify}
                    disabled={otp.length < 6 || verifyStep === "verifying"}
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                  >
                    {verifyStep === "verifying"
                      ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Verifying...</>
                      : <><ShieldCheck className="w-3 h-3 mr-1" />Confirm OTP</>
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
