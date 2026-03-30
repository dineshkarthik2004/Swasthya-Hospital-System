import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Mic, MicOff, Plus } from "lucide-react"
import api from "@/services/api"
import { VoiceMicButton } from "@/components/VoiceMicButton"

export default function AddVisitModal({ open, onOpenChange, onSuccess }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "MALE",
    email: "",
    complaint: "",
    vitals: {
      bloodPressure: "",
      pulse: "",
      temperature: "",
      weight: ""
    },
    doctorId: ""
  })

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await api.get("/api/staff/doctors")
        setDoctors(res.data || [])
      } catch (err) {
        console.error("Failed to fetch doctors:", err)
      }
    }
    if (open) fetchDoctors()
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post("/api/visits/reception-create", formData)
      toast({ title: "Success", description: "Visit created successfully" })
      if (onSuccess) onSuccess()
      onOpenChange(false)
      // Reset form
      setFormData({
        name: "", phone: "", age: "", gender: "MALE", email: "",
        complaint: "", vitals: { bloodPressure: "", pulse: "", temperature: "", weight: "" },
        doctorId: ""
      })
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.error || "Failed to create visit", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAiExtraction = async (text, type) => {
    try {
      toast({ title: "AI Processing...", description: "Structuring your voice data..." })
      const res = await api.post("/api/ai/extract", { text, type })
      const data = res.data
      if (type === "vitals") {
        setFormData(prev => ({
          ...prev,
          vitals: {
            ...prev.vitals,
            bloodPressure: data.bp || prev.vitals.bloodPressure,
            pulse: data.pulse || prev.vitals.pulse,
            temperature: data.temperature || prev.vitals.temperature,
            weight: data.weight || prev.vitals.weight
          }
        }))
        toast({ title: "Vitals Extracted", description: "BP, Pulse, Temp, Weight filled automatically." })
      } else if (type === "notes") {
        setFormData(prev => ({ ...prev, complaint: data.notes || prev.complaint }))
        toast({ title: "Complaint Extracted", description: "Symptoms filled automatically." })
      }
    } catch (err) {
      console.error("AI Extraction failed:", err)
      toast({ title: "AI Error", description: "Failed to process voice data", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl rounded-[2rem] overflow-hidden p-0 border-none bg-white z-[200]">
          <DialogHeader className="p-8 bg-blue-600 text-white">
             <DialogTitle className="text-2xl font-black uppercase tracking-tight">Add New Patient Visit</DialogTitle>
             <p className="text-blue-100 text-sm font-medium opacity-80">Check-in a patient and assign them to a doctor.</p>
          </DialogHeader>

          <div className="p-8 pb-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
             {/* Patient Info */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600 ml-1">Primary Information</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Full Name *</Label>
                      <Input 
                        placeholder="John Doe" 
                        required 
                        className="rounded-xl border-gray-100 font-bold h-12 focus:ring-blue-500 shadow-sm" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Phone Number *</Label>
                      <Input 
                        placeholder="9876543210" 
                        required 
                        className="rounded-xl border-gray-100 font-bold h-12 focus:ring-blue-500 shadow-sm"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Age *</Label>
                      <Input 
                        type="number" 
                        placeholder="25" 
                        required 
                        className="rounded-xl border-gray-100 font-bold h-12 focus:ring-blue-500 shadow-sm"
                        value={formData.age}
                        onChange={e => setFormData({...formData, age: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Gender *</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                         <SelectTrigger className="rounded-xl border-gray-100 font-bold h-12 focus:ring-blue-500 shadow-sm bg-white">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-gray-100 shadow-xl bg-white">
                            <SelectItem value="MALE" className="font-bold">Male</SelectItem>
                            <SelectItem value="FEMALE" className="font-bold">Female</SelectItem>
                            <SelectItem value="OTHER" className="font-bold">Other</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 ml-1">Email (Optional)</Label>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="rounded-xl border-gray-100 font-bold h-12 focus:ring-blue-500 shadow-sm"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>
                </div>
             </div>

             {/* Complaint Section */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600 ml-1">Symptoms & Complaint</h4>
                   <VoiceMicButton onExtractionSuccess={t => handleAiExtraction(t, "notes")} small />
                </div>
                <Input 
                  placeholder="Patient describes symptoms here..." 
                  className="rounded-xl border-gray-100 font-bold h-14 bg-gray-50 shadow-inner"
                  value={formData.complaint}
                  onChange={e => setFormData({...formData, complaint: e.target.value})}
                />
             </div>

             {/* Vitals Section */}
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600 ml-1">Vitals (Optional)</h4>
                   <VoiceMicButton onExtractionSuccess={t => handleAiExtraction(t, "vitals")} small />
                </div>
                <div className="grid grid-cols-4 gap-4">
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-400 opacity-70 tracking-tighter uppercase ml-1">BP (mmHg)</Label>
                      <Input 
                        placeholder="120/80" 
                        className="rounded-xl border-gray-100 font-bold text-xs h-10 shadow-sm"
                        value={formData.vitals.bloodPressure}
                        onChange={e => setFormData({...formData, vitals: {...formData.vitals, bloodPressure: e.target.value}})}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-400 opacity-70 tracking-tighter uppercase ml-1">Pulse (bpm)</Label>
                      <Input 
                        placeholder="72" 
                        className="rounded-xl border-gray-100 font-bold text-xs h-10 shadow-sm"
                        value={formData.vitals.pulse}
                        onChange={e => setFormData({...formData, vitals: {...formData.vitals, pulse: e.target.value}})}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-400 opacity-70 tracking-tighter uppercase ml-1">Temp (°F)</Label>
                      <Input 
                        placeholder="98.6" 
                        className="rounded-xl border-gray-100 font-bold text-xs h-10 shadow-sm"
                        value={formData.vitals.temperature}
                        onChange={e => setFormData({...formData, vitals: {...formData.vitals, temperature: e.target.value}})}
                      />
                   </div>
                   <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-400 opacity-70 tracking-tighter uppercase ml-1">Weight (kg)</Label>
                      <Input 
                        placeholder="70" 
                        className="rounded-xl border-gray-100 font-bold text-xs h-10 shadow-sm"
                        value={formData.vitals.weight}
                        onChange={e => setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}})}
                      />
                   </div>
                </div>
             </div>

             {/* Doctor Assignment */}
             <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 border-l-2 border-blue-600 ml-1">Assign Doctor</h4>
                <Select value={formData.doctorId} onValueChange={v => setFormData({...formData, doctorId: v})}>
                   <SelectTrigger className="rounded-2xl border-blue-100 font-black h-16 bg-blue-50/20 text-blue-700 shadow-sm hover:ring-2 hover:ring-blue-100 transition-all">
                      <SelectValue placeholder="Choose Doctor" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2">
                      {doctors.map(doc => (
                         <SelectItem key={doc.id} value={doc.id} className="font-bold py-3 px-4 rounded-xl focus:bg-blue-50 focus:text-blue-600">
                            Dr. {doc.name} - <span className="text-gray-400 font-medium text-xs">{doc.specialization}</span>
                         </SelectItem>
                      ))}
                      {doctors.length === 0 && <SelectItem disabled value="none" className="text-gray-400">No active doctors found</SelectItem>}
                   </SelectContent>
                </Select>
             </div>

             <DialogFooter className="pt-6">
                <Button 
                   onClick={handleSubmit}
                   disabled={loading}
                   className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                   {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Processing Check-in...</> : <><Plus className="w-5 h-5 mr-3" /> Confirm & Create Visit</>}
                </Button>
             </DialogFooter>
          </div>
       </DialogContent>
    </Dialog>
  )
}
