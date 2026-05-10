import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react"
import api from "@/services/api"

export default function ChangePasswordPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")
    
    // Client-side validations
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMsg("New passwords do not match")
      return toast({ 
        title: "Validation Error", 
        description: "New password and confirm password do not match.", 
        variant: "destructive" 
      })
    }

    if (formData.currentPassword === formData.newPassword) {
      setErrorMsg("New password must be different")
      return toast({ 
        title: "No Change", 
        description: "New password must be different from current password.", 
        variant: "destructive" 
      })
    }

    try {
      setLoading(true)
      console.log("[ChangePassword] Sending request to /auth/change-password...");
      
      const response = await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      console.log("[ChangePassword] Response received:", response.data);
      
      setSuccessMsg("Password changed successfully!")
      toast({ 
        title: "Success", 
        description: "Your password has been updated in the database.",
      })
      
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      
      // Navigate back after delay
      setTimeout(() => navigate(-1), 2000)
    } catch (err) {
      console.error("[ChangePassword] Request failed:", err);
      const serverError = err.response?.data?.error || err.message || "Failed to update password.";
      setErrorMsg(serverError)
      
      toast({ 
        title: "Error Updating Password", 
        description: serverError, 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#F8F9FA]">
      <div className="w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100/50">
        <div className="bg-blue-600 p-12 text-white relative">
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase">Security Update</h1>
            <p className="text-blue-100 text-[11px] font-black uppercase tracking-[0.3em] opacity-80">Syncing with hospital database</p>
          </div>
          
          <div className="absolute top-12 right-12 w-20 h-20 bg-white/10 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
             <Lock className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-[13px] font-black uppercase tracking-widest leading-none">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 text-emerald-600 animate-in fade-in slide-in-from-top-4">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="text-[13px] font-black uppercase tracking-widest leading-none">{successMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] ml-2 opacity-60">Current Password</Label>
            <Input 
              type="password"
              required
              className="rounded-[1.5rem] border-2 border-gray-50 bg-gray-50 h-20 font-black text-gray-900 px-10 focus:ring-blue-500 text-xl focus:border-blue-500 transition-all" 
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] ml-2 opacity-60">New Password</Label>
            <Input 
              type="password"
              required
              className="rounded-[1.5rem] border-2 border-gray-50 bg-gray-50 h-20 font-black text-gray-900 px-10 focus:ring-blue-500 text-xl focus:border-blue-500 transition-all" 
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-[0.2em] ml-2 opacity-60">Confirm New Password</Label>
            <Input 
              type="password"
              required
              className="rounded-[1.5rem] border-2 border-gray-50 bg-gray-50 h-20 font-black text-gray-900 px-10 focus:ring-blue-500 text-xl focus:border-blue-500 transition-all" 
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 h-20 rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] shadow-2xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : "Save Password"}
            </Button>
            
            <p className="text-center mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
              Updates take effect immediately in the hospital database.<br/>Your session will be maintained.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
