import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Eye, EyeOff, UserPlus } from "lucide-react"
import api from "@/services/api"

export default function StaffRegistrationPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    phone: "",
    specialization: "",
    licenseNumber: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.name || !formData.password || !formData.role) {
       toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" })
       return
    }

    try {
      setLoading(true)
      await api.post("/api/staff/create", formData)
      toast({ title: "Account Created", description: `Staff record for ${formData.name} is now active.` })
      navigate("/receptionist/staff")
    } catch (err) {
      toast({ title: "Registration Failed", description: err.response?.data?.error || "Error creating account", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate("/receptionist/staff")}
        className="gap-2 text-gray-500 hover:text-gray-900 font-black text-[10px] uppercase tracking-widest rounded-2xl px-6 h-12 bg-white shadow-sm border border-gray-100"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Staff Management
      </Button>

      <Card className="rounded-[2.5rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white">
         <div className="p-10 border-b border-gray-50 flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Staff Registration</h1>
               <p className="text-gray-400 text-sm font-medium mt-3 opacity-80">Verify email before profile creation.</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
               <UserPlus className="w-8 h-8" />
            </div>
         </div>

         <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {/* Email Section */}
            <div className="space-y-4">
               <div className="flex justify-between items-center px-1">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Email Address</Label>
                  <button type="button" className="text-[10px] font-black uppercase text-blue-600 hover:underline">Edit</button>
               </div>
               <Input 
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="karthik@hospital.com"
                  required
                  className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm focus:ring-blue-500"
               />
               <div className="bg-orange-50/50 border border-orange-100/50 p-4 rounded-2xl flex items-center gap-4 text-orange-600">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                     <UserPlus className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold">New profile will be created for this email.</p>
               </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</Label>
                  <Input 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     placeholder="Dr. John Doe"
                     required
                     className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm"
                  />
               </div>

               <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Password</Label>
                  <div className="relative">
                     <Input 
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••••••"
                        required
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm pr-12"
                     />
                     <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
                     >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                  </div>
               </div>
            </div>

            {/* Role & Phone */}
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Role</Label>
                  <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                     <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl border-gray-100 shadow-2xl bg-white p-2">
                        <SelectItem value="DOCTOR" className="rounded-xl font-bold py-3">Doctor</SelectItem>
                        <SelectItem value="RECEPTIONIST" className="rounded-xl font-bold py-3">Receptionist</SelectItem>
                        <SelectItem value="LAB_TECH" className="rounded-xl font-bold py-3">Lab Tech</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone</Label>
                  <Input 
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                     placeholder="9876543210"
                     className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm"
                  />
               </div>
            </div>

            {/* Conditional Fields for Doctor */}
            {formData.role === 'DOCTOR' && (
               <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-2">
                     <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Specialization</Label>
                     <Input 
                        value={formData.specialization}
                        onChange={e => setFormData({...formData, specialization: e.target.value})}
                        placeholder="Surgery"
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm"
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">License ID</Label>
                     <Input 
                        value={formData.licenseNumber}
                        onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                        placeholder="MED-123"
                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/30 font-bold text-sm"
                     />
                  </div>
               </div>
            )}

            <Button 
               type="submit" 
               disabled={loading}
               className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
         </form>
      </Card>
    </div>
  )
}
