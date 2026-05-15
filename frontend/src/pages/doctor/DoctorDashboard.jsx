import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, User, Clock, Activity, MoreVertical, PlayCircle } from "lucide-react"
import api from "@/services/api"

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [assignedVisits, setAssignedVisits] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterTab, setFilterTab] = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    async function loadAssigned() {
      try {
        const res = await api.get("/api/consultations/assigned")
        setAssignedVisits(res.data || [])
      } catch (error) {
        console.error("Failed to load assigned patients", error)
      }
    }
    loadAssigned()
  }, [])

  const filteredVisits = assignedVisits.filter(v => {
     const name = v.patient?.name || ""
     const vid = v.id || ""
     const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           vid.toLowerCase().includes(searchQuery.toLowerCase())
     if (!matchesSearch) return false
     if (filterTab === "waiting") return v.status === "WAITING" || v.status === "ASSIGNED_TO_DOCTOR"
     if (filterTab === "in-progress") return v.status === "VITALS_COMPLETED" || v.status === "IN_PROGRESS"
     return true
  })

  const totalPatients = assignedVisits.length
  const waitingPatients = assignedVisits.filter(v => v.status === "WAITING" || v.status === "ASSIGNED_TO_DOCTOR").length
  const inProgressPatients = assignedVisits.filter(v => v.status === "VITALS_COMPLETED" || v.status === "IN_PROGRESS" || v.status === "CONSULTED").length

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pt-4">
      
      {/* Welcome Header */}
      <div>
         <h1 className="text-3xl font-bold text-black tracking-tight">Welcome, Dr. {user?.name || "Physician"}</h1>
         <p className="text-black mt-1 font-bold uppercase tracking-widest text-[11px] opacity-40">Your Current Branch: <span className="text-blue-600 font-bold">Chennai City Center</span>, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-[2rem] border-gray-100 shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-8 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <User size={28} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-black mb-1 uppercase tracking-[0.2em] opacity-40">Total Patients</div>
                  <div className="text-3xl font-black text-black tracking-tighter">{totalPatients}</div>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-[2rem] border-gray-100 shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-8 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Clock size={28} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-black mb-1 uppercase tracking-[0.2em] opacity-40">Waiting (In Queue)</div>
                  <div className="text-3xl font-black text-black tracking-tighter">{waitingPatients}</div>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-[2rem] border-gray-100 shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-8 flex items-center gap-6">
               <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <Activity size={28} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-black mb-1 uppercase tracking-[0.2em] opacity-40">In Progress / Lab</div>
                  <div className="text-3xl font-black text-black tracking-tighter">{inProgressPatients}</div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Patient Queue Section */}
      <Card className="rounded-[2.5rem] border-gray-100 shadow-sm overflow-hidden bg-white">
         <div className="p-6 px-8 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6 flex-1">
               <h2 className="text-xl font-bold text-black tracking-tight">Patient Queue</h2>
               <div className="relative w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
                  <Input 
                     placeholder="Search Name or ID..." 
                     className="pl-10 h-12 bg-gray-50/50 border-gray-100 rounded-2xl text-sm font-bold text-black placeholder:text-black focus:ring-0"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>
            
            <Tabs value={filterTab} onValueChange={setFilterTab} className="w-[340px]">
               <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1.5 h-12 rounded-2xl border-none">
                  <TabsTrigger value="all" className="rounded-xl text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm text-black">All</TabsTrigger>
                  <TabsTrigger value="waiting" className="rounded-xl text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm text-black">Waiting</TabsTrigger>
                  <TabsTrigger value="in-progress" className="rounded-xl text-[10px] uppercase font-black tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm text-black">Checked-In</TabsTrigger>
               </TabsList>
            </Tabs>
         </div>
         
         <Table>
            <TableHeader className="bg-gray-50/50 h-16">
               <TableRow className="hover:bg-transparent border-gray-50">
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em] px-8">Queue ID</TableHead>
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Check-in Time</TableHead>
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Patient Profile</TableHead>
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Status Badge</TableHead>
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Chief Complaint</TableHead>
                  <TableHead className="text-[10px] font-black text-black uppercase tracking-[0.2em] text-right px-8">Management</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {(filteredVisits || []).map(visit => (
                  <TableRow key={visit.id} className="hover:bg-gray-50/30 border-gray-50 h-24 transition-colors">
                     <TableCell className="px-8 text-xs text-black font-black font-mono opacity-30">#{(visit.id || "").slice(-8).toUpperCase()}</TableCell>
                     <TableCell className="font-black text-black text-sm tracking-tight">
                        {new Date(visit.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}).toUpperCase()}
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-4">
                           <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm uppercase border border-white shadow-sm">
                              {(visit.patient?.name || "P").charAt(0)}
                           </div>
                           <div 
                              className="flex flex-col cursor-pointer group/name" 
                              onClick={() => navigate(`/doctor/consultation/${visit.id}`)}
                           >
                              <span className="font-black text-black group-hover/name:text-blue-600 transition-colors text-base tracking-tight">{visit.patient?.name || "Unknown"}</span>
                              <span className="text-[10px] text-black font-black uppercase tracking-widest opacity-40 mt-0.5">{(visit.patient?.gender || "MALE")}, {new Date().getFullYear() - (new Date(visit.patient?.dateOfBirth || Date.now()).getFullYear() || 1990)} Years</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <span className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-full tracking-widest border shadow-sm ${
                           visit.status === "ASSIGNED_TO_DOCTOR" || visit.status === "WAITING" ? "bg-orange-50 text-orange-600 border-orange-100" :
                           visit.status === "VITALS_COMPLETED" || visit.status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                           {visit.status === "ASSIGNED_TO_DOCTOR" ? "WAITING" : (visit.status || "").replace(/_/g, ' ')}
                        </span>
                     </TableCell>
                     <TableCell className="text-[11px] text-black font-black uppercase tracking-tight truncate max-w-[180px] opacity-60">
                        {visit.notes || "GENERAL CHECKUP"}
                     </TableCell>
                     <TableCell className="text-right px-8">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-black hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                 <MoreVertical className="w-5 h-5 opacity-40" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-64 rounded-[2rem] border-none shadow-2xl p-3 bg-white z-[150] ring-1 ring-black/5">
                              <DropdownMenuItem 
                                 className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-blue-600 rounded-2xl py-4 px-5 focus:bg-blue-50 mb-1"
                                 onSelect={(e) => {
                                    e.preventDefault();
                                    navigate(`/doctor/consultation/${visit.id}`);
                                 }}
                              >
                                 <PlayCircle className="w-5 h-5 mr-4" /> Start Consultation
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-black rounded-2xl py-4 px-5 focus:bg-gray-50 opacity-60">
                                 View Medical History
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </TableCell>
                  </TableRow>
               ))}
               {filteredVisits.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center py-24 text-black bg-white">
                        <div className="flex flex-col items-center">
                           <User className="w-16 h-16 mb-4 text-black opacity-10" />
                           <p className="font-black text-[10px] uppercase tracking-[0.3em]">No patients found in queue</p>
                        </div>
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
         </Table>
      </Card>
    </div>
  )
}
