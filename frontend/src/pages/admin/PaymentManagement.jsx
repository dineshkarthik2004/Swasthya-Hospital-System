import { useState, useEffect } from "react"
import { CreditCard, Search, CheckCircle2, Clock, AlertCircle, Building2, Calendar, Download } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function PaymentManagement() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${API_URL}/api/admin/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPayments(res.data)
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Ledger</h1>
          <p className="text-gray-500 font-medium">Tracking hospital service fees and subscription payments.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-100">
           <Download className="w-4 h-4 mr-2" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding Balance</span>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter mt-2">$4,250.00</h3>
            <div className="mt-4 flex items-center gap-2 text-red-500 font-bold text-xs bg-red-50 w-fit px-3 py-1.5 rounded-full">
               <AlertCircle className="w-3.5 h-3.5" /> 12 Pending Invoices
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recovered This Month</span>
            <h3 className="text-3xl font-black text-emerald-600 tracking-tighter mt-2">$18,400.00</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
               <CheckCircle2 className="w-3.5 h-3.5" /> +24% from last month
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Settlement</span>
            <h3 className="text-3xl font-black text-indigo-600 tracking-tighter mt-2">4.2 Days</h3>
            <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 w-fit px-3 py-1.5 rounded-full">
               <Clock className="w-3.5 h-3.5" /> Optimized Flow
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Institution</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">Consolidating accounts...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                   <td colSpan="5" className="px-8 py-12 text-center text-gray-400 font-bold">No payment history available.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6 font-black text-gray-400 text-xs">#{p.id.slice(-8).toUpperCase()}</td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-gray-300" />
                          <span className="font-bold text-gray-900 tracking-tight">{p.hospital?.name}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 font-black text-gray-900 tracking-tighter">${p.amount.toFixed(2)}</td>
                    <td className="px-8 py-6">
                       <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.status}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-gray-500">
                       {new Date(p.createdAt).toLocaleDateString()}
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
