import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Search, UserSquare, Users, ShieldCheck, Award, MoreHorizontal, Copy, PenSquare, Trash2, X, Calendar, CheckCircle2, XCircle } from "lucide-react"
import api from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"
import StaffForm from "@/components/StaffForm"

export default function StaffManagementPage() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("[StaffPage] Loading staff list...")
      const res = await api.get("/api/staff")
      setStaff(res.data || [])
      console.log("[StaffPage] STAFF LOADED:", res.data);
      console.log("[StaffPage] Loaded", (res.data || []).length, "staff members")
    } catch (err) {
      console.error("[StaffPage] Error loading staff:", err)
      toast({ title: "Error", description: "Failed to load staff list", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])


  // TOGGLE STAFF STATUS (Activate / Deactivate)
  const handleToggleStatus = async (staffMember) => {
    const newStatus = !staffMember.isActive
    console.log("[StaffPage] Toggling status for:", staffMember.name, "to", newStatus)
    try {
      await api.patch(`/api/staff/${staffMember.id}/status`, { isActive: newStatus })
      toast({ title: newStatus ? "Staff Activated" : "Staff Deactivated", description: `${staffMember.name} is now ${newStatus ? "active" : "inactive"}.` })
      loadData()
    } catch (err) {
      console.error("[StaffPage] Error toggling status:", err)
      toast({ title: "Action Failed", description: err.response?.data?.error || "Could not update status", variant: "destructive" })
    }
  }


  // SAVE EDIT
  const handleEditStaff = async (id, formData) => {
    console.log("[StaffPage] Saving edit for:", id)
    try {
      await api.put(`/api/staff/${id}`, formData)
      toast({ title: "Profile Updated", description: "The staff profile has been explicitly saved and updated." })
      document.body.style.pointerEvents = ""; // Safely release any generic shadcn locks
      loadData()
    } catch (err) {
      console.error("[StaffPage] Error editing staff:", err)
      toast({ title: "Update Failed", description: err.response?.data?.error || "Could not update profile", variant: "destructive" })
    }
  }
  const filteredStaff = staff.filter(s => {
    const name = s.name?.toLowerCase() || ""
    const email = s.email?.toLowerCase() || ""
    const specialization = s.specialization?.toLowerCase() || ""
    const matchesSearch = name.includes(search.toLowerCase()) ||
                          email.includes(search.toLowerCase()) ||
                          specialization.includes(search.toLowerCase())
    const matchesRole = roleFilter === "ALL" || (s.role || "").toUpperCase() === roleFilter.toUpperCase()
    return matchesSearch && matchesRole
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Fetching Team Directory...</p>
    </div>
  )

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-6 py-8 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Staff Management</h1>
          <p className="text-gray-400 text-sm font-medium mt-3 opacity-80">Manage medical staff, roles, and department assignments.</p>
        </div>

        <Button
          type="button"
          onClick={() => {
            navigate("/receptionist/staff/register");
          }}
          className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase tracking-widest text-[11px] px-10 h-14 flex gap-3 shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Add New Staff
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:ring-1 hover:ring-blue-100">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Total Staff</div>
            <div className="text-5xl font-black text-gray-900 leading-none">{staff.length}</div>
          </div>
          <div className="p-4 bg-gray-50 text-gray-400 rounded-3xl"><ShieldCheck className="w-7 h-7"/></div>
        </Card>
        <Card className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:ring-1 hover:ring-green-100">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Active Doctors</div>
            <div className="text-5xl font-black text-green-600 leading-none">{staff.filter(s=>s.role==='DOCTOR' && s.isActive).length}</div>
          </div>
          <div className="p-4 bg-green-50 text-green-500 rounded-3xl"><Award className="w-7 h-7"/></div>
        </Card>
        <Card className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:ring-1 hover:ring-purple-100">
          <div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Receptionists</div>
            <div className="text-5xl font-black text-gray-900 leading-none">{staff.filter(s=>s.role==='RECEPTIONIST').length}</div>
          </div>
          <div className="p-4 bg-purple-50 text-purple-500 rounded-3xl"><UserSquare className="w-7 h-7"/></div>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] p-0 overflow-hidden bg-white">
        <div className="p-6 flex gap-4 border-b border-gray-50 items-center justify-between px-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input
              className="pl-12 h-12 rounded-2xl border-none bg-gray-50/50 font-bold text-sm focus-visible:ring-1"
              placeholder="Filter by name, specialty..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] border border-gray-100 shadow-inner overflow-x-auto custom-scrollbar">
            {["ALL", "DOCTOR", "RECEPTIONIST", "LAB_TECH"].map(r => (
              <div
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`${roleFilter === r ? "bg-white text-gray-900 shadow-sm scale-105" : "text-gray-400"} px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all whitespace-nowrap`}
              >{r === "ALL" ? "All Team" : r === "DOCTOR" ? "Doctors" : r === "RECEPTIONIST" ? "Receptionists" : "Lab Techs"}</div>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader className="bg-gray-50/10 h-16">
            <TableRow className="hover:bg-transparent border-gray-50">
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-12">Identity</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Qualification</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Email ID</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Role</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Specialization</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Status</TableHead>
              <TableHead className="w-[80px] text-right pr-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(filteredStaff || []).map(s => (
              <TableRow key={s.id} className="hover:bg-gray-50/30 transition-all border-gray-50 h-24 group">
                <TableCell className="pl-12">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 font-black text-[10px] flex items-center justify-center uppercase shadow-inner border border-white group-hover:scale-110 transition-transform">
                      {(s.name || 'S').split(' ').map(n=>n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-black text-gray-900 text-sm whitespace-nowrap">{(s.role === 'DOCTOR' ? 'Dr. ' : '') + (s.name || "")}</span>
                  </div>
                </TableCell>
                <TableCell className="text-[12px] font-bold text-gray-500 uppercase">{s.qualification || "--"}</TableCell>
                <TableCell className="text-[12px] font-bold text-gray-500">{s.email || ""}</TableCell>
                <TableCell>
                  <Badge className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-none ${
                    s.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 
                    s.role === 'RECEPTIONIST' ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>{s.role || ""}</Badge>
                </TableCell>
                <TableCell className="text-[12px] font-bold text-gray-400">{s.specialization || "--"}</TableCell>
                <TableCell>
                  <Badge className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none ${
                    s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>{s.isActive ? "Active" : "Inactive"}</Badge>
                </TableCell>
                <TableCell className="text-right pr-12">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="rounded-2xl hover:bg-white hover:shadow-2xl text-gray-300 transition-all">
                        <MoreHorizontal className="w-5 h-5"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 rounded-[2rem] border-gray-100 shadow-2xl p-4 bg-white ring-1 ring-black/5 z-[50]">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-4 py-2 tracking-[0.2em]">Actions</DropdownMenuLabel>

                      <DropdownMenuItem
                        className="rounded-2xl font-black text-[11px] uppercase tracking-widest gap-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onSelect={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(`SID-${(s.id || "").slice(-8).toUpperCase()}`);
                          toast({ title: "Copied!", description: "Staff ID copied to clipboard." });
                        }}
                      >
                        <Copy className="w-4 h-4 text-gray-300" /> Copy Staff ID
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="rounded-2xl font-black text-[11px] uppercase tracking-widest gap-4 py-4 hover:bg-blue-50 text-blue-600 cursor-pointer transition-colors"
                        onSelect={() => navigate("/receptionist/staff/register", { state: { editData: s } })}
                      >
                        <PenSquare className="w-4 h-4" /> Edit Profile
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-gray-50 mx-2 my-2" />

                      {s.isActive ? (
                        <DropdownMenuItem
                          className="rounded-2xl font-black text-[11px] uppercase tracking-widest gap-4 py-4 hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleToggleStatus(s);
                          }}
                        >
                          <XCircle className="w-4 h-4" /> Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="rounded-2xl font-black text-[11px] uppercase tracking-widest gap-4 py-4 hover:bg-green-50 text-green-600 cursor-pointer transition-colors"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleToggleStatus(s);
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Activate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredStaff.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-32 text-gray-300 font-black uppercase tracking-[0.3em] text-[10px] opacity-20">No matching staff records found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

    </div>
  )
}
