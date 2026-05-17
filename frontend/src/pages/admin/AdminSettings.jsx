import { useState, useEffect, useRef } from "react"
import { Mic, Users, RefreshCcw, CheckCircle2, XCircle, Loader2, MailCheck, ShieldCheck, RefreshCw, AtSign, Mail } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"

const SETTINGS = [
  {
    key: "doctor_voice_enabled",
    label: "Doctor Voice Input",
    desc: "When ON, doctors can use the voice microphone button on the Consultation page to dictate diagnosis, notes and prescriptions. When OFF, only manual typing is allowed — the mic buttons are hidden completely.",
    icon: Mic,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    enabledText: "Voice + Manual typing available for doctors",
    disabledText: "Manual typing only — mic buttons hidden",
    defaultVal: true
  },
  {
    key: "receptionist_voice_enabled",
    label: "Receptionist Voice Input",
    desc: "When ON, receptionists can use the voice microphone button in the Reception panel to dictate patient vitals and symptoms. When OFF, only manual typing is allowed — the mic buttons are hidden completely.",
    icon: Mic,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    enabledText: "Voice + Manual typing available for receptionists",
    disabledText: "Manual typing only — mic buttons hidden",
    defaultVal: true
  },
  {
    key: "receptionist_add_doctors",
    label: "Receptionist Can Add Doctors",
    desc: "When ON, receptionists can register new Doctor accounts from the Staff Management panel. When OFF, the Doctor option is hidden from the role selector — receptionists can only add Receptionists and Lab Techs.",
    icon: Users,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    enabledText: "Receptionists can add Doctors, Receptionists & Lab Techs",
    disabledText: "Receptionists can only add Receptionists & Lab Techs",
    defaultVal: true
  }
]

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // ── Email state ────────────────────────────────────────────────────────────────
  const isPlaceholderEmail = (user?.email || "").endsWith("@noemail.local")
  const [editEmail, setEditEmail] = useState(isPlaceholderEmail ? "" : (user?.email || ""))
  const [savedEmail, setSavedEmail] = useState(isPlaceholderEmail ? "" : (user?.email || ""))
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")

  // ── Username state ─────────────────────────────────────────────────────────────
  const [editUsername, setEditUsername] = useState(user?.username || "")
  const [savingUsername, setSavingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState("")

  // ── Email verification state ───────────────────────────────────────────────────
  const [verifyStep, setVerifyStep] = useState("idle") // idle | sending | sent | verifying | done
  const [verifyOtp, setVerifyOtp] = useState("")
  const [verifyError, setVerifyError] = useState("")
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef(null)

  const startCountdown = (secs) => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setCountdown(secs)
    countdownRef.current = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; })
    }, 1000)
  }

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/admin/settings")
      setSettings(res.data || [])
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSettings() }, [])

  const getVal = (key, defaultVal) => {
    const s = settings.find(item => item.key === key)
    if (!s) return defaultVal
    return s.value === 'true'
  }

  const updateSetting = async (key, value) => {
    setSavingKey(key)
    try {
      await api.post("/api/admin/settings", { key, value: String(value) })
      setSettings(prev => {
        const existing = prev.find(s => s.key === key)
        if (existing) return prev.map(s => s.key === key ? { ...s, value: String(value) } : s)
        return [...prev, { key, value: String(value) }]
      })
      const s = SETTINGS.find(s => s.key === key)
      toast({ title: value ? "Setting Enabled" : "Setting Disabled", description: `"${s?.label}" has been ${value ? "enabled" : "disabled"} successfully.` })
    } catch (error) {
      toast({ title: "Failed to save", description: "Could not update setting. Try again.", variant: "destructive" })
    } finally {
      setSavingKey(null)
    }
  }

  const handleSaveEmail = async () => {
    setEmailError("")
    if (!editEmail.trim()) { setEmailError("Please enter an email address."); return; }
    setSavingEmail(true)
    try {
      const res = await api.post("/auth/update-email", { email: editEmail.trim() })
      setSavedEmail(res.data.email)
      setVerifyStep("idle")
      setVerifyOtp("")
      toast({ title: "Email Saved", description: "Your email has been updated. You can now use it to log in." })
    } catch (err) {
      setEmailError(err.response?.data?.error || "Failed to save email.")
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSaveUsername = async () => {
    setUsernameError("")
    if (!editUsername.trim()) { setUsernameError("Please enter a username."); return; }
    setSavingUsername(true)
    try {
      await api.post("/auth/update-username", { username: editUsername.trim() })
      toast({ title: "Username Saved", description: `You can now log in with "${editUsername.trim().toLowerCase()}"` })
    } catch (err) {
      setUsernameError(err.response?.data?.error || "Failed to save username.")
    } finally {
      setSavingUsername(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-black tracking-tight">Hospital Settings</h1>
          <p className="text-black font-black uppercase tracking-widest text-[11px]">Control hospital-wide feature access and permissions.</p>
        </div>
        <Button
          onClick={fetchSettings}
          variant="outline"
          disabled={loading}
          className="h-12 px-6 rounded-2xl border-gray-100 font-black uppercase tracking-widest text-[10px] text-black"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-black">Loading Settings...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {SETTINGS.map((setting) => {
            const isEnabled = getVal(setting.key, setting.defaultVal)
            const isSaving = savingKey === setting.key
            const Icon = setting.icon

            return (
              <div key={setting.key} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 flex items-start gap-6">
                  <div className={`w-14 h-14 ${setting.iconBg} ${setting.iconColor} rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 mt-1`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-black text-black tracking-tight">{setting.label}</h3>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-black opacity-20" />}
                        <Switch
                          id={setting.key}
                          checked={isEnabled}
                          disabled={isSaving}
                          onCheckedChange={(val) => updateSetting(setting.key, val)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-black text-black leading-relaxed opacity-60">{setting.desc}</p>
                  </div>
                </div>

                <div className={`px-8 py-5 border-t border-gray-50 flex items-center gap-3 ${isEnabled ? 'bg-emerald-50/50' : 'bg-red-50/30'}`}>
                  {isEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <span className={`text-[11px] font-black uppercase tracking-widest ${isEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isEnabled ? setting.enabledText : setting.disabledText}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── My Account Details Card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <MailCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-black tracking-tight">My Account Details</h3>
            <p className="text-[11px] font-black uppercase tracking-widest text-black opacity-50 mt-0.5">Update your login email, username &amp; verify email</p>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* ── Username ── */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-black flex items-center gap-1.5">
              <AtSign className="w-3 h-3" /> Username
              <span className="normal-case font-medium tracking-normal text-[10px] text-gray-400">(for login)</span>
            </Label>
            <div className="flex gap-3">
              <Input
                value={editUsername}
                onChange={e => { setEditUsername(e.target.value); setUsernameError("") }}
                placeholder="e.g. admin@jotham"
                className="h-12 rounded-2xl bg-gray-50/50 flex-1 font-black"
              />
              <Button
                onClick={handleSaveUsername}
                disabled={savingUsername || !editUsername.trim() || editUsername.trim().toLowerCase() === (user?.username || "")}
                className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shrink-0"
              >
                {savingUsername ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving...</> : "Save Username"}
              </Button>
            </div>
            {usernameError && <p className="text-xs text-red-500 font-semibold">{usernameError}</p>}
            {user?.username && (
              <p className="text-[10px] text-black font-bold opacity-40">
                Current username: <span className="opacity-100 font-black">{user.username}</span>
              </p>
            )}
          </div>

          {/* ── Email ── */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-black tracking-widest text-black flex items-center gap-1.5">
              <Mail className="w-3 h-3" /> Email Address
              {isPlaceholderEmail && (
                <span className="ml-1 text-amber-500 normal-case font-semibold tracking-normal text-[10px]">— not set yet</span>
              )}
            </Label>
            <div className="flex gap-3">
              <Input
                type="email"
                value={editEmail}
                onChange={e => { setEditEmail(e.target.value); setEmailError(""); setVerifyStep("idle") }}
                placeholder="admin@yourhospital.com"
                disabled={verifyStep === "sent" || verifyStep === "verifying"}
                className="h-12 rounded-2xl bg-gray-50/50 flex-1 font-black"
              />
              <Button
                onClick={handleSaveEmail}
                disabled={savingEmail || !editEmail.trim() || editEmail.trim().toLowerCase() === savedEmail}
                className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shrink-0"
              >
                {savingEmail ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving...</> : "Save Email"}
              </Button>
            </div>
            {emailError && <p className="text-xs text-red-500 font-semibold">{emailError}</p>}
          </div>

          {/* ── Email Verification ── */}
          <div className="border-t border-gray-50 pt-6 space-y-4">
            <p className="text-[10px] uppercase font-black tracking-widest text-black opacity-50">Email Verification</p>
            <p className="text-sm text-black font-black leading-relaxed opacity-60">
              {savedEmail
                ? <>Verifying <span className="opacity-100 font-black">{savedEmail}</span> allows OTP login and ensures email-based features work correctly.</>
                : "Save an email address above before you can verify it."}
            </p>

            {verifyStep === "done" ? (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 w-fit">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Email Verified Successfully</span>
              </div>
            ) : (
              <div className="space-y-3">
                {verifyStep === "idle" && (
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!savedEmail) return
                      setVerifyError("")
                      setVerifyStep("sending")
                      try {
                        const res = await api.post("/auth/otp/send-verification", { email: savedEmail, name: user?.name || "Admin" })
                        startCountdown(res.data.cooldownSeconds || 60)
                        setVerifyStep("sent")
                      } catch (err) {
                        setVerifyError(err.response?.data?.error || "Failed to send OTP")
                        setVerifyStep("idle")
                      }
                    }}
                    disabled={!savedEmail || verifyStep === "sending"}
                    className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100"
                  >
                    {verifyStep === "sending" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending OTP...</> : "Send Verification OTP"}
                  </Button>
                )}

                {verifyStep === "sent" && (
                  <div className="space-y-3 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                    <p className="text-xs text-blue-700 font-semibold">📧 OTP sent to <span className="font-black">{savedEmail}</span>. Enter the 6-digit code:</p>
                    <Input
                      value={verifyOtp}
                      onChange={e => setVerifyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="h-12 rounded-2xl text-center text-lg font-black tracking-[0.5em] bg-white max-w-xs"
                      maxLength={6}
                      autoFocus
                    />
                    {verifyError && <p className="text-xs text-red-500 font-semibold">{verifyError}</p>}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        disabled={countdown > 0}
                        onClick={async () => {
                          if (countdown > 0) return
                          setVerifyError("")
                          try {
                            const res = await api.post("/auth/otp/send-verification", { email: savedEmail, name: user?.name || "Admin" })
                            startCountdown(res.data.cooldownSeconds || 60)
                            setVerifyOtp("")
                          } catch (err) {
                            setVerifyError(err.response?.data?.error || "Failed to resend")
                          }
                        }}
                        className={`text-xs flex items-center gap-1 font-semibold ${countdown > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                      </button>
                      <Button
                        type="button"
                        disabled={verifyOtp.length < 6 || verifyStep === "verifying"}
                        onClick={async () => {
                          setVerifyError("")
                          setVerifyStep("verifying")
                          try {
                            await api.post("/auth/otp/check-verification", { email: savedEmail, otp: verifyOtp })
                            setVerifyStep("done")
                            toast({ title: "Email Verified!", description: "Your email has been verified successfully." })
                          } catch (err) {
                            setVerifyError(err.response?.data?.error || "Incorrect OTP")
                            setVerifyStep("sent")
                          }
                        }}
                        className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                      >
                        {verifyStep === "verifying" ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Verifying...</> : <><ShieldCheck className="w-3 h-3 mr-1" />Confirm OTP</>}
                      </Button>
                    </div>
                  </div>
                )}
                {verifyError && verifyStep === "idle" && <p className="text-xs text-red-500 font-semibold">{verifyError}</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
