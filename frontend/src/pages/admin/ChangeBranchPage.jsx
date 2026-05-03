import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Building2, ArrowLeft, Loader2, Calendar } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function ChangeBranchPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newBranch, setNewBranch] = useState("")
  const [duration, setDuration] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get("/api/staff")
        const staffList = res.data || []
        const currentStaff = staffList.find(s => s.id === id)
        if (currentStaff) {
          setDoctor(currentStaff)
        } else {
          toast({ title: "Error", description: "Staff member not found", variant: "destructive" })
          navigate(-1)
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch staff details", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchStaff()
  }, [id, navigate, toast])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!newBranch) {
      toast({ title: "Required", description: "Please enter the new branch name", variant: "destructive" })
      return
    }
    
    // We simply append duration to branch name to save it without DB changes
    const finalBranchName = duration ? `${newBranch} (${duration} months)` : newBranch

    try {
      setSaving(true)
      await api.put(`/api/staff/${id}`, { branchName: finalBranchName })
      toast({ title: "Success", description: "Branch changed successfully." })
      navigate(-1)
    } catch (error) {
      toast({ title: "Error", description: "Failed to update branch", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Details...</p>
      </div>
    )
  }

  if (!doctor) return null

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 pb-32">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="text-gray-400 hover:text-gray-900 -ml-4 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Staff
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Change Branch</h1>
        <p className="text-gray-500 font-medium">Transfer doctor to a different branch location.</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
        <div className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">{doctor.name}</h3>
            <p className="text-gray-500 font-bold text-sm mt-1">Current Branch: <span className="text-blue-600">{doctor.branchName || "Not Assigned"}</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Transfer to Branch Name</Label>
            <Input 
              placeholder="e.g. Bangalore Branch"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              className="h-14 rounded-2xl bg-gray-50/50 text-base font-bold border-gray-200 focus-visible:ring-orange-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Duration (Months) - Optional</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input 
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-14 pl-12 rounded-2xl bg-gray-50/50 text-base font-bold border-gray-200 focus-visible:ring-orange-500"
              />
            </div>
            <p className="text-xs text-gray-400 ml-2 mt-2 font-medium">Leave blank if this is a permanent transfer.</p>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={saving}
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-orange-100"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Branch Transfer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
