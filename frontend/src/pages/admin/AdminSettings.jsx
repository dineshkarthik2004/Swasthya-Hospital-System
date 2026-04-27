import { useState, useEffect } from "react"
import { Settings2, Brain, Mic, Shield, Save, RefreshCcw, Power } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/admin/settings")
      setSettings(res.data)
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateSetting = async (key, value) => {
    try {
      setSaving(true)
      await api.post("/api/admin/settings", { key, value: String(value) })
      fetchSettings()
    } catch (error) {
      console.error("Error updating setting:", error)
    } finally {
      setSaving(false)
    }
  }

  const getVal = (key, defaultVal) => {
    const s = settings.find(item => item.key === key)
    return s ? s.value === 'true' : defaultVal
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-gray-500 font-medium">Global parameters for AI models, infrastructure and security.</p>
        </div>
        <Button onClick={fetchSettings} variant="outline" className="h-14 px-6 rounded-2xl border-gray-100 font-black uppercase tracking-widest text-[10px] text-gray-500">
           <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Configuration
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                 <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Intelligence Models</h3>
           </div>
           
           <div className="space-y-6">
              {[
                { key: "ml_diagnosis_enabled", label: "ML Diagnosis Support", desc: "Enable automated diagnosis suggestions for doctors." },
                { key: "auto_prescription_extraction", label: "Auto Prescription Extraction", desc: "Extract medicine details from consultation notes automatically." },
                { key: "voice_to_text_active", label: "Voice Processing System", desc: "Enable real-time voice-to-text for clinical documentation." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                   <div className="flex flex-col max-w-[70%]">
                      <span className="text-sm font-black text-gray-900 tracking-tight">{item.label}</span>
                      <span className="text-[11px] font-bold text-gray-400 mt-1">{item.desc}</span>
                   </div>
                   <Switch 
                      checked={getVal(item.key, false)} 
                      onCheckedChange={(val) => updateSetting(item.key, val)}
                   />
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                 <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Voice Engine Defaults</h3>
           </div>

           <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-4 block">Active Voice Model</label>
                 <div className="grid grid-cols-2 gap-3">
                    {['Whisper-v3', 'Groq-Distil', 'Assembly-AI', 'Custom-ML'].map((model) => (
                       <div key={model} className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all">
                          <span className="text-xs font-black text-gray-700 tracking-tight">{model}</span>
                          <div className={`w-2 h-2 rounded-full ${model === 'Groq-Distil' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-200'}`}></div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 tracking-tight">Multi-language Transcription</span>
                      <span className="text-[11px] font-bold text-gray-400 mt-1">Enable auto-detection of regional languages.</span>
                   </div>
                   <Switch 
                      checked={getVal("multi_lang_voice", true)} 
                      onCheckedChange={(val) => updateSetting("multi_lang_voice", val)}
                   />
                </div>
           </div>
        </div>
      </div>
    </div>
  )
}
