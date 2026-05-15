import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, UserCog, Mic, Stethoscope, ClipboardList, FileText, CheckSquare } from "lucide-react"
import api from "@/services/api"

export default function DoctorSettings() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctorName, setDoctorName] = useState("Doctor")
  
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
        if (doc) setDoctorName(doc.name)

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
