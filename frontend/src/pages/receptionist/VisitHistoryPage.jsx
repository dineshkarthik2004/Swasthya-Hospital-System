import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, Search, ChevronLeft, ChevronRight } from "lucide-react"
import api from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function VisitHistoryPage() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const navigate = useNavigate()
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const vRes = await api.get("/api/visits")
      setVisits(vRes.data)
    } catch {
      toast({ title: "Error", description: "Failed to load visit history", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredVisits = (visits || []).filter(v => {
     // Search filter
     const name = (v.patient?.name || "").toLowerCase()
     const phone = (v.patient?.phone || "").toLowerCase()
     const s = search.toLowerCase()
     const matchesSearch = name.includes(s) || phone.includes(s)
      
      // Only show completed visits in history
      const historyStatuses = ["PAYMENT_COLLECTED", "PRESCRIPTION_COMPLETED", "CONSULTED", "COMPLETED"]
      const matchesStatus = historyStatuses.includes(v.status)
     
     // Date range filter
     if (dateRange.start && dateRange.end) {
        const vDate = new Date(v.createdAt);
        vDate.setHours(0,0,0,0);
        const start = new Date(dateRange.start);
        start.setHours(0,0,0,0);
        const end = new Date(dateRange.end);
        end.setHours(0,0,0,0);
        return matchesSearch && matchesStatus && (vDate >= start && vDate <= end);
     }
     
     return matchesSearch && matchesStatus;
  })

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
        <h1 className="text-2xl font-black tracking-tight text-gray-900">Visit History</h1>
        
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
             <Calendar className="w-4 h-4 text-blue-500" /> 
             <input 
               type="date" 
               className="bg-transparent border-none text-xs font-bold text-gray-600 focus:outline-none" 
               value={dateRange.start}
               onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
             />
             <span className="text-gray-300 mx-1 font-black">─</span>
             <input 
               type="date" 
               className="bg-transparent border-none text-xs font-bold text-gray-600 focus:outline-none" 
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
           
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               className="pl-9 pr-4 rounded-xl border border-gray-100 bg-white h-10 text-xs font-bold shadow-sm w-48 focus:ring-1 focus:ring-blue-100 outline-none" 
               placeholder="Patient Search..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-3xl p-0 overflow-hidden bg-white">
         <Table>
            <TableHeader className="bg-white">
               <TableRow className="hover:bg-transparent border-gray-50 h-16">
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800 pl-8">Visit ID</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Patient</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Patient Number</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Doctor</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Vitals</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Status</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Fee Type</TableHead>
                 <TableHead className="font-bold text-[11px] uppercase tracking-widest text-gray-800">Payment</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {(filteredVisits || []).map(v => (
                 <TableRow 
                    key={v.id} 
                    className={`transition-colors border-gray-50 h-14 ${['COMPLETED', 'PRESCRIPTION_COMPLETED', 'CONSULTED'].includes(v.status) ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                    onClick={() => {
                       if ((v.paymentStatus || "").toUpperCase() === "PAID") {
                          navigate(`/print/${v.id}`)
                       } else {
                          alert("Payment not done");
                       }
                    }}
                 >
                   <TableCell className="font-bold text-gray-400 text-[10px] pl-8">#{v.id?.slice(-8)}</TableCell>
                   <TableCell className="font-bold text-gray-900 text-sm">{v.patient?.name}</TableCell>
                   <TableCell className="font-bold text-gray-500 text-sm">{v.patient?.phone || "--"}</TableCell>
                   <TableCell className="font-bold text-gray-500 text-sm">
                      {v.doctor?.name ? `Dr. ${v.doctor.name}` : "--"}
                   </TableCell>
                   <TableCell className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                      {v.vitals ? `BP: ${v.vitals.bloodPressure} | Wt: ${v.vitals.weight}` : "--"}
                   </TableCell>
                   <TableCell>
                      <Badge className={`rounded-full px-3 py-0.5 font-black text-[10px] uppercase tracking-widest border-none ${
                        v.status === 'PRESCRIPTION_COMPLETED' || v.status === 'CONSULTED' ? 'bg-blue-600 text-white' : 'bg-[#F1F3F9] text-gray-600'
                      }`}>
                         {v.status === 'PRESCRIPTION_COMPLETED' ? 'Completed' : v.status}
                      </Badge>
                   </TableCell>
                   <TableCell className="text-gray-400 font-bold text-sm">
                      {v.feeType || "--"}
                   </TableCell>
                   <TableCell>
                      <Badge className={`rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase border-none ${
                        v.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                      }`}>
                         {v.paymentStatus || 'UNPAID'}
                      </Badge>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredVisits.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-32 text-gray-300 font-bold flex flex-col items-center gap-4">
                     <Calendar className="w-12 h-12 opacity-10" />
                     <p className="uppercase tracking-[0.2em] text-[10px] opacity-70">No history records matching your filter.</p>
                  </TableCell></TableRow>
               )}
            </TableBody>
         </Table>

         <div className="border-t border-gray-50 p-6 flex justify-between items-center bg-white">
            <Button variant="ghost" size="sm" className="font-bold text-gray-400 gap-1 hover:text-gray-900 border border-transparent"><ChevronLeft className="w-4 h-4"/> Previous</Button>
            <div className="text-sm font-bold text-gray-800 uppercase tracking-widest text-[10px]">Page 1 / {Math.ceil(filteredVisits.length / 10) || 1}</div>
            <Button variant="ghost" size="sm" className="font-bold text-gray-400 gap-1 hover:text-gray-900 border border-transparent">Next <ChevronRight className="w-4 h-4"/></Button>
         </div>
      </Card>
    </div>
  )
}
