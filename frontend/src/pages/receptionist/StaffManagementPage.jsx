import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Search, UserSquare, Users, ShieldCheck, Award, MoreHorizontal, Copy, PenSquare, Trash2, X, Calendar, CheckCircle2, XCircle } from "lucide-react"
import api from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useNavigate } from "react-router-dom"

export default function StaffManagementPage() {
  const navigate = useNavigate()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const { toast } = useToast()

  // Add Staff Dialog
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "password123", role: "DOCTOR", specialization: "", licenseNumber: "" })

  // Edit Staff Dialog
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: "", name: "", email: "", role: "DOCTOR", specialization: "", licenseNumber: "" })

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

  // CREATE STAFF
  const handleAddStaff = async (e) => {
    e.preventDefault()
    console.log("[StaffPage] Creating staff:", addForm)
    try {
      await api.post("/api/staff/create", addForm)
      toast({ title: "Staff Registered", description: `${addForm.name} has been added to the system.` })
      setIsAddOpen(false)
      setAddForm({ name: "", email: "", password: "password123", role: "DOCTOR", specialization: "", licenseNumber: "" })
      loadData()
    } catch (err) {
      console.error("[StaffPage] Error creating staff:", err)
      toast({ title: "Failed to Add Staff", description: err.response?.data?.error || "Registration error", variant: "destructive" })
    }
  }

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

  // OPEN EDIT DIALOG
  const openEditDialog = (staffMember) => {
    console.log("[StaffPage] Opening edit dialog for:", staffMember.name)
    setEditForm({
      id: staffMember.id,
      name: staffMember.name || "",
      email: staffMember.email || "",
      role: staffMember.role || "DOCTOR",
      specialization: staffMember.specialization || "",
      licenseNumber: staffMember.licenseNumber || ""
    })
    setIsEditOpen(true)
  }

  // SAVE EDIT
  const handleEditStaff = async (e) => {
    e.preventDefault()
    console.log("[StaffPage] Saving edit for:", editForm.id)
    try {
      await api.put(`/api/staff/${editForm.id}`, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        specialization: editForm.specialization,
        licenseNumber: editForm.licenseNumber
      })
      toast({ title: "Profile Updated", description: `${editForm.name}'s profile has been saved.` })
      setIsEditOpen(false)
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
            console.log("[StaffPage] Navigating to Staff Registration page");
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
                    <DropdownMenuContent align="end" className="w-60 rounded-[2rem] border-gray-100 shadow-2xl p-4 bg-white ring-1 ring-black/5 z-[150]">
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
                        onSelect={(e) => {
                          e.preventDefault();
                          setTimeout(() => openEditDialog(s), 0);
                        }}
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

      {/* ADD STAFF DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-[480px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white z-[100]">
          <div className="p-10 pb-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Add New Staff</DialogTitle>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Register a new team member.</p>
            </DialogHeader>
          </div>
          <form onSubmit={handleAddStaff} className="p-10 pt-0 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Full Name</Label>
                <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Dr. John Doe" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Email Address</Label>
                <Input type="email" className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="doctor@hospital.com" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Staff Role</Label>
                <Select value={addForm.role} onValueChange={v => setAddForm({...addForm, role: v})}>
                  <SelectTrigger className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold shadow-none"><SelectValue/></SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100">
                    <SelectItem value="DOCTOR">Physician (Doctor)</SelectItem>
                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Password</Label>
                <Input type="password" className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} required />
              </div>
            </div>

            {addForm.role === 'DOCTOR' && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Specialization</Label>
                  <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold" value={addForm.specialization} onChange={e => setAddForm({...addForm, specialization: e.target.value})} placeholder="General Practice" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">License Number</Label>
                  <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold" value={addForm.licenseNumber} onChange={e => setAddForm({...addForm, licenseNumber: e.target.value})} placeholder="MC-XXXXX" />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-[1.5rem] h-16 font-black uppercase tracking-widest text-[11px] mt-6 shadow-xl shadow-blue-100">Create Staff Profile</Button>
            <Button type="button" variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-300" onClick={() => setIsAddOpen(false)}>Cancel</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT STAFF DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[480px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white z-[100]">
          <div className="p-10 pb-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">Edit Staff Profile</DialogTitle>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Update team member information.</p>
            </DialogHeader>
          </div>
          <form onSubmit={handleEditStaff} className="p-10 pt-0 space-y-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Full Name</Label>
                <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Email</Label>
                <Input type="email" className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold text-gray-800" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Specialization</Label>
                <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold" value={editForm.specialization} onChange={e => setEditForm({...editForm, specialization: e.target.value})} placeholder="Cardiology" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">License Number</Label>
                <Input className="rounded-2xl h-14 bg-gray-50/50 border-gray-100 font-bold" value={editForm.licenseNumber} onChange={e => setEditForm({...editForm, licenseNumber: e.target.value})} placeholder="MC-XXXXX" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 rounded-[1.5rem] h-16 font-black uppercase tracking-widest text-[11px] mt-6 shadow-xl shadow-blue-100">Save Changes</Button>
            <Button type="button" variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-300" onClick={() => setIsEditOpen(false)}>Cancel</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
