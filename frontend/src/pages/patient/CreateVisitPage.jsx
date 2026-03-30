import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Mic, Plus, User } from "lucide-react"
import api from "@/services/api"
import { VoiceMicButton } from "@/components/VoiceMicButton"

export default function CreateVisitPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    relation: "SELF",
    patientName: "",
    age: "",
    gender: "MALE",
    mobile: "",
    notes: ""
  })

  useEffect(() => {
    if (user && form.relation === "SELF") {
      console.log("[CreateVisitPage] Auto-filling for SELF booking")
      setForm(prev => ({
        ...prev,
        patientName: user.name || "",
        age: user.age || "",
        gender: (user.gender || "MALE").toUpperCase(),
        mobile: user.phone || ""
      }))
    } else {
       // Clear form for family members so user can enter fresh details
       console.log("[CreateVisitPage] Clearing form for relative booking")
       setForm(prev => ({
          ...prev,
          patientName: "",
          age: "",
          gender: "MALE",
          mobile: ""
       }))
    }
  }, [user, form.relation])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const applyExtractedData = (data, type) => {
    if (type === "symptoms") {
      setForm(prev => ({
        ...prev,
        notes: data.symptoms?.join(", ") || prev.notes
      }));
    }
  };

  const handleVoiceResult = async (text, type) => {
    try {
      const res = await api.post("/api/ai/extract", { text, type });
      const data = res.data?.data || res.data;
      console.log("AI RESPONSE:", data);
      applyExtractedData(data, type);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("[CreateVisitPage] Submitting visit:", form)

    if (!form.notes.trim()) {
      toast({ title: "Missing Info", description: "Please describe your symptoms or problem.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const res = await api.post("/api/visits", {
        relation: form.relation,
        patientName: form.patientName,
        age: form.age,
        phone: form.mobile,
        gender: form.gender,
        notes: form.notes
      })
      console.log("[CreateVisitPage] Visit created successfully:", res.data?.id)
      toast({ title: "Visit Booked!", description: "Your appointment is now in the queue. Status: WAITING" })
      navigate("/patient/records")
    } catch (err) {
      console.error("[CreateVisitPage] Error creating visit:", err)
      toast({
        title: "Booking Failed",
        description: err.response?.data?.error || "Could not create visit. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          console.log("[CreateVisitPage] Back button clicked")
          navigate("/patient/records")
        }}
        className="gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm rounded-2xl px-6 h-12"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Button>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Plus className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Book New Visit</h1>
        <p className="text-gray-400 text-sm font-medium">Fill in your details and describe your symptoms to schedule an appointment.</p>
      </div>

      {/* Form Card */}
      <Card className="rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden bg-white">
        <form onSubmit={handleSubmit} className="p-10 space-y-8">

          {/* Patient Info Section */}
          <div className="space-y-2 mb-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Patient Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Relation / Booking For</Label>
               <Select value={form.relation} onValueChange={v => handleChange("relation", v)}>
                 <SelectTrigger className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800 shadow-none">
                   <SelectValue placeholder="Booking for..." />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2 z-[500]">
                   <SelectItem value="SELF">Self (Account Owner)</SelectItem>
                   <SelectItem value="FATHER">Father</SelectItem>
                   <SelectItem value="MOTHER">Mother</SelectItem>
                   <SelectItem value="SON">Son</SelectItem>
                   <SelectItem value="DAUGHTER">Daughter</SelectItem>
                   <SelectItem value="HUSBAND">Husband</SelectItem>
                   <SelectItem value="WIFE">Wife</SelectItem>
                   <SelectItem value="BROTHER">Brother</SelectItem>
                   <SelectItem value="SISTER">Sister</SelectItem>
                   <SelectItem value="OTHER">Other</SelectItem>
                 </SelectContent>
               </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <Input
                  className="pl-12 rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800 text-sm"
                  value={form.patientName}
                  onChange={e => handleChange("patientName", e.target.value)}
                  placeholder="E.g., Dr. John Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Age</Label>
              <Input
                className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800 text-sm"
                value={form.age}
                onChange={e => handleChange("age", e.target.value)}
                placeholder="25"
                type="number"
                min="0"
                max="150"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mobile Number</Label>
              <Input
                className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800 text-sm"
                value={form.mobile}
                onChange={e => handleChange("mobile", e.target.value)}
                placeholder="9876543210"
                type="tel"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Gender</Label>
              <Select value={form.gender} onValueChange={v => handleChange("gender", v)}>
                 <SelectTrigger className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800 shadow-none">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-gray-100 bg-white z-[500] shadow-2xl p-2">
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                 </SelectContent>
              </Select>
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="space-y-2 pt-4 border-t border-gray-50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Symptoms / Problem</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Describe your problem</Label>
              <div className="bg-blue-50 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Voice Input</span>
                <VoiceMicButton
                  onExtractionSuccess={(text) => handleVoiceResult(text, "symptoms")}
                  endpoint="/api/voice/extract"
                  buttonText="Speak"
                />
              </div>
            </div>
            <div className="relative">
              <Textarea
                className="rounded-[1.5rem] bg-gray-50/50 border-gray-100 min-h-[160px] font-bold text-gray-700 p-6 text-sm focus-visible:ring-1 focus-visible:bg-white transition-all shadow-inner leading-relaxed"
                value={form.notes}
                onChange={e => handleChange("notes", e.target.value)}
                placeholder="E.g., I have a headache and mild fever since 2 days. Also experiencing body pain..."
                required
              />
              <div className="absolute bottom-4 right-4 text-gray-300">
                <Mic className="w-5 h-5 opacity-20" />
              </div>
            </div>
          </div>

          {/* Submit Area */}
          <div className="pt-4 space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Visit Booking"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-300"
              onClick={() => navigate("/patient/records")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
