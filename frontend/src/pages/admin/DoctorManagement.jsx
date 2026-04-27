import { useState, useEffect } from "react"
import { Stethoscope, Search, Filter, Shield, MoreHorizontal, UserCheck, UserX, Building2, Mail, Phone, MapPin } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/api/admin/doctors")
        setDoctors(res.data)
      } catch (error) {
        console.error("Error fetching doctors:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Medical Staff</h1>
          <p className="text-gray-500 font-medium">Registry of authorized healthcare professionals in the system.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                 placeholder="Search by name or specialty..." 
                 className="pl-12 h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-3">
              <Button variant="outline" className="h-14 px-6 rounded-2xl border-gray-100 font-black uppercase tracking-widest text-[10px] text-gray-500">
                 <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Practitioner</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Affiliation</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">Warming up registry...</td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">No practitioners found matching your criteria.</td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-white shadow-sm">
                             {doc.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-gray-900 tracking-tight">{doc.name}</span>
                             <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{doc.specialization || "General Medicine"}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-300" />
                          <span className="text-sm font-bold text-gray-600">{doc.hospital?.name || doc.clinicName || "Independent"}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                             <Mail className="w-3 h-3" /> {doc.email}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                             <Phone className="w-3 h-3" /> {doc.phone || "N/A"}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${doc.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${doc.isActive ? "bg-emerald-500" : "bg-red-500"}`}></div>
                          {doc.isActive ? "Active" : "Suspended"}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex gap-2">
                          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100">
                             <Shield className="w-4 h-4" />
                          </button>
                          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100">
                             <MoreHorizontal className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
