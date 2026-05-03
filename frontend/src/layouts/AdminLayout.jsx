import { Outlet, Navigate, useLocation, Link, useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Users, ClipboardList, LogOut, LayoutDashboard, ShieldCheck, HeartPulse, Menu, Bell, ChevronDown, Loader2, Building2, Stethoscope, CreditCard, Settings2, Pill } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])
  
  const effectiveUser = user || (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  })();

  const effectiveRole = (effectiveUser?.role || "").toUpperCase();

  if (loading && !effectiveUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#F8F9FA] gap-4">
         <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
         <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Warming up systems...</span>
      </div>
    )
  }

  if (!effectiveUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (effectiveRole !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-screen flex-col bg-[#F8F9FA]">
         <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ShieldCheck className="w-10 h-10" />
         </div>
         <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Restricted</h2>
         <p className="mt-2 text-gray-400 font-medium">Your credentials lack authorization for this wing.</p>
         <Button type="button" className="mt-8 bg-blue-600 hover:bg-blue-700 h-12 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px]" onClick={() => navigate(-1)}>Secure Return</Button>
      </div>
    )
  }

  const handleLogout = () => {
     logout()
     navigate("/login")
  }

  const isSuperAdmin = !user?.hospitalId;

  const navItems = isSuperAdmin 
    ? [
        { name: "Global Overview", path: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "Hospitals", path: "/admin/hospitals", icon: <Building2 className="w-5 h-5" /> },
        { name: "Doctor Network", path: "/admin/doctors", icon: <Stethoscope className="w-5 h-5" /> },
        { name: "Patients", path: "/admin/patients", icon: <Users className="w-5 h-5" /> },
        { name: "Finance", path: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
        { name: "Medicines", path: "/admin/medicines", icon: <Pill className="w-5 h-5" /> },
        { name: "System Settings", path: "/admin/settings", icon: <Settings2 className="w-5 h-5" /> },
      ]
    : [
        { name: "Hospital Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: "Doctors", path: "/admin/doctors", icon: <Stethoscope className="w-5 h-5" /> },
        { name: "Staff Management", path: "/admin/staff", icon: <ShieldCheck className="w-5 h-5" /> },
        { name: "Patients", path: "/admin/patients", icon: <Users className="w-5 h-5" /> },
        { name: "Visits Queue", path: "/admin/visits", icon: <ClipboardList className="w-5 h-5" /> },
        { name: "Consultations", path: "/admin/consultations", icon: <HeartPulse className="w-5 h-5" /> },
        { name: "Revenue", path: "/admin/payments", icon: <CreditCard className="w-5 h-5" /> },
        { name: "Medicines", path: "/admin/medicines", icon: <Pill className="w-5 h-5" /> },
        { name: "Hospital Settings", path: "/admin/settings", icon: <Settings2 className="w-5 h-5" /> },
      ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] font-sans">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside 
        className={`${collapsed ? 'md:w-[80px]' : 'md:w-72'} w-72 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) border-r bg-white flex flex-col z-40 shadow-[4px_0_24px_-10px_rgba(0,0,0,0.02)] fixed md:relative h-full ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="h-24 flex flex-col justify-center px-8 shrink-0 bg-white">
          {!collapsed && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100 ring-4 ring-indigo-50 border-2 border-white">
                 <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-black text-xl text-gray-900 tracking-tighter uppercase">Admin Panel</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-black opacity-80 mt-0.5">Control Center</span>
              </div>
            </div>
          )}
          {collapsed && (
             <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg ring-4 ring-indigo-50 border-2 border-white"><ShieldCheck className="w-6 h-6" /></div>
          )}
        </div>
        
        <div className="px-8 pt-8 pb-4">
           {!collapsed && <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-1">Management</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 scrollbar-hide">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 border border-transparent ${
                location.pathname.startsWith(item.path) 
                   ? "bg-indigo-50 text-indigo-600 font-black border-indigo-100 shadow-inner" 
                   : "text-gray-500 hover:bg-gray-50 font-bold"
              }`}
            >
              <div className={`${location.pathname.startsWith(item.path) ? "text-indigo-600 scale-110" : "text-gray-400"} transition-all duration-300`}>
                 {item.icon}
              </div>
              {!collapsed && <span className="text-[13px] tracking-tight whitespace-nowrap">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-3xl border-b border-gray-100/50 flex items-center px-10 shrink-0 justify-between z-10">
            <div className="flex items-center gap-6">
               <div className="p-2.5 hover:bg-gray-50 rounded-2xl cursor-pointer text-gray-400 transition-colors border border-transparent hover:border-gray-100" onClick={() => { if (window.innerWidth < 768) { setMobileOpen(!mobileOpen); } else { setCollapsed(!collapsed); } }}>
                  <Menu className="w-5 h-5" />
               </div>
               <div className="flex flex-col leading-none">
                  <h2 className="font-black text-gray-900 text-lg tracking-tight">{navItems.find(i => location.pathname.startsWith(i.path))?.name || "Admin Overview"}</h2>
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1.5 opacity-70">
                     System Administrator
                  </span>
               </div>
            </div>
            <div className="flex items-center gap-5">
               <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100/50 cursor-pointer relative hover:text-indigo-500 transition-colors group">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute top-3 right-3 border-2 border-white animate-pulse"></div>
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
               </div>
               
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-white group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                           {(user?.name || 'A').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-gray-900 leading-none">{(user?.name || "Admin").split(' ')[0]}</span>
                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{isSuperAdmin ? "Super Admin" : "Hospital Admin"}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-300 mt-1 ml-1" />
                     </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-[2rem] shadow-2xl mt-4 border-none p-4 bg-white ring-1 ring-black/5 z-[200]">
                     <DropdownMenuLabel className="font-black text-gray-900 text-sm px-4 pt-4 pb-2">Admin Account</DropdownMenuLabel>
                     <p className="px-4 pb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none shrink-0">{user?.email || "admin@gmail.com"}</p>
                     <DropdownMenuSeparator className="bg-gray-50 mb-3 mx-2" />
                     <DropdownMenuItem 
                        className="text-red-500 font-black uppercase tracking-widest text-[10px] focus:bg-red-50 focus:text-red-600 rounded-2xl cursor-pointer gap-4 py-4 px-5 transition-all" 
                        onClick={handleLogout}
                     >
                        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center group-focus:bg-red-100">
                           <LogOut className="w-4 h-4" /> 
                        </div>
                        Terminate Session
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
        </header>
        <div className="flex-1 overflow-auto bg-[#F8F9FA] scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
