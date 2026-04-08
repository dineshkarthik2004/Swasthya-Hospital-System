import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, Printer } from "lucide-react"
import api from "@/services/api"
import { cn } from "@/lib/utils"

export default function PrintPrescription() {
   const { visitId } = useParams()
   const navigate = useNavigate()
   const [visit, setVisit] = useState(null)
   const [loading, setLoading] = useState(true)

   useEffect(() => {
      async function loadData() {
         try {
            const res = await api.get(`/api/visits/${visitId}`)
            const found = res.data?.data || res.data
            if (found) {
               setVisit(found)
            }
         } catch (err) {
            console.error(err)
         } finally {
            setLoading(false)
         }
      }
      loadData()
   }, [visitId])

   useEffect(() => {
      if (visit) {
         setTimeout(() => window.print(), 1000)
      }
   }, [visit])

   if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
   if (!visit) return <div>Visit not found.</div>

   const patient = visit.patient
   const vitals = visit.vitals
   const consultation = visit.consultation
   const medicines = consultation?.prescription?.items || []
   const count = medicines.length

   // GRADUAL ADAPTIVE LOGIC
   const mode = count > 8 ? 'extra' : count > 5 ? 'compact' : 'standard'
   const scale = mode === 'extra' ? 0.88 : mode === 'compact' ? 0.95 : 1.0
   const rowPadding = mode === 'extra' ? 'py-0.5' : mode === 'compact' ? 'py-1' : 'py-2'
   const tableFontSize = mode === 'extra' ? 'text-[9px]' : mode === 'compact' ? 'text-[10.5px]' : 'text-[12px]'

   return (
      <div className="bg-gray-100 min-h-screen flex flex-col items-center py-10">
         <div className="print:hidden w-full max-w-[850px] bg-white p-4 mb-6 shadow-sm rounded-2xl border border-gray-200 flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="px-5 py-2 hover:bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 transition-colors">
               Go Back
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-md">
               <Printer className="w-4 h-4" /> Print Prescription
            </button>
         </div>

         <style>{`
        @media print {
          @page { size: a4; margin: 0mm; }
          body { background-color: white; margin: 0; padding: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: absolute !important; 
            left: 50% !important; 
            top: 0 !important; 
            transform: translateX(-50%) scale(${scale}) !important;
            transform-origin: top center !important;
            width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: ${mode === 'extra' ? '5mm 10mm' : '10mm 15mm'} !important;
            background: white !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .no-print { display: none !important; }
        }
        .serif { font-family: "Times New Roman", Times, serif; }
      `}</style>

         <div id="print-area" className="bg-white text-black p-12 serif w-[210mm] shadow-2xl print:shadow-none mx-auto flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-bold rounded shadow-lg">H+</div>
                  <div>
                     <h1 className="text-3xl font-bold tracking-tighter uppercase leading-none mb-1">Jotham Health Care</h1>
                     <p className="text-xs italic text-gray-500">"tag line tag line"</p>
                     <p className="text-[10px] text-gray-400 mt-1">123 Tech Park, Chennai, Tamil Nadu - 600001.</p>
                  </div>
               </div>
               <div className="text-right">
                  <h2 className="text-xl font-bold leading-none mb-1">Dr. {visit.doctor?.name || "Shivananda Manohar"}</h2>
                  <p className="text-xs text-gray-500 italic mb-1">Consultant Physician</p>
                  <p className="text-[10px] font-bold text-gray-800">REG: MMC-12345 · PH: 9876543210</p>
               </div>
            </div>

            <div className="flex-1 flex flex-col space-y-5 h-full">
               {/* Patient Info Capsule - PREMIUM BOXES */}
               <div className={cn(
                  "grid grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-3xl border border-gray-100",
                  mode !== 'standard' && "p-3 rounded-xl gap-4"
               )}>
                  <div className="space-y-1">
                     <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Patient Details</p>
                     <p className="text-base"><span className="text-gray-500 uppercase text-[10px] mr-2">Name:</span> <strong className="font-bold text-lg uppercase">{patient.name}</strong></p>
                     <div className="flex items-center gap-4">
                        <p className="text-sm"><span className="text-gray-500 uppercase text-[10px] mr-2">Age/Sex:</span> <span className="font-medium">{new Date().getFullYear() - (new Date(patient.dateOfBirth || Date.now()).getFullYear() || 1990)}Y / {patient.gender}</span></p>
                        {patient.bloodGroup && (
                           <p className="text-sm border-l border-gray-300 pl-4"><span className="text-gray-500 uppercase text-[10px] mr-2">Blood Group:</span> <span className="font-bold text-red-600 uppercase tracking-widest">{patient.bloodGroup}</span></p>
                        )}
                        {patient.height && (
                           <p className="text-sm border-l border-gray-300 pl-4"><span className="text-gray-500 uppercase text-[10px] mr-2">Height:</span> <span className="font-medium uppercase">{patient.height}</span></p>
                        )}
                     </div>
                  </div>
                  <div className="text-right space-y-1">
                     <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Visit Info</p>
                     <p className="text-sm font-bold text-black uppercase">{new Date(visit.createdAt).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                     <p className="text-xs text-gray-500">ID: <span className="font-bold text-black border-l border-gray-300 pl-2 ml-2 tracking-widest uppercase">p-{patient.id?.slice(-5)}</span></p>
                  </div>
               </div>

               {/* Vitals & Diagnosis Row */}
               <div className="flex gap-6">
                  <div className="flex-1">
                     <h4 className="text-[10px] font-bold uppercase border-b border-black mb-2 opacity-30">Diagnosis & Observation</h4>
                     <div className="space-y-1 p-1">
                        <p className="text-xs text-gray-500 italic leading-snug">Observation: <span className="text-black not-italic font-medium">{visit.notes || ""}</span></p>
                        <p className="text-sm font-bold text-black italic">Diagnosis: {consultation?.diagnosis || ""}</p>
                     </div>
                  </div>
                  <div className="w-[200px]">
                     <h4 className="text-[10px] font-bold uppercase border-b border-black mb-2 opacity-30">Vital Signs</h4>
                     <div className="grid grid-cols-2 gap-2 p-1">
                        <div>
                           <p className="text-[8px] text-gray-400 font-bold uppercase">BP</p>
                           <p className="text-xs font-bold">{vitals?.bloodPressure || "-"}</p>
                        </div>
                        <div>
                           <p className="text-[8px] text-gray-400 font-bold uppercase">Weight</p>
                           <p className="text-xs font-bold">{vitals?.weight || "-"}</p>
                        </div>
                        <div>
                           <p className="text-[8px] text-gray-400 font-bold uppercase">Pulse</p>
                           <p className="text-xs font-bold">{vitals?.pulse || "-"}</p>
                        </div>
                        <div>
                           <p className="text-[8px] text-gray-400 font-bold uppercase">Temperature</p>
                           <p className="text-xs font-bold">{vitals?.temperature || "-"}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Rx Section */}
               <div className="flex flex-col flex-1 min-h-0 min-w-0">
                  <div className="flex items-end gap-3 mb-4 border-b-2 border-slate-100 pb-2">
                     <span className="text-4xl font-serif font-black italic leading-none">Rx</span>
                     <span className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1 ml-auto">Medication List ({count})</span>
                  </div>

                  <div className="overflow-hidden mb-8">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 border-y border-slate-200">
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400 w-10">#</th>
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400">Medicine Name</th>
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400">Composition</th>
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400 text-center w-28">Frequency</th>
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400 w-28">Timing</th>
                              <th className="px-2 py-2 text-[10px] font-black uppercase text-slate-400 text-right w-16">Days</th>
                           </tr>
                        </thead>
                        <tbody>
                           {medicines.map((m, i) => (
                              <tr key={i} className="border-b border-slate-50 group hover:bg-slate-50/20 transition-colors">
                                 <td className={cn("px-2 font-medium text-slate-300", rowPadding, tableFontSize)}>{i + 1}</td>
                                 <td className={cn("px-2", rowPadding)}>
                                    <span className={cn("font-bold text-slate-900 uppercase tracking-tight", tableFontSize)}>{m.medicineName}</span>
                                 </td>
                                 <td className={cn("px-2", rowPadding)}>
                                    <span className={cn("text-slate-500 italic font-serif leading-none", tableFontSize)}>{m.composition || "-"}</span>
                                 </td>
                                 <td className={cn("px-2 font-black text-blue-600 text-center tracking-widest", rowPadding, tableFontSize)}>{m.dosageMorning}-{m.dosageAfternoon}-{m.dosageNight}</td>
                                 <td className={cn("px-2 text-slate-500 font-medium italic", rowPadding, tableFontSize)}>{m.instructions || "After Food"}</td>
                                 <td className={cn("px-2 text-right font-bold text-slate-900", rowPadding, tableFontSize)}>{m.days}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Instructions: Rides immediately below the table */}
                  <div className="space-y-2 border-t-2 border-slate-900/10 pt-4 max-w-[70%]">
                     <div className="flex gap-4">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-16 pt-0.5">Remarks:</span>
                        <span className="text-xs italic text-slate-700 border-l-2 border-slate-100 pl-3 leading-relaxed">{consultation?.consultationNotes?.split('\nRemarks:')[1]?.trim() || "-"}</span>
                     </div>
                     <div className="flex gap-4">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-16 pt-0.5">Advice:</span>
                        <span className="text-xs italic text-slate-700 border-l-2 border-slate-100 pl-3 leading-relaxed">{consultation?.adviceInstructions || "-"}</span>
                     </div>
                     <div className="flex gap-4">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-16 pt-0.5 mt-0.5">Follow up:</span>
                        <span className="text-sm font-bold text-slate-900 uppercase border-l-2 border-slate-100 pl-3">{consultation?.followUpDate ? new Date(consultation.followUpDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "As Required"}</span>
                     </div>
                  </div>
               </div>

               {/* Footer - Signature ONLY (Sticks to absolute bottom) */}
               <div className="mt-auto pt-6 flex justify-end">
                  <div className="text-center group pb-2">
                     <div className="border-t-2 border-dashed border-slate-900 w-48 mb-2 mx-auto opacity-20 group-hover:opacity-100 transition-opacity"></div>
                     <p className="text-[9px] text-slate-400 italic tracking-[0.3em] uppercase mb-1">Clinic Signature</p>
                     <h3 className="text-xl font-bold text-slate-900 leading-none uppercase tracking-tight">Dr. {visit.doctor?.name || "Shivananda Manohar"}</h3>
                     <p className="text-[8px] text-slate-300 mt-1 uppercase tracking-widest">
                        {new Date(visit.updatedAt || Date.now()).toLocaleDateString("en-US", { hour: '2-digit', minute: '2-digit' })}
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   )
}
