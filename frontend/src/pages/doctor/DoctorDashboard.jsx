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
         <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome, Dr. {user?.name || "Physician"}</h1>
         <p className="text-gray-500 mt-1">Your Current Branch: <span className="text-blue-600 font-medium">Chennai City Center</span>, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <User size={24} />
               </div>
               <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Total Patients</div>
                  <div className="text-3xl font-bold text-gray-900">{totalPatients}</div>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Clock size={24} />
               </div>
               <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">Waiting (In Queue)</div>
                  <div className="text-3xl font-bold text-gray-900">{waitingPatients}</div>
               </div>
            </CardContent>
         </Card>
         <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-6">
               <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Activity size={24} />
               </div>
               <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">In Progress / Lab</div>
                  <div className="text-3xl font-bold text-gray-900">{inProgressPatients}</div>
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Patient Queue Section */}
      <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
         <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
               <h2 className="text-lg font-bold text-gray-900">Patient Queue</h2>
               <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                     placeholder="Search Name or ID..." 
                     className="pl-9 bg-gray-50/50 border-gray-200 rounded-full h-9"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>
            
            <Tabs value={filterTab} onValueChange={setFilterTab} className="w-[300px]">
               <TabsList className="grid w-full grid-cols-3 bg-gray-50/50 rounded-full p-1 h-10 border-none">
                  <TabsTrigger value="all" className="rounded-full text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
                  <TabsTrigger value="waiting" className="rounded-full text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Waiting</TabsTrigger>
                  <TabsTrigger value="in-progress" className="rounded-full text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">Checked-In</TabsTrigger>
               </TabsList>
            </Tabs>
         </div>
         
         <Table>
            <TableHeader className="bg-gray-50/50 h-12">
               <TableRow className="hover:bg-transparent border-gray-50">
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-6">ID</TableHead>
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Time</TableHead>
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Patient Details</TableHead>
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Reason</TableHead>
                  <TableHead className="text-[11px] font-black text-gray-400 uppercase tracking-widest text-right px-6">Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {(filteredVisits || []).map(visit => (
                  <TableRow key={visit.id} className="hover:bg-gray-50/50 border-gray-50 h-20">
                     <TableCell className="px-6 text-xs text-gray-400 font-medium font-mono">#{(visit.id || "").slice(-8).toUpperCase()}</TableCell>
                     <TableCell className="font-bold text-gray-900 text-sm">
                        {new Date(visit.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase border border-blue-100/50">
                              {(visit.patient?.name || "P").charAt(0)}
                           </div>
                           <div 
                              className="flex flex-col cursor-pointer hover:bg-blue-50/50 p-1 rounded-md transition-colors" 
                              onClick={() => navigate(`/doctor/consultation/${visit.id}`)}
                           >
                              <span className="font-bold text-blue-600 hover:text-blue-700 text-sm">{visit.patient?.name || "Unknown"}</span>
                              <span className="text-[11px] text-gray-500 font-medium">{(visit.patient?.gender || "MALE").substring(0,1).toUpperCase() + (visit.patient?.gender || "MALE").substring(1).toLowerCase()}, {new Date().getFullYear() - (new Date(visit.patient?.dateOfBirth || Date.now()).getFullYear() || 1990)} yrs</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full tracking-wider border ${
                           visit.status === "ASSIGNED_TO_DOCTOR" || visit.status === "WAITING" ? "bg-orange-50 text-orange-600 border-orange-100" :
                           visit.status === "VITALS_COMPLETED" || visit.status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                           "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                           {visit.status === "ASSIGNED_TO_DOCTOR" ? "WAITING" : (visit.status || "").replace(/_/g, ' ')}
                        </span>
                     </TableCell>
                     <TableCell className="text-sm text-gray-500 font-medium truncate max-w-[150px]">
                        {visit.notes || "-"}
                     </TableCell>
                     <TableCell className="text-right px-6">
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100">
                                 <MoreVertical className="w-5 h-5" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-56 rounded-2xl border-gray-100 shadow-2xl p-3 bg-white z-[150]">
                              <DropdownMenuItem 
                                 className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-blue-600 rounded-xl py-4 focus:bg-blue-50"
                                 onSelect={(e) => {
                                    e.preventDefault();
                                    navigate(`/doctor/consultation/${visit.id}`);
                                 }}
                              >
                                 <PlayCircle className="w-5 h-5 mr-3" /> Start Consultation
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-black text-[10px] uppercase tracking-widest text-gray-400 rounded-xl py-4 hover:bg-gray-50">
                                 View Records
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </TableCell>
                  </TableRow>
               ))}
               {filteredVisits.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center py-24 text-gray-400 bg-white">
                        <div className="flex flex-col items-center opacity-30">
                           <User className="w-16 h-16 mb-4 text-gray-200" />
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
