import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, UserCog, Mic, Stethoscope, ClipboardList, FileText, CheckSquare, MailCheck, ShieldCheck, RefreshCw, CheckCircle2 } from "lucide-react"
import api from "@/services/api"

export default function DoctorSettings() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctorName, setDoctorName] = useState("Doctor")
  const [doctorEmail, setDoctorEmail] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSaveError, setEmailSaveError] = useState("")
  const isPlaceholderEmail = doctorEmail.endsWith("@noemail.local")

  // Email verification state
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
  
  const [settings, setSettings] = useState({
    voice_enabled: true,
    field_clinical_diagnosis: true,
    field_investigation: true,
    field_clinical_notes: true,
    field_advice: true
  })

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        setLoading(true)
        // Fetch doctors list to get this doctor's name
        const docsRes = await api.get("/api/admin/doctors")
        const doc = docsRes.data.find(d => d.id === doctorId)
        if (doc) {
          setDoctorName(doc.name)
          const email = doc.email || ""
          setDoctorEmail(email)
          setEditEmail(email.endsWith("@noemail.local") ? "" : email)
        }

        // Fetch settings
        const settingsRes = await api.get("/api/admin/settings")
        const allSettings = settingsRes.data
        
        // Map settings for this doctor
        const currentSettings = {
          voice_enabled: true, // Default
          field_clinical_diagnosis: true,
          field_investigation: true,
          field_clinical_notes: true,
          field_advice: true
        }

        allSettings.forEach(s => {
          if (s.key === `doc_${doctorId}_voice_enabled`) currentSettings.voice_enabled = s.value === 'true'
          if (s.key === `doc_${doctorId}_field_clinical_diagnosis`) currentSettings.field_clinical_diagnosis = s.value === 'true'
          if (s.key === `doc_${doctorId}_field_investigation`) currentSettings.field_investigation = s.value === 'true'
          if (s.key === `doc_${doctorId}_field_clinical_notes`) currentSettings.field_clinical_notes = s.value === 'true'
          if (s.key === `doc_${doctorId}_field_advice`) currentSettings.field_advice = s.value === 'true'
        })
        
        setSettings(currentSettings)
      } catch (error) {
        console.error("Error fetching doctor settings:", error)
        toast({ title: "Error", description: "Failed to load settings", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    
    if (doctorId) {
      fetchDoctorData()
    }
  }, [doctorId, toast])

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Save all settings to API sequentially
      const settingsToSave = [
        { key: `doc_${doctorId}_voice_enabled`, value: String(settings.voice_enabled) },
        { key: `doc_${doctorId}_field_clinical_diagnosis`, value: String(settings.field_clinical_diagnosis) },
        { key: `doc_${doctorId}_field_investigation`, value: String(settings.field_investigation) },
        { key: `doc_${doctorId}_field_clinical_notes`, value: String(settings.field_clinical_notes) },
        { key: `doc_${doctorId}_field_advice`, value: String(settings.field_advice) }
      ]

      for (const setting of settingsToSave) {
        await api.post("/api/admin/settings", setting)
      }

      toast({ title: "Settings Saved", description: `${doctorName}'s configuration updated.` })
      navigate("/admin/doctors")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate("/admin/doctors")}
          className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight text-black">{doctorName}'s Settings</h1>
          <p className="text-black font-black uppercase tracking-widest text-[11px]">Individual practitioner configuration</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* ── Email Management Card ─────────────────────────────────────────── */}
        <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-white p-10">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
              <MailCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">Email Management</h2>
              <p className="text-[11px] font-black uppercase tracking-widest text-black mt-1">Update &amp; verify {doctorName}'s email address</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* ── Editable email field ── */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black tracking-widest text-black ml-1">
                Email Address
                {isPlaceholderEmail && (
                  <span className="ml-2 text-amber-500 normal-case font-semibold tracking-normal text-[10px]">— not set yet</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={editEmail}
                  onChange={e => { setEditEmail(e.target.value); setEmailSaveError(""); }}
                  placeholder="doctor@example.com"
                  disabled={verifyStep === "sent" || verifyStep === "verifying"}
                  className="h-12 rounded-2xl bg-gray-50/50 flex-1"
                />
                <Button
                  type="button"
                  onClick={async () => {
                    if (!editEmail.trim()) { setEmailSaveError("Please enter an email address."); return; }
                    setSavingEmail(true)
                    setEmailSaveError("")
                    try {
                      await api.put(`/api/staff/${doctorId}`, { email: editEmail.trim().toLowerCase() })
                      setDoctorEmail(editEmail.trim().toLowerCase())
                      setVerifyStep("idle")
                      setVerifyOtp("")
                      toast({ title: "Email Updated", description: `${doctorName}'s email has been saved.` })
                    } catch (err) {
                      setEmailSaveError(err.response?.data?.error || "Failed to save email.")
                    } finally {
                      setSavingEmail(false)
                    }
                  }}
                  disabled={savingEmail || !editEmail.trim() || editEmail.trim().toLowerCase() === (isPlaceholderEmail ? "" : doctorEmail)}
                  className="h-12 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shrink-0"
                >
                  {savingEmail ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving...</> : "Save Email"}
                </Button>
              </div>
              {emailSaveError && <p className="text-xs text-red-500 font-semibold">{emailSaveError}</p>}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[10px] uppercase font-black tracking-widest text-black opacity-50 mb-4">Email Verification</p>

              {verifyStep === "done" ? (
                <div className="flex items-center gap-3 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-black text-emerald-700 text-sm">Email Verified Successfully</p>
                    <p className="text-[11px] text-emerald-600 uppercase tracking-widest font-bold mt-0.5">{doctorEmail}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifyStep === "idle" && (
                    <Button
                      type="button"
                      onClick={async () => {
                        const emailToUse = doctorEmail && !isPlaceholderEmail ? doctorEmail : ""
                        if (!emailToUse) { setEmailSaveError("Save an email address first before verifying."); return; }
                        setVerifyError("")
                        setVerifyStep("sending")
                        try {
                          const res = await api.post("/auth/otp/send-verification", { email: emailToUse, name: doctorName })
                          startCountdown(res.data.cooldownSeconds || 60)
                          setVerifyStep("sent")
                        } catch (err) {
                          setVerifyError(err.response?.data?.error || "Failed to send OTP")
                          setVerifyStep("idle")
                        }
                      }}
                      disabled={!doctorEmail || isPlaceholderEmail || verifyStep === "sending"}
                      className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100"
                    >
                      {verifyStep === "sending" ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending OTP...</> : "Send Verification OTP"}
                    </Button>
                  )}

                  {verifyStep === "sent" && (
                    <div className="space-y-3 p-5 bg-blue-50/60 border border-blue-100 rounded-2xl">
                      <p className="text-xs text-blue-700 font-semibold">📧 OTP sent to <span className="font-black">{doctorEmail}</span>. Enter the 6-digit code below:</p>
                      <Input
                        value={verifyOtp}
                        onChange={e => setVerifyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="h-12 rounded-2xl text-center text-lg font-black tracking-[0.5em] bg-white"
                        maxLength={6}
                      />
                      {verifyError && <p className="text-xs text-red-500 font-semibold">{verifyError}</p>}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={countdown > 0}
                          onClick={async () => {
                            if (countdown > 0) return
                            setVerifyError("")
                            try {
                              const res = await api.post("/auth/otp/send-verification", { email: doctorEmail, name: doctorName })
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
                              await api.post("/auth/otp/check-verification", { email: doctorEmail, otp: verifyOtp })
                              setVerifyStep("done")
                              toast({ title: "Email Verified", description: `${doctorName}'s email has been verified successfully.` })
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
        </Card>

        {/* ── Voice Recognition Card ─────────────────────────────────────────── */}
        <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-white p-10">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                <Mic className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-black text-black tracking-tight">Voice Recognition</h2>
               <p className="text-[11px] font-black uppercase tracking-widest text-black mt-1">Enable or disable AI voice input</p>
             </div>
          </div>
          
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="flex flex-col">
                <span className="font-black text-black text-sm">Doctor Voice Input</span>
                <span className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">Allows {doctorName} to use microphone for dictation</span>
             </div>
             <Switch 
                checked={settings.voice_enabled}
                onCheckedChange={() => handleToggle('voice_enabled')}
                className="data-[state=checked]:bg-blue-600"
             />
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm bg-white p-10">
          <div className="flex items-center gap-4 mb-8 border-b border-gray-50 pb-6">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                <ClipboardList className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-xl font-black text-black tracking-tight">Consultation Fields</h2>
               <p className="text-[11px] font-black uppercase tracking-widest text-black mt-1">Customize the layout for {doctorName}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Clinical Diagnosis */}
             <div 
               className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${settings.field_clinical_diagnosis ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
               onClick={() => handleToggle('field_clinical_diagnosis')}
             >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${settings.field_clinical_diagnosis ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                   {settings.field_clinical_diagnosis && <CheckSquare className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-black text-sm">Clinical Diagnosis</span>
                   <span className="text-[9px] font-bold text-black uppercase tracking-widest mt-0.5">Primary diagnosis field</span>
                </div>
             </div>

             {/* Investigation */}
             <div 
               className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${settings.field_investigation ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
               onClick={() => handleToggle('field_investigation')}
             >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${settings.field_investigation ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                   {settings.field_investigation && <CheckSquare className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-black text-sm">Investigation</span>
                   <span className="text-[9px] font-bold text-black uppercase tracking-widest mt-0.5">Lab tests & remarks</span>
                </div>
             </div>

             {/* Clinical Notes */}
             <div 
               className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${settings.field_clinical_notes ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
               onClick={() => handleToggle('field_clinical_notes')}
             >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${settings.field_clinical_notes ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                   {settings.field_clinical_notes && <CheckSquare className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-black text-sm">Clinical Notes</span>
                   <span className="text-[9px] font-bold text-black uppercase tracking-widest mt-0.5">Internal doctor notes</span>
                </div>
             </div>

             {/* Advice/Instructions */}
             <div 
               className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${settings.field_advice ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
               onClick={() => handleToggle('field_advice')}
             >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${settings.field_advice ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                   {settings.field_advice && <CheckSquare className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                   <span className="font-black text-black text-sm">Advice & Instructions</span>
                   <span className="text-[9px] font-bold text-black uppercase tracking-widest mt-0.5">General patient guidance</span>
                </div>
             </div>
          </div>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-100 text-white"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Doctor Settings"}
          </Button>
        </div>
      </div>
    </div>
  )
}
