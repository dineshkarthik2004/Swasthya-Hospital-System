import { useState, useEffect } from "react"
import { Mic, Users, RefreshCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

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
      // Optimistically update local state immediately
      setSettings(prev => {
        const existing = prev.find(s => s.key === key)
        if (existing) {
          return prev.map(s => s.key === key ? { ...s, value: String(value) } : s)
        }
        return [...prev, { key, value: String(value) }]
      })
      const s = SETTINGS.find(s => s.key === key)
      toast({
        title: value ? "Setting Enabled" : "Setting Disabled",
        description: `"${s?.label}" has been ${value ? "enabled" : "disabled"} successfully.`
      })
    } catch (error) {
      console.error("Error updating setting:", error)
      toast({ title: "Failed to save", description: "Could not update setting. Try again.", variant: "destructive" })
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hospital Settings</h1>
          <p className="text-gray-500 font-medium">Control hospital-wide feature access and permissions.</p>
        </div>
        <Button
          onClick={fetchSettings}
          variant="outline"
          disabled={loading}
          className="h-12 px-6 rounded-2xl border-gray-100 font-black uppercase tracking-widest text-[10px] text-gray-500"
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Settings...</p>
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
                      <h3 className="text-lg font-black text-gray-900 tracking-tight">{setting.label}</h3>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        <Switch
                          id={setting.key}
                          checked={isEnabled}
                          disabled={isSaving}
                          onCheckedChange={(val) => updateSetting(setting.key, val)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed">{setting.desc}</p>
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
    </div>
  )
}
