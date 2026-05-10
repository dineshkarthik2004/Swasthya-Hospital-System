import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Calendar, History } from "lucide-react";
import api from "@/services/api";

export default function MyPatientsHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get("/api/visits");
        const data = res.data?.data || res.data;
        const completed = (data || []).filter(v => 
          v.status === "COMPLETED" || 
          v.status === "CONSULTED" || 
          v.status === "PRESCRIPTION_COMPLETED" ||
          v.status === "PAYMENT_COLLECTED" ||
          v.status === "CONSULTATION_COMPLETED"
        );
        
        // If doctor, only see own. If admin, see all in hospital.
        const filtered = user?.role === "ADMIN" 
          ? completed 
          : completed.filter(v => v.doctorId === user?.id);
          
        filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistory(filtered);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
    loadHistory();
  }, [user]);

  const filteredHistory = history.filter(v => {
    // Search filter
    const s = search.toLowerCase();
    const name = v.patient?.name?.toLowerCase() || "";
    const pid = v.patient?.id?.toLowerCase() || "";
    const diag = v.consultation?.diagnosis?.toLowerCase() || "";
    const matchesSearch = !search || name.includes(s) || pid.includes(s) || diag.includes(s);

    // Date filter
    const visitDate = new Date(v.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0,0,0,0);
    if (end) end.setHours(23,59,59,999);

    const matchesDate = (!start || visitDate >= start) && (!end || visitDate <= end);

    return matchesSearch && matchesDate;
  });

  return (
    <div className="max-w-[1200px] mx-auto pt-8 px-4 pb-20">
      <div className="space-y-1 mb-8">
        <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900 tracking-tight text-black">
          <History className="w-8 h-8 text-blue-600" />
          Visit History
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ml-11">
          <p className="text-black font-black uppercase tracking-widest text-[11px] opacity-40">All your completed consultations in one place.</p>
          <div className="bg-blue-50 px-4 py-1.5 rounded-full text-xs font-black text-blue-600 border border-blue-100 uppercase tracking-widest shadow-sm">
            {history.length} total visits
          </div>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden bg-white">
        <div className="p-8 border-b border-gray-50 bg-gray-50/20">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Date Range Filter */}
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm focus-within:border-blue-200 transition-all">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <input 
                  type="date"
                  className="bg-transparent border-none focus:ring-0 text-sm font-black text-black placeholder:text-black w-36 cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-black font-black opacity-20">—</span>
              <div className="flex items-center gap-3">
                <input 
                  type="date"
                  className="bg-transparent border-none focus:ring-0 text-sm font-black text-black placeholder:text-black w-36 cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Calendar className="w-4 h-4 text-black opacity-30" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black w-4 h-4 opacity-30 group-focus-within:text-blue-500 group-focus-within:opacity-100 transition-all" />
              <Input 
                placeholder="Patient Search..." 
                className="pl-12 bg-white border-gray-100 rounded-2xl h-[52px] text-sm font-black text-black shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-100 hover:border-gray-200 placeholder:text-black"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Clear All button */}
            {(startDate || endDate || search) && (
              <button 
                onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); }}
                className="text-xs font-black text-black uppercase tracking-widest hover:text-red-500 transition-colors opacity-40 hover:opacity-100"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/50 h-16">
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest px-8 w-[140px]">Date</TableHead>
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest pl-4">Patient</TableHead>
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest w-[120px]">Age</TableHead>
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest w-[120px]">Gender</TableHead>
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest w-[300px]">Diagnosis</TableHead>
                <TableHead className="text-[10px] font-black text-black uppercase tracking-widest text-right pr-12">Medicines</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((visit) => {
                const dateObj = new Date(visit.createdAt);
                const dateStr = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
                const age = new Date().getFullYear() - (new Date(visit.patient?.dateOfBirth || Date.now()).getFullYear() || 1990);
                const gender = (visit.patient?.gender || "Male").charAt(0).toUpperCase() + (visit.patient?.gender || "Male").slice(1).toLowerCase();
                const medCount = visit.consultation?.prescription?.items?.length || 0;

                return (
                  <TableRow 
                    key={visit.id} 
                    className="group hover:bg-blue-50/30 cursor-pointer h-24 border-b border-gray-50 transition-all duration-200"
                    onClick={() => {
                        navigate(`/doctor/history/${visit.id}`);
                    }}
                  >
                    <TableCell className="px-8">
                      <div className="flex flex-col">
                        <span className="text-black font-black text-sm tracking-tight">{dateStr.split(' ')[1]} {dateStr.split(' ')[0]}</span>
                        <span className="text-black text-[10px] uppercase font-black tracking-widest opacity-40">{dateStr.split(' ')[2]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg uppercase transition-transform group-hover:scale-110 shadow-sm border border-white">
                          {(visit.patient?.name || "P").charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-black text-[15px] group-hover:text-blue-600 transition-colors tracking-tight">{visit.patient?.name || "Unknown"}</span>
                          <span className="text-[10px] text-black font-black uppercase tracking-[0.2em] opacity-40 mt-0.5">ID: {visit.patient?.id?.slice(-8).toUpperCase() || "N/A"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-black text-sm tracking-tight">{age} YRS</TableCell>
                    <TableCell className="font-black text-black text-sm tracking-tight">{gender}</TableCell>
                    <TableCell className="text-sm">
                      <div className="bg-gray-50 group-hover:bg-white px-4 py-2 rounded-2xl border border-transparent group-hover:border-blue-100 text-black font-black uppercase tracking-tight text-[11px] truncate max-w-[280px] transition-all shadow-sm group-hover:shadow-md opacity-60 group-hover:opacity-100">
                        {visit.consultation?.diagnosis || "No diagnosis logged"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-12">
                      <span className="bg-white px-4 py-1.5 rounded-full border border-gray-100 text-[11px] font-black text-gray-900 uppercase tracking-widest group-hover:border-blue-200 group-hover:bg-blue-50 transition-all shadow-sm group-hover:shadow-md">
                        {medCount} Med{medCount !== 1 && 's'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-200 mb-4">
                         <Search className="w-6 h-6 text-black opacity-20" />
                      </div>
                      <p className="text-black font-black uppercase tracking-[0.2em] text-[10px]">No matches found for your search.</p>
                      {(startDate || endDate || search) && (
                        <button 
                          onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); }}
                          className="text-[11px] font-black text-blue-600 border-b border-blue-600 uppercase tracking-widest pt-2 hover:text-blue-700 hover:border-blue-700 transition-all mt-4"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
