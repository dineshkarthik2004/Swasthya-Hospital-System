import { useState, useEffect } from "react"
import { Users, Search, MoreHorizontal, Eye, Trash2, Calendar, MapPin, Phone, Mail } from "lucide-react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PatientManagement() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/api/admin/patients")
        setPatients(res.data)
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  )

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Patient Population</h1>
          <p className="text-gray-500 font-medium">Global database of registered patients across the network.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                 placeholder="Search by name, UHID or phone..." 
                 className="pl-12 h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Patient</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Registration</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identities</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">Scanning database...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">No patients found.</td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm border border-white shadow-sm">
                             {p.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-gray-900 tracking-tight">{p.name}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{p.gender || "UNSPECIFIED"} • {p.bloodGroup || "N/A"}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                             <Phone className="w-3 h-3" /> {p.phone}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                             <Mail className="w-3 h-3" /> {p.email || "N/A"}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                          <Calendar className="w-4 h-4 text-gray-300" />
                          {new Date(p.createdAt).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          {p.uhid && <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-wider">UHID: {p.uhid}</span>}
                          {p.abha && <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase tracking-wider">ABHA: {p.abha}</span>}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex gap-2">
                          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100">
                             <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-red-600 border border-transparent hover:border-gray-100">
                             <Trash2 className="w-4 h-4" />
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
