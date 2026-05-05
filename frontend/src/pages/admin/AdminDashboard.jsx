import { useState, useEffect } from "react"
import { Building2, Stethoscope, Users, CreditCard, Activity, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import api from "@/services/api"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    hospitals: 0,
    doctors: 0,
    patients: 0,
    revenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        const isHospitalAdmin = !!userData.hospitalId;

        if (isHospitalAdmin) {
          const res = await api.get("/api/admin/stats");
          const data = res.data?.data || res.data;
          setStats({
            hospitals: data.todayVisits || 0, 
            doctors: data.totalPatients || 0, 
            patients: data.pendingPayments || 0, 
            revenue: data.revenue || 0,
            isHospital: true
          });
        } else {
          const [hRes, dRes, pRes] = await Promise.all([
            api.get("/api/admin/hospitals"),
            api.get("/api/admin/doctors"),
            api.get("/api/admin/patients")
          ])
          setStats({
            hospitals: (hRes.data?.data || hRes.data || []).length,
            doctors: (dRes.data?.data || dRes.data || []).length,
            patients: (pRes.data?.data || pRes.data || []).length,
            revenue: 0,
            isHospital: false
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const cards = stats.isHospital 
    ? [
        { name: "Today's Visits", value: stats.hospitals, icon: <Activity className="w-6 h-6" />, color: "bg-blue-500", trend: "Live", trendUp: true },
        { name: "Total Patients", value: stats.doctors, icon: <Users className="w-6 h-6" />, color: "bg-indigo-500", trend: "+12", trendUp: true },
        { name: "Unpaid Visits", value: stats.patients, icon: <CreditCard className="w-6 h-6" />, color: "bg-emerald-500", trend: "Review", trendUp: false },
        { name: "Estimated Revenue", value: `₹${stats.revenue}`, icon: <TrendingUp className="w-6 h-6" />, color: "bg-violet-500", trend: "+₹200", trendUp: true },
      ]
    : [
        { name: "Total Hospitals", value: stats.hospitals, icon: <Building2 className="w-6 h-6" />, color: "bg-blue-500", trend: "+12%", trendUp: true },
        { name: "Active Doctors", value: stats.doctors, icon: <Stethoscope className="w-6 h-6" />, color: "bg-indigo-500", trend: "+5%", trendUp: true },
        { name: "Total Patients", value: stats.patients, icon: <Users className="w-6 h-6" />, color: "bg-emerald-500", trend: "+18%", trendUp: true },
        { name: "System Revenue", value: `₹${stats.revenue}`, icon: <CreditCard className="w-6 h-6" />, color: "bg-violet-500", trend: "-2%", trendUp: false },
      ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Overview</h1>
        <p className="text-gray-500 font-medium">Real-time performance metrics across the network.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
            <div className="flex justify-between items-start mb-6">
              <div className={`${card.color} p-4 rounded-3xl text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                {card.icon}
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${card.trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                {card.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.trend}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{card.name}</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{loading ? "..." : card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Network Activity</h3>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Hospitals</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Consultations</span>
                 </div>
              </div>
           </div>
           <div className="h-64 flex items-center justify-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <div className="flex flex-col items-center gap-4">
                 <Activity className="w-10 h-10 text-gray-300 animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity Graph Visualization</p>
              </div>
           </div>
        </div>

        <div></div>
      </div>
    </div>
  )
}
