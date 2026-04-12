import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, UserPlus } from "lucide-react"
import api from "@/services/api"
import StaffForm from "@/components/StaffForm"

export default function StaffRegistrationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const editData = location.state?.editData || null
  const isEdit = !!editData

  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR",
    phone: "",
    specialization: "",
    licenseNumber: ""
  })

  const handleSubmit = async (formData) => {
    try {
      setLoading(true)
      if (isEdit) {
        await api.put(`/api/staff/${editData.id}`, formData)
        toast({ title: "Profile Updated", description: "The staff records have been successfully updated." })
      } else {
        await api.post("/api/staff/create", formData)
        toast({ title: "Account Created", description: `Staff record for ${formData.name} is now active.` })
      }
      navigate("/receptionist/staff")
    } catch (err) {
      toast({ title: isEdit ? "Update Failed" : "Registration Failed", description: err.response?.data?.error || "Error processing request", variant: "destructive" })
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
               <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">{isEdit ? "Edit Staff Profile" : "Staff Registration"}</h1>
               <p className="text-gray-400 text-sm font-medium mt-3 opacity-80">{isEdit ? "Update existing team member details." : "Verify email before profile creation."}</p>
            </div>
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
               <UserPlus className="w-8 h-8" />
            </div>
         </div>

         <div className="p-10">
            <StaffForm initialData={editData || {}} onSubmit={handleSubmit} isSubmitting={loading} isEdit={isEdit} />
         </div>
      </Card>
    </div>
  )
}
