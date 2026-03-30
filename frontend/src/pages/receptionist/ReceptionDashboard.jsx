import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ReceptionDashboard() {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col items-center justify-start pt-20 h-full max-w-5xl mx-auto px-4">
      <div className="w-full space-y-2 mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reception Command Center</h1>
        <p className="text-blue-600 font-medium text-sm flex items-center gap-1">
           Current Branch: <span className="font-bold underline cursor-pointer">Chennai City Center</span>
        </p>
      </div>

      <div className="w-full relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
           <Search className="w-6 h-6" />
        </div>
        <Input 
          className="h-16 pl-16 rounded-2xl border-gray-200 bg-white shadow-sm text-lg focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-300"
          placeholder="Search phone number (e.g. 9876543210)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-20 opacity-20 flex flex-col items-center pointer-events-none">
          <div className="w-40 h-40 bg-gray-200 rounded-full mb-4"></div>
          <p className="text-sm font-medium">Quick Access Panel</p>
      </div>
    </div>
  )
}
