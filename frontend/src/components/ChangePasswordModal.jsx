import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock } from "lucide-react"
import api from "@/services/api"

export default function ChangePasswordModal({ open, onOpenChange }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      return toast({ 
        title: "Password Mismatch", 
        description: "New password and confirm password do not match.", 
        variant: "destructive" 
      })
    }

    if (formData.currentPassword === formData.newPassword) {
      return toast({ 
        title: "No Change Detected", 
        description: "New password must be different from the current one.", 
        variant: "destructive" 
      })
    }

    try {
      setLoading(true)
      await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      toast({ title: "Success", description: "Password updated successfully." })
      onOpenChange(false)
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      toast({ 
        title: "Error", 
        description: err.response?.data?.error || "Failed to update password.", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-blue-600 p-10 text-white relative">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight leading-none text-white">Security Update</DialogTitle>
            <p className="text-blue-100 text-[11px] font-black uppercase tracking-[0.2em] mt-4 opacity-80">Change your account password</p>
          </DialogHeader>
          <div className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center backdrop-blur-lg">
             <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-widest ml-1 opacity-60">Current Password</Label>
            <Input 
              type="password"
              required
              className="rounded-2xl border-gray-100 bg-gray-50 h-16 font-bold text-gray-900 px-8 focus:ring-blue-500 text-lg" 
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-widest ml-1 opacity-60">New Password</Label>
            <Input 
              type="password"
              required
              className="rounded-2xl border-gray-100 bg-gray-50 h-16 font-bold text-gray-900 px-8 focus:ring-blue-500 text-lg" 
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] font-black uppercase text-gray-900 tracking-widest ml-1 opacity-60">Confirm New Password</Label>
            <Input 
              type="password"
              required
              className="rounded-2xl border-gray-100 bg-gray-50 h-16 font-bold text-gray-900 px-8 focus:ring-blue-500 text-lg" 
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-20 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-100 mt-6"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : "Save Password"}
          </Button>
          
          <Button 
            type="button" 
            variant="ghost" 
            className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900"
            onClick={() => onOpenChange(false)}
          >
            Cancel & Return
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
