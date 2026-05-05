import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, ClipboardList, Activity, MoreVertical, Users, Wallet, CheckCircle2, AlertCircle, Search } from "lucide-react"
import api from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { VoiceMicButton } from "@/components/VoiceMicButton"

export default function DailyVisitsPage() {
   const [stats, setStats] = useState({ totalPatients: 0, pendingVisits: 0, unpaidVisits: 0 })
   const [visits, setVisits] = useState([])
   const [doctors, setDoctors] = useState([])
   const [loading, setLoading] = useState(true)
   const [search, setSearch] = useState("")
   const [dateRange, setDateRange] = useState({ start: "", end: "" })
   const [currentPage, setCurrentPage] = useState(1)
   const [uhid, setUhid] = useState("")
   const [abha, setAbha] = useState("")
   const itemsPerPage = 10
   const navigate = useNavigate()
   const { toast } = useToast()

   // Vitals State
   const [isVitalsOpen, setIsVitalsOpen] = useState(false)
   const [activeVisit, setActiveVisit] = useState(null)
   const [manualVitals, setManualVitals] = useState({ bp: "", pulse: "", temp: "", weight: "", height: "" })

   // Doctor Assign State
   const [isAssignOpen, setIsAssignOpen] = useState(false)
   const [selectedDoctor, setSelectedDoctor] = useState("")
   const [loadingDoctors, setLoadingDoctors] = useState(false)

   // Side Panel State
   const [selectedVisit, setSelectedVisit] = useState(null)
   const [voiceEnabled, setVoiceEnabled] = useState(true)

   useEffect(() => {
      console.log("SELECTED VISIT:", selectedVisit)
   }, [selectedVisit])

   useEffect(() => {
      if (selectedVisit) {
         setLoadingDoctors(true)
         api.get("/api/doctors")
            .then(res => {
               const data = Array.isArray(res.data)
                  ? res.data
                  : res.data?.data || []

               setDoctors(data)
            })
            .catch(err => console.error(err))
            .finally(() => setLoadingDoctors(false))
      }
   }, [selectedVisit])

   useEffect(() => {
      api.get("/api/settings/public")
         .then(res => {
            const settings = res.data || []
            const s = settings.find(item => item.key === "receptionist_voice_enabled")
            setVoiceEnabled(s ? s.value === 'true' : true)
         })
         .catch(() => setVoiceEnabled(true))
   }, [])

   useEffect(() => {
      console.log("DOCTORS STATE:", doctors)
   }, [doctors])

   const handleSheetVitals = async (e) => {
      e.preventDefault();
      try {
         if (!selectedVisit?.id) return;
         await api.put(`/api/vitals/${selectedVisit.id}`, {
            bloodPressure: manualVitals.bp,
            pulse: manualVitals.pulse,
            temperature: manualVitals.temp,
            weight: manualVitals.weight,
            height: manualVitals.height
         });
         toast({ title: "Vitals Updated", description: "Successfully updated vitals." });
         loadData();
      } catch (err) {
         toast({ title: "Error", variant: "destructive", description: "Failed to update vitals" });
      }
   }

   const handleSheetAssign = async (e) => {
      e.preventDefault();
      if (!selectedDoctor) return toast({ title: "Select Doctor", variant: "destructive" });
      if (!selectedVisit?.id) return;
      try {
         await api.patch(`/api/visits/${selectedVisit.id}/assign`, { doctorId: selectedDoctor });
         toast({ title: "Doctor Assigned", description: "Successfully allocated doctor." });
         setSelectedVisit(null);
         loadData();
      } catch (err) {
         toast({ title: "Error", variant: "destructive", description: "Failed to assign doctor" });
      }
   }

   const loadData = async (silent = false) => {
      try {
         if (!silent) setLoading(true)
         const [sRes, vRes, dRes] = await Promise.all([
            api.get("/api/visits/stats/receptionist"),
            api.get("/api/visits"),
            api.get("/api/staff/doctors")
         ])
         setStats(sRes.data)
         setVisits(vRes.data || [])
         setDoctors(dRes.data || [])
      } catch (err) {
         toast({ title: "Sync Error", description: "Could not refresh operational data.", variant: "destructive" })
      } finally {
         setLoading(false)
      }
   }

   const applyExtractedData = (data, type) => {
      if (type.startsWith("vital")) {
         setManualVitals(prev => ({
            ...prev,
            bp: data.bp || prev.bp,
            pulse: data.pulse || prev.pulse,
            temp: data.temperature || prev.temp,
            weight: data.weight || prev.weight,
            height: data.height || prev.height
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

   const handleManualVitals = async (e) => {
      if (e) e.preventDefault()
      if (!activeVisit?.id) {
         toast({ title: "Error", description: "Visit not loaded", variant: "destructive" })
         return;
      }

      console.log("[VisitsPage] Saving vitals for visit:", activeVisit?.id)
      console.log("Sending visitId:", activeVisit?.id)
      try {
         await api.put(`/api/vitals/${activeVisit.id}`, {
            bloodPressure: manualVitals.bp,
            pulse: manualVitals.pulse,
            temperature: manualVitals.temp,
            weight: manualVitals.weight,
            height: manualVitals.height
         })
         toast({ title: "Vitals Updated", description: "Patient data has been saved." })
         setIsVitalsOpen(false)
         loadData()
      } catch (err) {
         console.error("[VisitsPage] Error saving vitals:", err)
         toast({ title: "Error Saving Vitals", description: err.response?.data?.error || "Failed to save", variant: "destructive" })
      }
   }

   const handleAssignDoctor = async (e) => {
      if (e) e.preventDefault()
      console.log("[VisitsPage] Assigning doctor:", selectedDoctor, "to visit:", activeVisit?.id)
      if (!selectedDoctor) return toast({ title: "Select a doctor", variant: "destructive" })
      try {
         await api.patch(`/api/visits/${activeVisit.id}/assign`, { doctorId: selectedDoctor })
         toast({ title: "Doctor Allocated", description: "Visit moved to doctor console." })
         setIsAssignOpen(false)
         loadData()
      } catch (err) {
         console.error("[VisitsPage] Error assigning doctor:", err)
         toast({ title: "Allocation Failed", description: err.response?.data?.error || "Failed", variant: "destructive" })
      }
   }

   const handleCollectMoney = async (visitId) => {
      try {
         await api.post(`/api/visits/${visitId}/collect-fee`)
         toast({ title: "Payment Collected", description: "Operation successfully logged." })
         loadData(true) // Silent reload for speed
      } catch (err) {
         toast({ title: "Action Failed", description: "Payment processing error.", variant: "destructive" })
      }
   }

   useEffect(() => { loadData() }, [])
   useEffect(() => { setCurrentPage(1) }, [search, dateRange])

    const filteredVisits = visits.filter(v => {
       const searchMatches = (
          (v.patient?.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (v.patient?.phone || "").toLowerCase().includes(search.toLowerCase()) ||
          (v.notes || "").toLowerCase().includes(search.toLowerCase()) ||
          (v.doctor?.name || "").toLowerCase().includes(search.toLowerCase())
       );
       
       let dateMatches = true;
       if (dateRange.start && dateRange.end) {
          const vDate = new Date(v.createdAt);
          vDate.setHours(0,0,0,0);
          const start = new Date(dateRange.start);
          start.setHours(0,0,0,0);
          const end = new Date(dateRange.end);
          end.setHours(0,0,0,0);
          dateMatches = (vDate >= start && vDate <= end);
       } else if (dateRange.start || dateRange.end) {
          // If only one is selected, match that day
          const vDate = new Date(v.createdAt).toLocaleDateString();
          const targetDate = new Date(dateRange.start || dateRange.end).toLocaleDateString();
          dateMatches = vDate === targetDate;
       }

       return searchMatches && dateMatches;
    })

    const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
    const paginatedVisits = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
         <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
         <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Clinic Status...</p>
      </div>
   )

   return (
      <div className="space-y-10 max-w-7xl mx-auto px-6 py-8 pb-20">
         <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div>
               <h1 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">Daily Operations</h1>
               <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 ml-1 opacity-80">Clinic Reception Command Center</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 text-sm font-black text-gray-700 shadow-inner">
               <Calendar className="w-4 h-4 text-blue-500" /> {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-sm rounded-[2rem] p-6 bg-blue-600 text-white overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/20 transition-all"></div>
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Registered</span>
                  <div className="p-2 bg-white/20 rounded-xl"><Users className="w-5 h-5" /></div>
               </div>
               <div className="text-5xl font-black relative z-10 leading-none">{stats.totalPatients}</div>
               <p className="text-blue-100 text-[10px] font-bold mt-2 uppercase tracking-widest relative z-10">Patients Today</p>
            </Card>
            <Card className="border border-gray-100 shadow-sm rounded-[2rem] p-6 bg-white overflow-hidden relative group hover:ring-1 hover:ring-orange-100 transition-all">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Pending Vitals</span>
                  <div className="p-2 bg-orange-50 rounded-xl text-orange-500"><ClipboardList className="w-5 h-5" /></div>
               </div>
               <div className="text-5xl font-black text-gray-900 leading-none">{stats.pendingVisits}</div>
               <p className="text-orange-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Waiting in Queue</p>
            </Card>
            <Card className="border border-gray-100 shadow-sm rounded-[2rem] p-6 bg-white overflow-hidden relative group hover:ring-1 hover:ring-green-100 transition-all">
               <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Revenue Status</span>
                  <div className="p-2 bg-green-50 rounded-xl text-green-500"><Wallet className="w-5 h-5" /></div>
               </div>
               <div className="text-5xl font-black text-gray-900 leading-none">{stats.unpaidVisits}</div>
               <p className="text-green-500 text-[10px] font-bold mt-2 uppercase tracking-widest">Unpaid Ledger</p>
            </Card>
         </div>

         <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
               <h2 className="text-xl font-black text-gray-900 tracking-tight">Visit Management</h2>
               
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-blue-500" /> 
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-[11px] font-black text-gray-600 focus:outline-none" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                    <span className="text-gray-300 mx-1 font-black">─</span>
                    <input 
                      type="date" 
                      className="bg-transparent border-none text-[11px] font-black text-gray-600 focus:outline-none" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    />
                    {(dateRange.start || dateRange.end) && (
                      <button 
                        onClick={() => setDateRange({ start: "", end: "" })}
                        className="ml-2 text-[10px] font-black text-red-500 uppercase hover:text-red-700 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="relative w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     <input
                        className="w-full pl-9 pr-4 rounded-2xl border border-gray-100 bg-white h-10 text-[11px] font-black shadow-sm focus:ring-1 focus:ring-blue-100 outline-none"
                        placeholder="Search patient, phone or doctor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                     />
                  </div>
               </div>
            </div>
            <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] p-0 overflow-hidden bg-white">
               <Table>
                  <TableHeader className="bg-gray-50/30">
                     <TableRow className="hover:bg-transparent border-gray-50 h-16">
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-10">Visit ID</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Patient</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Problem / Symptoms</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Physician</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-center">Status</TableHead>
                         <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-center">Fee Type</TableHead>
                         <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-center">Payment</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 text-right pr-10">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {(paginatedVisits || []).map(v => (
                         <TableRow
                            key={v.id}
                            className="cursor-pointer hover:bg-gray-50/50 transition-all border-gray-50 h-20 group"
                            onClick={async () => {
                               // If completed or payment collected, handle navigation
                               if (v.status === 'PRESCRIPTION_COMPLETED' || v.status === 'PAYMENT_COLLECTED' || v.status === 'COMPLETED') {
                                  if (v.paymentStatus === 'PAID') {
                                     navigate(`/print/${v.id}`);
                                  } else {
                                     window.alert("Payment not done");
                                  }
                                  return;
                               }
                               
                               // Otherwise open side panel for operative tasks
                               try {
                                  console.log("CLICKED:", v.id);
                                  setSelectedVisit(null); // reset first
                                  const res = await api.get(`/api/visits/${v.id}`);
                                  console.log("DATA:", res.data);

                                  if (!res.data) return;
                                  const fullVisit = res.data;
                                  setSelectedVisit(fullVisit);
                                  setUhid(fullVisit.patient?.uhid || "");
                                  setAbha(fullVisit.patient?.abha || "");
                                  setManualVitals({
                                     bp: fullVisit.vitals?.bloodPressure || "",
                                     pulse: fullVisit.vitals?.pulse || "",
                                     temp: fullVisit.vitals?.temperature || "",
                                     weight: fullVisit.vitals?.weight || "",
                                     height: fullVisit.vitals?.height || ""
                                  });
                                  setSelectedDoctor(fullVisit.doctorId || "");
                               } catch (err) {
                                  console.error("FETCH ERROR:", err);
                                  toast({ title: "Error", description: "Could not load full patient record." });
                               }
                            }}
                         >
                           <TableCell className="font-black text-gray-300 text-[11px] pl-10"># {(v.id || "").slice(-8).toUpperCase()}</TableCell>
                           <TableCell>
                              <div className="flex flex-col leading-tight">
                                 <div className="flex items-center gap-2">
                                    <span className="font-black text-gray-900 text-sm whitespace-nowrap">{v.patient?.name || "Patient"}</span>
                                    {v.relation && v.relation !== 'SELF' && (
                                       <Badge className="bg-blue-50 text-blue-600 rounded-lg font-black text-[8px] px-1.5 py-0 border-none uppercase tracking-tighter shadow-none">{v.relation}</Badge>
                                    )}
                                 </div>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 opacity-60">{(v.patient?.gender || "MALE").toLowerCase()} / {new Date().getFullYear() - (new Date(v.patient?.dateOfBirth || Date.now()).getFullYear() || 1990)} yrs</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <p className="text-xs font-bold text-gray-500 max-w-[200px] truncate">{v.notes || "General checkup"}</p>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 {v.doctor?.name ? (
                                    <Badge className="bg-purple-50 text-purple-600 rounded-lg font-black text-[9px] px-2 py-0.5 border-none uppercase">Dr. {v.doctor.name}</Badge>
                                 ) : (
                                    <span className="text-[10px] font-black text-gray-300 uppercase italic">Unallocated</span>
                                 )}
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <Badge className={`rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none shadow-sm ${v.status === 'PRESCRIPTION_COMPLETED' ? 'bg-emerald-100 text-emerald-700' : v.status === 'ASSIGNED_TO_DOCTOR' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>{v.status === 'PRESCRIPTION_COMPLETED' ? 'CONSULTATION COMPLETED' : v.status === 'ASSIGNED_TO_DOCTOR' ? 'DOCTOR ALLOCATED' : 'WAITING'}</Badge>
                           </TableCell>
                           <TableCell className="text-center">
                              {v.feeType ? (
                                 <span className="font-black text-[11px] text-gray-900">{v.feeType}</span>
                              ) : (
                                 <span className="text-[10px] font-bold text-gray-300">--</span>
                              )}
                           </TableCell>
                           <TableCell className="text-center">
                              <Badge className={`rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none shadow-sm ${v.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                                 {v.paymentStatus || "UNPAID"}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <div className="p-2.5 hover:bg-gray-100 rounded-2xl inline-flex cursor-pointer text-gray-400 border border-transparent transition-all hover:text-gray-900 shadow-none">
                                       <MoreVertical className="w-5 h-5" />
                                    </div>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" className="w-64 rounded-3xl shadow-2xl border-gray-100 p-3 bg-white z-[150]">
                                    <DropdownMenuItem
                                       className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 py-4 cursor-pointer focus:bg-blue-50 focus:text-blue-600"
                                       onSelect={(e) => {
                                          e.preventDefault();
                                          setActiveVisit(v);
                                          setManualVitals({ bp: v.vitals?.bloodPressure || "", pulse: v.vitals?.pulse || "", temp: v.vitals?.temperature || "", weight: v.vitals?.weight || "", height: v.vitals?.height || "" });
                                          setTimeout(() => setIsVitalsOpen(true), 0);
                                       }}
                                    >
                                       <Activity className="w-5 h-5" /> Update Vitals
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                       className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 py-4 cursor-pointer focus:bg-purple-50 focus:text-purple-600"
                                       onSelect={(e) => {
                                          e.preventDefault();
                                          setActiveVisit(v);
                                          setSelectedDoctor(v.doctorId || "");
                                          setTimeout(() => setIsAssignOpen(true), 0);
                                       }}
                                    >
                                       <Users className="w-5 h-5" /> Allocate Doctor
                                    </DropdownMenuItem>

                                     {v.paymentStatus !== "PAID" && (
                                        <DropdownMenuItem
                                           className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 py-4 cursor-pointer focus:bg-green-50 focus:text-green-600 animate-in fade-in"
                                           onSelect={(e) => {
                                              e.preventDefault();
                                              handleCollectMoney(v.id);
                                           }}
                                        >
                                           <Wallet className="w-5 h-5" /> Collect Fee
                                        </DropdownMenuItem>
                                     )}

                                     {(v.status === 'PRESCRIPTION_COMPLETED' || v.status === 'PAYMENT_COLLECTED' || v.status === 'COMPLETED') && (
                                        <DropdownMenuItem
                                           className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 py-4 cursor-pointer focus:bg-blue-50 focus:text-blue-600"
                                           onSelect={(e) => {
                                              e.preventDefault();
                                              if (v.paymentStatus === 'PAID') {
                                                 navigate(`/print/${v.id}`);
                                              } else {
                                                 toast({ title: "Payment Not Done", description: "Please collect the fee to view and print the prescription.", variant: "destructive" });
                                              }
                                           }}
                                        >
                                           <ClipboardList className="w-5 h-5" /> View Prescription
                                        </DropdownMenuItem>
                                     )}

                                     <div className="h-px bg-gray-50 my-2 mx-2"></div>
                                     <DropdownMenuItem className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 py-4 cursor-pointer text-red-500 hover:bg-red-50">
                                        Cancel Visit
                                     </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                     ))}
                     {filteredVisits.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-32 text-gray-300 font-bold flex flex-col items-center gap-4">
                           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200"><AlertCircle className="w-8 h-8 opacity-20" /></div>
                           <p className="uppercase tracking-[0.2em] text-[10px] opacity-70">No matching visits found</p>
                        </TableCell></TableRow>
                     )}
                  </TableBody>
               </Table>

                {/* Pagination UI */}
                <div className="border-t border-gray-50 p-6 flex justify-between items-center bg-gray-50/10">
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      className="font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white border border-transparent disabled:opacity-30"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                   >
                      Previous
                   </Button>
                   <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Page {currentPage} of {totalPages || 1}
                   </div>
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      className="font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-white border border-transparent disabled:opacity-30"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                   >
                      Next
                   </Button>
                </div>
            </Card>
         </div>

         <Dialog open={isVitalsOpen} onOpenChange={setIsVitalsOpen}>
            <DialogContent className="max-w-md rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white z-[100]">
               <div className="bg-blue-600 p-10 text-white relative">
                  <DialogHeader>
                     <DialogTitle className="text-2xl font-black tracking-tight leading-none">Record Vitals</DialogTitle>
                     <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">Patient: {activeVisit?.patient?.name || "Patient"}</p>
                  </DialogHeader>
               </div>
               <div className="p-10 space-y-10">
                  <form onSubmit={handleManualVitals} className="space-y-6">
                     <div className="flex flex-col items-center justify-center p-8 bg-blue-50/50 rounded-[2.5rem] gap-5 border border-blue-100/50 mb-4">
                        <p className="text-[10px] uppercase font-black text-blue-500 tracking-[0.3em]">AI Voice Assistant</p>
                        <VoiceMicButton
                           visitId={activeVisit?.id}
                           endpoint="/vitals"
                           onExtractionSuccess={(v) => { setManualVitals({ bp: v.bp, pulse: v.pulse, temp: v.temperature, weight: v.weight, height: v.height }); }}
                           voiceEnabled={voiceEnabled}
                        />
                        <p className="text-[11px] text-gray-400 font-bold italic text-center px-4 leading-relaxed">"BP 120 over 80, pulse 75, temperature 98.6"</p>
                     </div>

                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Blood Pressure</Label>
                           <Input className="rounded-2xl bg-gray-50 border-gray-100 h-14 font-black text-gray-700 px-6 text-sm" value={manualVitals.bp} onChange={e => setManualVitals({ ...manualVitals, bp: e.target.value })} placeholder="120/80" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Pulse Rate</Label>
                           <Input className="rounded-2xl bg-gray-50 border-gray-100 h-14 font-black text-gray-700 px-6 text-sm" value={manualVitals.pulse} onChange={e => setManualVitals({ ...manualVitals, pulse: e.target.value })} placeholder="72 BPM" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Temp (°F)</Label>
                           <Input className="rounded-2xl bg-gray-50 border-gray-100 h-14 font-black text-gray-700 px-6 text-sm" value={manualVitals.temp} onChange={e => setManualVitals({ ...manualVitals, temp: e.target.value })} placeholder="98.4 °F" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Weight (KG)</Label>
                           <Input className="rounded-2xl bg-gray-50 border-gray-100 h-14 font-black text-gray-700 px-6 text-sm" value={manualVitals.weight} onChange={e => setManualVitals({ ...manualVitals, weight: e.target.value })} placeholder="70 KG" />
                        </div>
                     </div>
                     <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 mt-4">Safe Data Record</Button>
                     <Button type="button" variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-300" onClick={() => setIsVitalsOpen(false)}>Cancel Update</Button>
                  </form>
               </div>
            </DialogContent>
         </Dialog>

         <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DialogContent className="max-w-md rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white z-[100]">
               <div className="bg-purple-600 p-10 text-white relative">
                  <DialogTitle className="text-2xl font-black tracking-tight leading-none">Resource Allocation</DialogTitle>
                  <p className="text-purple-100 text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">Assign Physician to Visit</p>
               </div>
               <div className="p-10 space-y-8">
                  <form onSubmit={handleAssignDoctor} className="space-y-6">
                     <div className="flex flex-col items-center justify-center p-8 bg-purple-50/50 rounded-[2.5rem] gap-5 border border-purple-100/50 mb-4">
                        <p className="text-[10px] uppercase font-black text-purple-500 tracking-[0.3em]">AI Selection</p>
                        <VoiceMicButton
                           endpoint="/staff/doctors"
                           onExtractionSuccess={(d) => { if (d.id) setSelectedDoctor(d.id); else if (d.name) { const found = doctors.find(doc => (doc.name || "").toLowerCase().includes(d.name.toLowerCase())); if (found) setSelectedDoctor(found.id); } }}
                           voiceEnabled={voiceEnabled}
                        />
                        <p className="text-[11px] text-gray-400 font-bold italic text-center px-4 leading-relaxed">"Assign to Doctor Sharma"</p>
                     </div>

                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Select Physician</Label>
                        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                           <SelectTrigger className="h-16 rounded-[1.5rem] bg-gray-50 border-gray-100 font-black text-gray-700 px-6 shadow-none">
                              <SelectValue placeholder="Choose doctor..." />
                           </SelectTrigger>
                           <SelectContent className="rounded-[1.5rem] border-gray-100 shadow-2xl p-3 bg-white">
                              {doctors.map(d => (
                                 <SelectItem key={d.id} value={d.id} className="rounded-xl py-4 font-black text-sm px-6">Dr. {d.name} ({(d.specialization || "General")})</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-16 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-100">Confirm Appointment</Button>
                     <Button type="button" variant="ghost" className="w-full h-10 text-[9px] font-black uppercase tracking-widest text-gray-300" onClick={() => setIsAssignOpen(false)}>Cancel Allocation</Button>
                  </form>
               </div>
            </DialogContent>
         </Dialog>

         {selectedVisit && (
            <div style={{
               position: "fixed",
               right: 0,
               top: 0,
               width: "420px",
               height: "100%",
               background: "white",
               zIndex: 1000,
               padding: "30px",
               overflow: "auto",
               boxShadow: "-10px 0 30px rgba(0,0,0,0.1)",
               borderLeft: "1px solid #eee"
            }}>
               <h2 className="text-2xl font-black mb-4 tracking-tight">Visit Profile</h2>

               <div className="bg-gray-50 p-5 rounded-xl mb-6 shadow-none border border-gray-100">
                  <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-3">Patient Info</h3>
                  <p className="font-black text-gray-900 text-sm">{selectedVisit?.patient?.name || "Patient"}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                     Age: {new Date().getFullYear() - (new Date(selectedVisit?.patient?.dateOfBirth || Date.now()).getFullYear() || 1990)} | Gender: {(selectedVisit?.patient?.gender || "MALE").toLowerCase()}
                     {selectedVisit?.patient?.bloodGroup && ` | Blood: ${selectedVisit.patient.bloodGroup}`}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-1">
                     {selectedVisit?.vitals?.height && `Height: ${selectedVisit.vitals.height} cm`}
                     {selectedVisit?.vitals?.height && selectedVisit?.appointmentTime && ' | '}
                     {selectedVisit?.appointmentTime && `Slot: ${new Date(selectedVisit.appointmentTime).toLocaleString()}`}
                  </p>

                   <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">Patient Identity</h3>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">UHID Number</Label>
                            <Input placeholder="Enter UHID..." value={uhid} onChange={(e) => setUhid(e.target.value)} className="h-10 text-xs font-bold bg-gray-50 border-gray-100 w-full rounded-xl" />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">ABHA ID</Label>
                            <Input placeholder="Enter ABHA..." value={abha} onChange={(e) => setAbha(e.target.value)} className="h-10 text-xs font-bold bg-gray-50 border-gray-100 w-full rounded-xl" />
                         </div>
                         <Button onClick={async () => {
                            try {
                               await api.patch(`/api/visits/${selectedVisit.id}/patient-identity`, { uhid, abha });
                               toast({ title: "Identity Updated", description: "UHID and ABHA successfully saved." });
                               loadData(true);
                            } catch (err) {
                               toast({ title: "Sync Failed", variant: "destructive" });
                            }
                         }} size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 h-10 text-[9px] font-black uppercase tracking-widest rounded-xl">Save Identity</Button>
                      </div>
                   </div>

                   <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">Symptoms</h3>
                      <p className="text-sm font-bold text-gray-700">{selectedVisit?.notes || "-"}</p>
                   </div>
                </div>



<div className="mb-6 pt-2 border-t border-gray-100">
                  <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest mb-4 mt-4">Vitals Tracking</h3>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Blood Pressure</Label>
                        <div className="flex gap-2">
                           <Input placeholder="120/80" value={manualVitals.bp} onChange={(e) => setManualVitals({ ...manualVitals, bp: e.target.value })} className="h-12 text-sm font-bold bg-gray-50 border-gray-100 flex-1" />
                           <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "vital_bp")} voiceEnabled={voiceEnabled} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Pulse</Label>
                        <div className="flex gap-2">
                           <Input placeholder="72" value={manualVitals.pulse} onChange={(e) => setManualVitals({ ...manualVitals, pulse: e.target.value })} className="h-12 text-sm font-bold bg-gray-50 border-gray-100 flex-1" />
                           <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "vital_pulse")} voiceEnabled={voiceEnabled} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Temperature</Label>
                        <div className="flex gap-2">
                           <Input placeholder="98.6" value={manualVitals.temp} onChange={(e) => setManualVitals({ ...manualVitals, temp: e.target.value })} className="h-12 text-sm font-bold bg-gray-50 border-gray-100 flex-1" />
                           <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "vital_temperature")} voiceEnabled={voiceEnabled} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Weight</Label>
                        <div className="flex gap-2">
                           <Input placeholder="70" value={manualVitals.weight} onChange={(e) => setManualVitals({ ...manualVitals, weight: e.target.value })} className="h-12 text-sm font-bold bg-gray-50 border-gray-100 flex-1" />
                           <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "vital_weight")} voiceEnabled={voiceEnabled} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">Height (cm)</Label>
                        <div className="flex gap-2">
                           <Input placeholder="175" value={manualVitals.height} onChange={(e) => setManualVitals({ ...manualVitals, height: e.target.value })} className="h-12 text-sm font-bold bg-gray-50 border-gray-100 flex-1" />
                           <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "vital_height")} voiceEnabled={voiceEnabled} />
                        </div>
                     </div>
                  </div>
                  <Button onClick={handleSheetVitals} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 rounded-xl">Save Vitals</Button>
               </div>

               <div className="mb-6 pt-6 border-t border-gray-100">
                  <h3 className="font-black text-xs text-gray-500 uppercase tracking-widest mb-4">Doctor Assignment</h3>
                  <div className="space-y-3">
                     <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <div className="relative z-50">
                           <SelectTrigger className="h-12 rounded-xl text-sm font-bold bg-gray-50 border-gray-100 shadow-none">
                              <SelectValue placeholder="Choose doctor..." />
                           </SelectTrigger>
                        </div>
                        <SelectContent position="popper" className="z-[99999] rounded-xl border-gray-100 shadow-2xl bg-white p-2">
                           {loadingDoctors ? (
                              <div className="p-2 text-sm text-gray-400">Loading doctors...</div>
                           ) : doctors && doctors.length > 0 ? (
                              doctors.map((doc) => (
                                 <SelectItem key={doc.id} value={doc.id} className="text-sm font-bold py-3 px-4 rounded-lg">
                                    Dr. {doc.name || doc.email || "Doctor"}
                                 </SelectItem>
                              ))
                           ) : (
                              <div className="p-2 text-sm text-gray-400">No doctors available</div>
                           )}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button onClick={handleSheetAssign} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 h-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-purple-100 rounded-xl">Assign Doctor</Button>
               </div>

               <div className="mt-8 mb-10 border-t border-gray-100 flex justify-center pt-8">
                  <Button variant="ghost" onClick={() => setSelectedVisit(null)} className="h-10 text-[10px] font-black uppercase tracking-widest text-gray-300 w-full rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors">
                     Close Detail View
                  </Button>
               </div>
            </div>
         )}
      </div>
   )
}
