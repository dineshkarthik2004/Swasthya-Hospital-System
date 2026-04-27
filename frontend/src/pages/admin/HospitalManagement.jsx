import { useState, useEffect } from "react"
import { Building2, Plus, Edit2, Trash2, Search, X, Check, Globe, Shield, Phone, Mail } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    serviceFee: 0,
    featuresEnabled: "[]"
  })

  const fetchHospitals = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await axios.get(`${API_URL}/api/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHospitals(res.data)
    } catch (error) {
      console.error("Error fetching hospitals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      if (editingHospital) {
        await axios.put(`${API_URL}/api/admin/hospitals/${editingHospital.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/api/admin/hospitals`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setIsModalOpen(false)
      setEditingHospital(null)
      setFormData({ name: "", email: "", phone: "", address: "", serviceFee: 0, featuresEnabled: "[]" })
      fetchHospitals()
    } catch (error) {
      console.error("Error saving hospital:", error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return
    try {
      const token = localStorage.getItem("token")
      await axios.delete(`${API_URL}/api/admin/hospitals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchHospitals()
    } catch (error) {
      console.error("Error deleting hospital:", error)
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hospital Network</h1>
          <p className="text-gray-500 font-medium">Manage affiliated healthcare institutions and their access.</p>
        </div>
        <Button 
          onClick={() => { setEditingHospital(null); setFormData({ name: "", email: "", phone: "", address: "", serviceFee: 0, featuresEnabled: "[]" }); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enlist New Hospital
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-64 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={() => { setEditingHospital(hospital); setFormData(hospital); setIsModalOpen(true); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                     <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(hospital.id)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>

               <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                  <Building2 className="w-8 h-8" />
               </div>

               <h3 className="text-xl font-black text-gray-900 tracking-tight mb-4">{hospital.name}</h3>
               
               <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
                     <Mail className="w-4 h-4 text-gray-300" /> {hospital.email || "No email provided"}
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
                     <Phone className="w-4 h-4 text-gray-300" /> {hospital.phone || "No phone provided"}
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
                     <Globe className="w-4 h-4 text-gray-300" /> {hospital.address || "Address not set"}
                  </div>
               </div>

               <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Fee</span>
                     <span className="text-lg font-black text-indigo-600 tracking-tighter">{hospital.serviceFee}%</span>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${hospital.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                     {hospital.subscriptionStatus}
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editingHospital ? "Modify Hospital" : "Enlist Institution"}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                 </button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Institution Name</label>
                       <Input 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="e.g. City General Hospital"
                          className="h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                          required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Contact Email</label>
                       <Input 
                          type="email"
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          placeholder="admin@hospital.com"
                          className="h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                       <Input 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          placeholder="+1 (555) 000-0000"
                          className="h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Service Fee (%)</label>
                       <Input 
                          type="number"
                          value={formData.serviceFee} 
                          onChange={e => setFormData({...formData, serviceFee: e.target.value})} 
                          placeholder="0.00"
                          className="h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Physical Address</label>
                    <Input 
                       value={formData.address} 
                       onChange={e => setFormData({...formData, address: e.target.value})} 
                       placeholder="123 Medical Plaza, Health City"
                       className="h-14 rounded-2xl border-gray-100 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                    />
                 </div>
                 
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Enabled Features</label>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { id: "ml_diagnosis", label: "ML Diagnosis" },
                         { id: "voice_to_text", label: "Voice Processing" },
                         { id: "analytics", label: "Advanced Analytics" },
                         { id: "patient_portal", label: "Patient Portal" }
                       ].map(feature => {
                         const currentFeatures = JSON.parse(formData.featuresEnabled || "[]");
                         const isChecked = currentFeatures.includes(feature.id);
                         
                         return (
                           <div 
                             key={feature.id} 
                             onClick={() => {
                               const nextFeatures = isChecked 
                                 ? currentFeatures.filter(f => f !== feature.id)
                                 : [...currentFeatures, feature.id];
                               setFormData({...formData, featuresEnabled: JSON.stringify(nextFeatures)});
                             }}
                             className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}
                           >
                             <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                               {isChecked && <Check className="w-3 h-3 text-white" />}
                             </div>
                             <span className="text-xs font-bold">{feature.label}</span>
                           </div>
                         )
                       })}
                    </div>
                 </div>
                 <div className="pt-6 flex gap-4">
                    <Button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[10px]">Cancel</Button>
                    <Button type="submit" className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-100">
                       {editingHospital ? "Confirm Updates" : "Register Institution"}
                    </Button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
