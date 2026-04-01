import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { Search, Plus, Activity, Printer, HeartPulse, CalendarDays } from "lucide-react"
import api from "@/services/api"
import { Badge } from "@/components/ui/badge"

export default function PatientRecordsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVisit, setSelectedVisit] = useState(null)
  const { toast } = useToast()

  const loadVisits = async () => {
    try {
      console.log("[PatientRecordsPage] Loading visits...")
      const res = await api.get("/api/visits")
      setVisits(res.data || [])
      console.log("[PatientRecordsPage] Loaded", (res.data || []).length, "visits")
    } catch (err) {
      console.error("[PatientRecordsPage] Error loading visits:", err)
      toast({ title: "Error", description: "Failed to load visit history", variant: "destructive" })
    }
  }

  useEffect(() => { loadVisits() }, [])

  const filteredVisits = visits.filter(v => {
     const patientName = v.patient?.name || ""
     const notes = v.notes || ""
     const diagnosis = v.consultation?.diagnosis || ""
     const raw = (patientName + " " + notes + " " + diagnosis).toLowerCase()
     return raw.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto mt-4 px-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100/50">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
              <Activity className="text-blue-600 w-8 h-8"/>
           </div>
           <div>
              <h2 className="text-3xl font-black tracking-tighter text-gray-900 leading-none">My Visit Records</h2>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-2 ml-1 opacity-70">Medical Consultation Dashboard</p>
           </div>
        </div>
        <div className="flex items-center gap-5">
           <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Session Data</span>
              <div className="bg-gray-50 text-gray-900 text-xs font-black uppercase tracking-widest px-5 py-2 rounded-full border border-gray-100 shadow-inner">
                 {visits.length} Total Visits
              </div>
           </div>
           
            <Button 
              type="button"
              onClick={() => {
                 console.log("[PatientRecordsPage] Navigating to /patient/create-visit");
                 navigate("/patient/create-visit");
              }}
              className="bg-blue-600 hover:bg-blue-700 h-14 px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] flex items-center gap-3 shadow-xl shadow-blue-100 transition-all hover:scale-105"
            >
               <Plus className="w-5 h-5" /> Book New Visit
            </Button>
         </div>
       </div>

      {/* DASHBOARD LIST */}
      <Card className="shadow-sm border-gray-100 rounded-[2.5rem] overflow-hidden bg-white">
         <CardContent className="p-0">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between px-10 bg-white">
               <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                  <Input 
                     placeholder="Search history by symptoms or diagnosis..." 
                     className="pl-12 bg-gray-50/50 border-gray-100 h-12 rounded-2xl focus-visible:ring-1 font-bold text-sm"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

            </div>
            <Table>
               <TableHeader className="bg-gray-50/20">
                 <TableRow className="hover:bg-transparent border-gray-50 h-14">
                   <TableHead className="w-[140px] text-[10px] font-black text-gray-400 uppercase tracking-widest pl-10">DATE</TableHead>
                   <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DIAGNOSIS / REASON</TableHead>
                   <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MEDICINES</TableHead>
                   <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right pr-10">STATUS</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {(filteredVisits || []).map(v => (
                   <TableRow 
                      key={v.id} 
                      className="cursor-pointer hover:bg-blue-50/30 transition-colors border-gray-50 h-24 group"
                      onClick={() => setSelectedVisit(v)}
                   >
                     <TableCell className="pl-10">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                              <CalendarDays className="w-5 h-5 text-gray-400" />
                           </div>
                           <div className="flex flex-col">
                              <span className="font-black text-gray-900 text-sm">{new Date(v.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">{new Date(v.createdAt).getFullYear()}</span>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex flex-col">
                           <span className="font-black text-gray-800 text-sm max-w-[400px] truncate">{v.consultation?.diagnosis || v.notes || "General Consultation"}</span>
                           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter opacity-60 mt-1">Problem: {v.notes || "Not specified"}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <Badge className="bg-blue-50 text-blue-500 rounded-lg font-black text-[9px] px-3 py-1 border-none shadow-sm uppercase">
                              {(v.consultation?.prescription?.items?.length) || 0} Medications
                           </Badge>
                        </div>
                     </TableCell>
                     <TableCell className="text-right pr-10">
                        <Badge className={`rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-widest border-none shadow-sm ${
                           v.status === 'WAITING' ? 'bg-orange-100 text-orange-600' :
                           v.status === 'COMPLETED' || v.status === 'CONSULTED' || v.status === 'PRESCRIPTION_COMPLETED' ? 'bg-green-100 text-green-600' :
                           'bg-blue-100 text-blue-600'
                        }`}>
                           {(v.status || "").replace(/_/g, ' ')}
                        </Badge>
                     </TableCell>
                   </TableRow>
                 ))}
                 {filteredVisits.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} className="text-center text-gray-300 font-black py-32 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center opacity-30">
                           <Activity className="w-10 h-10" />
                        </div>
                        <p className="uppercase tracking-[0.2em] text-[10px]">You have no visit records yet.</p>
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
            </Table>
         </CardContent>
      </Card>

      {/* Side Panel for Visit Details */}
      <Sheet open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
         <SheetContent className="sm:max-w-xl overflow-y-auto bg-gray-50 p-0 border-l-0 shadow-2xl z-[150]">
            {selectedVisit && (
               <div className="flex flex-col h-full bg-white">
                  <div className="flex items-center justify-between p-10 border-b pb-8 bg-white sticky top-0 z-10">
                     <div>
                        <SheetTitle className="text-2xl font-black tracking-tight">Clinical History</SheetTitle>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Appointment Identity: #{selectedVisit.id?.slice(-8).toUpperCase()}</p>
                     </div>
                     <Button type="button" variant="outline" className="gap-3 rounded-2xl h-12 font-black px-8 border-gray-100 shadow-sm text-[10px] uppercase tracking-widest hover:bg-gray-50" onClick={()=>navigate('/print/' + selectedVisit.id)}>
                        <Printer className="w-4 h-4" /> Print Record
                     </Button>
                  </div>

                  <div className="p-10 space-y-12 pb-32">
                     <div>
                        <h4 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em] mb-6 ml-1">Vitals Summary</h4>
                        {selectedVisit.vitals ? (
                           <div className="grid grid-cols-2 gap-6">
                              <div className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-100 bg-red-50/30">
                                 <HeartPulse className="text-red-500 w-10 h-10 opacity-30" />
                                 <div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">BP</div><div className="font-black text-xl text-gray-900">{selectedVisit.vitals.bloodPressure || "-"} <span className="text-[10px] text-gray-300 font-normal">mmHg</span></div></div>
                              </div>
                              <div className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-100 bg-pink-50/30">
                                 <Activity className="text-pink-500 w-10 h-10 opacity-30" />
                                 <div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pulse</div><div className="font-black text-xl text-gray-900">{selectedVisit.vitals.pulse || "-"} <span className="text-[10px] text-gray-300 font-normal">bpm</span></div></div>
                              </div>
                              <div className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-100 bg-orange-50/30">
                                 <div className="text-orange-400 text-3xl font-black w-10 text-center opacity-30">°</div>
                                 <div className="flex-1"><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Temp</div><div className="font-black text-xl text-gray-900">{selectedVisit.vitals.temperature || "-"} <span className="text-[10px] text-gray-300 font-normal">°F</span></div></div>
                              </div>
                              <div className="flex items-center gap-5 p-6 rounded-[2rem] border border-gray-100 bg-blue-50/30">
                                 <Activity className="text-blue-400 w-10 h-10 opacity-30" />
                                 <div className="flex-1"><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Weight</div><div className="font-black text-xl text-gray-900">{selectedVisit.vitals.weight || "-"} <span className="text-[10px] text-gray-300 font-normal">kg</span></div></div>
                              </div>
                           </div>
                        ) : (
                           <div className="text-[10px] font-black text-gray-300 uppercase italic p-10 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 text-center tracking-widest leading-loose">No vitals were recorded for this session.</div>
                        )}
                     </div>

                     <div className="space-y-8">
                        <div className="relative">
                           <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mb-4 ml-1">Initial Complaint</div>
                           <div className="text-[13px] font-bold text-gray-700 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-50 leading-relaxed shadow-inner">{selectedVisit.notes || "-"}</div>
                        </div>
                        {selectedVisit.consultation?.diagnosis && (
                           <div className="relative">
                              <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-4 ml-1">Medical Diagnosis</div>
                              <div className="text-[13px] font-black text-blue-900 bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100 leading-relaxed shadow-sm">{(selectedVisit.consultation.diagnosis || "")}</div>
                           </div>
                        )}
                     </div>

                     {selectedVisit.consultation?.prescription?.items && selectedVisit.consultation.prescription.items.length > 0 && (
                        <div>
                           <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mb-6 ml-1">Meds Prescribed</h4>
                           <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm bg-white">
                              <Table>
                                 <TableHeader className="bg-gray-50/50">
                                    <TableRow className="hover:bg-transparent border-gray-50">
                                       <TableHead className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-10 h-12">Medicine</TableHead>
                                       <TableHead className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dosage</TableHead>
                                       <TableHead className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center pr-10">Timing</TableHead>
                                    </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                    {selectedVisit.consultation.prescription.items.map((m, idx) => (
                                       <TableRow key={idx} className="border-gray-50 bg-white hover:bg-gray-50/30 h-20 transition-all">
                                          <TableCell className="pl-10">
                                             <div className="font-black text-sm text-gray-900 leading-none">{m.medicineName || ""}</div>
                                             <div className="text-[10px] text-gray-400 font-bold mt-2 opacity-70 tracking-tight">{m.instructions || m.frequency || ""}</div>
                                          </TableCell>
                                          <TableCell>
                                             <div className="font-black text-[13px] text-gray-600">{m.dosage || "-"}</div>
                                          </TableCell>
                                          <TableCell className="text-center pr-10">
                                             <div className="inline-flex gap-1 text-[11px] font-black font-mono text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100/50 shadow-inner">
                                                {m.dosageMorning || 0}-{m.dosageAfternoon || 0}-{m.dosageNight || 0}
                                             </div>
                                          </TableCell>
                                       </TableRow>
                                    ))}
                                 </TableBody>
                              </Table>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </SheetContent>
      </Sheet>
    </div>
  )
}
