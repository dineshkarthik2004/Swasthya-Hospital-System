import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Users, ChevronDown, MoreHorizontal, Copy, History, LayoutGrid, Filter } from "lucide-react"
import api from "@/services/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { VoiceMicButton } from "@/components/VoiceMicButton"

import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"

export default function PatientDirectoryPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const vRes = await api.get("/api/patients")
      setPatients(vRes.data || [])
    } catch {
      toast({ title: "Error", description: "Failed to load patients list", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p => 
     ((p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.phone || "").includes(searchQuery))
  )

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    api.get("/api/settings/public")
       .then(res => {
          const settings = res.data || []
          const s = settings.find(item => item.key === "receptionist_voice_enabled")
          setVoiceEnabled(s ? s.value === 'true' : true)
       })
       .catch(() => setVoiceEnabled(true))
  }, [])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: "Patient ID copied to clipboard." })
  }

  if (loading) return (
       <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Directory...</p>
       </div>
  )

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-6 py-8 pb-32">
      <div className="flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Patients Directory</h1>
            <p className="text-gray-400 text-sm font-medium mt-3 opacity-80">View and search all registered patients in this branch.</p>
         </div>
         <Button 
            onClick={() => navigate("/receptionist/create-visit")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
         >
            <Plus className="w-5 h-5" /> Add New Visit
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] flex items-center justify-between group transition-all hover:ring-1 hover:ring-blue-100">
            <div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Patients</div>
               <div className="text-5xl font-black text-gray-900 leading-none">{patients.length}</div>
            </div>
            <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl group-hover:scale-110 transition-transform"><Users className="w-6 h-6"/></div>
         </Card>
         <Card className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] flex items-center justify-between group transition-all hover:ring-1 hover:ring-blue-100">
            <div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Male</div>
               <div className="text-5xl font-black text-gray-900 leading-none">{patients.filter(p=>p.gender==='MALE').length}</div>
            </div>
            <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl group-hover:scale-110 transition-transform"><div className="text-2xl font-black">♂</div></div>
         </Card>
         <Card className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] flex items-center justify-between group transition-all hover:ring-1 hover:ring-pink-100">
            <div>
               <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Total Female</div>
               <div className="text-5xl font-black text-gray-900 leading-none">{patients.filter(p=>p.gender==='FEMALE').length}</div>
            </div>
            <div className="p-4 bg-pink-50 text-pink-500 rounded-3xl group-hover:scale-110 transition-transform"><div className="text-2xl font-black">♀</div></div>
         </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm rounded-[2.5rem] p-0 overflow-hidden bg-white">
         <div className="p-6 border-b border-gray-50 flex items-center justify-between px-10">
            <div className="relative w-full max-w-sm flex items-center gap-2">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <Input 
                    className="pl-12 h-12 rounded-2xl border-none bg-gray-50/50 font-bold text-sm focus-visible:ring-1" 
                    placeholder="Search by name or phone..." 
                    value={searchQuery}
                    onChange={e=>setSearchQuery(e.target.value)}
                  />
               </div>
               <VoiceMicButton endpoint="/vitals" onExtractionSuccess={(d) => setSearchQuery(d.name || d.patientName || "")} small voiceEnabled={voiceEnabled} />
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-white cursor-pointer transition-all shadow-inner">
                  Columns <ChevronDown className="w-3 h-3" />
               </div>
            </div>
         </div>

         <Table>
            <TableHeader className="bg-gray-50/10">
               <TableRow className="hover:bg-transparent border-gray-50 h-16">
                 <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 pl-12 h-12">Name</TableHead>
                 <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Phone</TableHead>
                 <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Blood Group</TableHead>
                 <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400">Registered</TableHead>
                 <TableHead className="w-10 text-right pr-12"></TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {(filteredPatients || []).map(p => (
                 <TableRow key={p.id} className="hover:bg-gray-50/50 transition-all border-gray-50 h-24 group">
                   <TableCell className="pl-12">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 font-black text-[11px] flex items-center justify-center uppercase shadow-inner border border-white transition-all group-hover:scale-110">
                            {(p.name || 'P').split(' ').map(n=>n[0]).join('').slice(0, 2)}
                         </div>
                         <span className="font-black text-gray-900 text-sm">{p.name || "Patient"}</span>
                      </div>
                   </TableCell>
                   <TableCell className="font-bold text-gray-600 text-sm">
                      {p.phone || "--"}
                   </TableCell>
                   <TableCell className="font-black text-gray-400 text-[10px] uppercase tracking-widest">
                      {p.bloodGroup || "--"}
                   </TableCell>
                   <TableCell className="font-black text-gray-400 text-[10px] uppercase tracking-widest">
                      {new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', { day:'numeric', month:'numeric', year:'numeric' })}
                   </TableCell>
                   <TableCell className="text-right pr-12">
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-sm text-gray-400"><MoreHorizontal className="w-5 h-5"/></Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-56 rounded-3xl border-gray-100 shadow-2xl p-3 bg-white z-[150]">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 px-4 py-2">Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-4 py-4 cursor-pointer focus:bg-blue-50 focus:text-blue-600"
                              onClick={() => copyToClipboard(`PID-${(p.id || "").slice(-8).toUpperCase()}`)}
                            >
                               <Copy className="w-5 h-5" /> Copy Patient ID
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-4 py-4 cursor-pointer focus:bg-blue-50 focus:text-blue-600">
                               <History className="w-5 h-5" /> View History
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </TableCell>
                 </TableRow>
               ))}
               {filteredPatients.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-32 text-gray-300 font-black uppercase tracking-widest text-[10px] opacity-50">No patient records found in directory</TableCell></TableRow>
               )}
            </TableBody>
         </Table>

         <div className="p-8 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-12 bg-gray-50/10 border-t border-gray-50">
            <div className="opacity-70">Showing {filteredPatients.length} of {patients.length} patients.</div>
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-3">
                  Rows per page 
                  <div className="flex items-center gap-2 border border-gray-100 px-4 py-2 rounded-2xl text-gray-900 bg-white shadow-inner cursor-pointer">5 <ChevronDown className="w-3 h-3 text-gray-400"/></div>
               </div>
               <div className="flex items-center gap-6">
                  Page 1 of 1
                  <div className="flex gap-2">
                     <div className="p-2.5 border border-gray-100 rounded-2xl bg-white text-gray-300 hover:text-gray-900 transition-colors cursor-pointer shadow-sm"><ChevronDown className="w-4 h-4 rotate-90"/></div>
                     <div className="p-2.5 border border-gray-100 rounded-2xl bg-white text-gray-300 hover:text-gray-900 transition-colors cursor-pointer shadow-sm"><ChevronDown className="w-4 h-4 -rotate-90"/></div>
                  </div>
               </div>
            </div>
         </div>
      </Card>
    </div>
  )
}
