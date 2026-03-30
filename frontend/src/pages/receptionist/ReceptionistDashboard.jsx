import { useState } from "react"
import { Search, LayoutDashboard } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function ReceptionistDashboard() {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col items-center justify-start h-full bg-white pt-24 px-8">
      <div className="w-full max-w-6xl space-y-1 mb-12">
        <h1 className="text-[42px] font-black text-gray-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
          Reception Command Center
        </h1>
        <p className="text-sm font-bold tracking-tight text-gray-400 mt-3 flex items-center gap-2">
          Current Branch: <span className="text-blue-600 hover:underline cursor-pointer transition-all">Chennai City Center</span>
        </p>
      </div>

      <div className="w-full max-w-6xl relative group">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-all duration-300">
           <Search className="w-6 h-6" />
        </div>
        <Input 
          className="h-20 pl-20 pr-10 rounded-[2.5rem] border-gray-100 bg-[#FBFBFC] shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-lg font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300 border-2"
          placeholder="Search phone number (e.g. 9876543210)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
           <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-white px-4 py-2 rounded-2xl border border-gray-50 shadow-sm">Press Enter ↵</div>
        </div>
      </div>

      <div className="mt-32 w-full max-w-6xl">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent mb-12"></div>
         <div className="flex items-center gap-4 text-gray-300 mb-8 opacity-40">
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Quick Access Panel</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20">
            {[1,2,3].map(i => (
              <Card key={i} className="group border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] bg-[#FBFBFC] hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 h-48 border-2 border-transparent hover:border-blue-50 flex items-center justify-center">
                 <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                 </div>
              </Card>
            ))}
         </div>
      </div>
    </div>
  )
}
