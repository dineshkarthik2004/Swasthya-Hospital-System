import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Plus, User, Phone, Mail, Calendar, Activity, ChevronRight } from "lucide-react"
import api from "@/services/api"
import { VoiceMicButton } from "@/components/VoiceMicButton"

export default function CreatePatientVisitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [showPatientList, setShowPatientList] = useState(false)
  const [formData, setFormData] = useState({
    name: location.state?.searchInit && isNaN(location.state.searchInit) ? location.state.searchInit : "",
    phone: location.state?.searchInit && !isNaN(location.state.searchInit) ? location.state.searchInit : "",
    age: "",
    gender: "MALE",
    email: "",
    bloodGroup: "",
    appointmentDate: "",
    appointmentTime: "",
    complaint: "",
    uhid: "",
    abha: "",
    vitals: {
      bloodPressure: "",
      pulse: "",
      temperature: "",
      weight: "",
      height: ""
    },
    doctorId: ""
  })
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [docRes, patRes] = await Promise.all([
          api.get("/api/staff/doctors"),
          api.get("/api/patients")
        ]);
        setDoctors(docRes.data || []);
        if (Array.isArray(patRes.data)) {
           setPatients(patRes.data);
        } else if (patRes.data?.data) {
           setPatients(patRes.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch startup data:", err);
      }
    }
    fetchData();
  }, [])

  useEffect(() => {
    api.get("/api/settings/public")
       .then(res => {
          const settings = res.data || []
          const s = settings.find(item => item.key === "receptionist_voice_enabled")
          setVoiceEnabled(s ? s.value === 'true' : true)
       })
       .catch(() => setVoiceEnabled(true))
  }, [])

  const handleSelectPatient = async (p) => {
    try {
      const res = await api.get(`/api/patients/${p.id}`);
      const full = res.data;
      const lastVisit = full.visits?.[0];
      setFormData(prev => ({
        ...prev,
        name: full.name || "",
        phone: full.phone || "",
        age: full.dateOfBirth ? String(new Date().getFullYear() - new Date(full.dateOfBirth).getFullYear()) : "",
        gender: full.gender || "MALE",
        email: full.email || "",
        bloodGroup: full.bloodGroup || "",
        uhid: full.uhid || "",
        abha: full.abha || "",
        vitals: {
           bloodPressure: lastVisit?.vitals?.bloodPressure || "",
           pulse: lastVisit?.vitals?.pulse || "",
           temperature: lastVisit?.vitals?.temperature || "",
           weight: lastVisit?.vitals?.weight || "",
           height: lastVisit?.vitals?.height || ""
        }
      }));
      setShowPatientList(false);
      toast({ title: "Patient Loaded", description: "Old details auto-filled." });
    } catch(e) {
      console.error(e);
    }
  }

  const filteredPatients = (formData.name || formData.phone) && showPatientList 
     ? patients.filter(p => (formData.name && (p.name||"").toLowerCase().includes(formData.name.toLowerCase())) || (formData.phone && (p.phone||"").includes(formData.phone))).slice(0, 5)
     : [];

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.age) {
       toast({ title: "Validation Error", description: "Name, Phone and Age are required.", variant: "destructive" })
       return
    }

    try {
      setLoading(true)
      await api.post("/api/visits/reception-create", formData)
      toast({ title: "Success", description: "Patient visit created successfully." })
      navigate("/receptionist/patients")
    } catch (err) {
      toast({ title: "Error", description: err.response?.data?.error || "Failed to create visit", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAiExtraction = async (text, type) => {
    try {
      toast({ title: "AI Processing...", description: "Analyzing your voice input..." })
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
            weight: data.weight || prev.vitals.weight,
            height: data.height || prev.vitals.height
          }
        }))
        toast({ title: "Vitals Extracted", description: "Filled clinical data automatically." })
      } else if (type === "diseases_only") {
        setFormData(prev => ({ ...prev, complaint: data.diseases || prev.complaint }))
        toast({ title: "Diseases Extracted", description: "Symptom logs updated." })
      }
    } catch (err) {
      console.error("AI Extraction failed:", err)
      toast({ title: "AI Error", description: "Failed to process voice data", variant: "destructive" })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate("/receptionist/patients")}
        className="gap-2 text-gray-500 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-2xl px-6 h-12 bg-white shadow-sm border border-gray-100"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </Button>

      {/* Header Section */}
      <div className="flex items-center gap-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm shadow-blue-100/20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full translate-x-24 -translate-y-24"></div>
         <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100 relative z-10">
            <Plus className="w-10 h-10" />
         </div>
         <div className="relative z-10">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-none">Create Patient Visit</h1>
            <p className="text-gray-400 text-sm font-medium mt-3 max-w-md opacity-80">Check-in new or existing patients, record vitals, and assign to a doctor in one seamless flow.</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* LEFT COLUMN: Patient Details */}
         <div className="lg:col-span-2 space-y-10">
            <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm p-10 bg-white space-y-10">
               {/* 1. Patient Profile */}
               <section className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black"><User className="w-5 h-5"/></div>
                     <h3 className="text-lg font-black text-gray-900 tracking-tight">Patient Identification</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Full Name *</Label>
                        <Input 
                           value={formData.name}
                           onChange={e => { setFormData({...formData, name: e.target.value}); setShowPatientList(true); }}
                           onFocus={() => setShowPatientList(true)}
                           placeholder="John Doe"
                           required
                           className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm focus:ring-blue-500 shadow-inner"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Phone Number *</Label>
                        <Input 
                           value={formData.phone}
                           onChange={e => { setFormData({...formData, phone: e.target.value}); setShowPatientList(true); }}
                           onFocus={() => setShowPatientList(true)}
                           placeholder="9876543210"
                           required
                           className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm focus:ring-blue-500 shadow-inner"
                        />
                     </div>

                     {filteredPatients.length > 0 && (
                        <div className="absolute top-16 left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                           {filteredPatients.map(p => (
                              <div 
                                 key={p.id} 
                                 onClick={() => handleSelectPatient(p)}
                                 className="p-4 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center"
                              >
                                 <div>
                                    <p className="font-black text-sm text-gray-900">{p.name}</p>
                                    <p className="text-xs font-bold text-gray-400">{p.phone}</p>
                                 </div>
                                 <Badge className="bg-white border-gray-200 text-gray-500 font-bold uppercase text-[9px]">Select Past Record</Badge>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Age *</Label>
                        <Input 
                           value={formData.age}
                           onChange={e => setFormData({...formData, age: e.target.value})}
                           placeholder="25"
                           type="number"
                           required
                           className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Gender *</Label>
                        <Select value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})}>
                           <SelectTrigger className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-none">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2">
                              <SelectItem value="MALE" className="rounded-xl font-bold py-3">Male</SelectItem>
                              <SelectItem value="FEMALE" className="rounded-xl font-bold py-3">Female</SelectItem>
                              <SelectItem value="OTHER" className="rounded-xl font-bold py-3">Other</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Email</Label>
                         <Input 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="Optional"
                            type="email"
                            className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">UHID Number</Label>
                         <Input 
                            value={formData.uhid}
                            onChange={e => setFormData({...formData, uhid: e.target.value})}
                            placeholder="Enter UHID"
                            className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">ABHA ID</Label>
                         <Input 
                            value={formData.abha}
                            onChange={e => setFormData({...formData, abha: e.target.value})}
                            placeholder="Enter ABHA"
                            className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                         />
                      </div>
                   </div>

                  <div className="grid grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Blood Group</Label>
                        <Select value={formData.bloodGroup} onValueChange={v => setFormData({...formData, bloodGroup: v})}>
                           <SelectTrigger className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-none">
                              <SelectValue placeholder="Select" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2">
                              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                                <SelectItem key={bg} value={bg} className="rounded-xl font-bold py-2">{bg}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Appt. Date</Label>
                        <Input 
                           value={formData.appointmentDate}
                           onChange={e => setFormData({...formData, appointmentDate: e.target.value})}
                           type="date"
                           className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Appt. Time</Label>
                        <Input 
                           value={formData.appointmentTime}
                           onChange={e => setFormData({...formData, appointmentTime: e.target.value})}
                           type="time"
                           className="h-14 rounded-2xl border-gray-50 bg-gray-50/50 font-bold text-sm shadow-inner"
                        />
                     </div>
                  </div>
               </section>

               <div className="h-px bg-gray-50"></div>

               {/* 2. Complaint Section */}
               <section className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center font-black"><Activity className="w-5 h-5"/></div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">Diseases / Symptoms</h3>
                     </div>
                     <VoiceMicButton onExtractionSuccess={t => handleAiExtraction(t, "diseases_only")} small voiceEnabled={voiceEnabled} />
                  </div>
                  
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Patient's Problem Description</Label>
                     <textarea 
                        value={formData.complaint}
                        onChange={e => setFormData({...formData, complaint: e.target.value})}
                        placeholder="E.g., Severe stomach pain for 2 days..."
                        className="w-full min-h-[120px] rounded-[1.5rem] border-gray-50 bg-gray-50/50 font-bold text-gray-700 p-6 text-sm focus:ring-1 focus:ring-blue-500 shadow-inner"
                     />
                  </div>
               </section>
            </Card>
         </div>

         {/* RIGHT COLUMN: Vitals & Assignment */}
         <div className="space-y-10">
            <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm p-10 bg-white space-y-10">
               <section className="space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Clinical Vitals</h3>
                     <VoiceMicButton onExtractionSuccess={t => handleAiExtraction(t, "vitals")} small voiceEnabled={voiceEnabled} />
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400 ml-1 opacity-70">Blood Pressure</Label>
                        <Input 
                           value={formData.vitals.bloodPressure}
                           onChange={e => setFormData({...formData, vitals: {...formData.vitals, bloodPressure: e.target.value}})}
                           placeholder="120/80"
                           className="h-12 rounded-2xl border-gray-50 bg-gray-50/50 font-black text-sm"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-gray-400 ml-1 opacity-70">Pulse (BPM)</Label>
                        <Input 
                           value={formData.vitals.pulse}
                           onChange={e => setFormData({...formData, vitals: {...formData.vitals, pulse: e.target.value}})}
                           placeholder="72"
                           className="h-12 rounded-2xl border-gray-50 bg-gray-50/50 font-black text-sm"
                        />
                     </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-gray-400 ml-1 opacity-70">Temp (°F)</Label>
                            <Input 
                               value={formData.vitals.temperature}
                               onChange={e => setFormData({...formData, vitals: {...formData.vitals, temperature: e.target.value}})}
                               placeholder="98.6"
                               className="h-12 rounded-2xl border-gray-50 bg-gray-50/50 font-black text-sm"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-gray-400 ml-1 opacity-70">Weight (KG)</Label>
                            <Input 
                               value={formData.vitals.weight}
                               onChange={e => setFormData({...formData, vitals: {...formData.vitals, weight: e.target.value}})}
                               placeholder="70"
                               className="h-12 rounded-2xl border-gray-50 bg-gray-50/50 font-black text-sm"
                            />
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="space-y-2 w-1/2">
                            <Label className="text-[9px] font-black uppercase text-gray-400 ml-1 opacity-70">Height (cm)</Label>
                            <Input 
                               value={formData.vitals.height}
                               onChange={e => setFormData({...formData, vitals: {...formData.vitals, height: e.target.value}})}
                               placeholder="175"
                               className="h-12 rounded-2xl border-gray-50 bg-gray-50/50 font-black text-sm"
                            />
                         </div>
                      </div>
                     </div>
                </section>

               <div className="h-px bg-gray-50"></div>

               <section className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Assignment</h3>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-blue-400 ml-1">Assign to Doctor</Label>
                     <Select value={formData.doctorId} onValueChange={v => setFormData({...formData, doctorId: v})}>
                        <SelectTrigger className="h-14 rounded-2xl border-blue-100 bg-blue-50/20 text-blue-700 font-bold text-xs focus:ring-0">
                           <SelectValue placeholder="Choose Doctor" className="truncate" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2">
                           {doctors.map(doc => (
                              <SelectItem key={doc.id} value={doc.id} className="rounded-xl font-bold py-3 text-xs focus:bg-blue-50 focus:text-blue-600">
                                 Dr. {doc.name} <span className="text-[10px] font-medium opacity-50 ml-1">({doc.specialization})</span>
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </section>

               <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]"
               >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Confirm Visit Check-in"}
               </Button>
            </Card>
         </div>
      </form>
    </div>
  )
}
