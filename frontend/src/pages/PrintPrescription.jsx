import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, Printer } from "lucide-react"
import api from "@/services/api"

export default function PrintPrescription() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get(`/api/visits`)
        const found = res.data.find(v => v.id === visitId)
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
        // Automatically trigger print dialog when data is loaded
        setTimeout(() => window.print(), 500)
     }
  }, [visit])

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  if (!visit) return <div>Visit not found.</div>

  const patient = visit.patient
  const vitals = visit.vitals
  const consultation = visit.consultation

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-10">
       {/* Print Controls (Hidden on Print) */}
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
          @page { size: a4; margin: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: 100% !important;
            padding: 30px 45px !important;
            background: white !important;
            font-size: 13px !important;
          }
          .no-print { display: none !important; }
        }
        .serif-font { 
          font-family: "Times New Roman", Times, serif; 
          font-variant-numeric: lining-nums;
          -moz-font-feature-settings: "lnum";
          -webkit-font-feature-settings: "lnum";
          font-feature-settings: "lnum";
        }
      `}</style>

       <div id="print-area" className="bg-white text-black p-10 serif-font w-full max-w-[850px] shadow-2xl print:shadow-none mx-auto print:p-0">
        {/* Hospital Header - MATCHING IMAGE-2 EXACTLY */}
        <div className="flex justify-between items-start border-b-[2.5px] border-black pb-3 mb-5 px-0 pt-0">
          <div className="flex flex-col gap-1">
            <div className="flex gap-3 items-center">
              <div className="w-12 h-12 bg-[#1a1c2e] text-white font-sans font-black text-xl flex items-center justify-center rounded-md">H+</div>
              <div>
                <h1 className="text-[26px] font-serif font-bold tracking-tight m-0 text-black uppercase whitespace-nowrap leading-none">Jotham Health Care</h1>
                <p className="text-[13px] font-serif italic text-gray-500 m-0 mt-0.5 ml-0.5">"tag line tag line"</p>
              </div>
            </div>
            <p className="text-[11px] font-serif text-gray-600 mt-1 ml-1">123 Tech Park, Chennai, Tamil Nadu - 600001.</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <h2 className="text-[20px] font-serif font-bold m-0 text-black whitespace-nowrap leading-tight">Dr. {visit.doctor?.name || "Shivananda Manohar"}</h2>
            <p className="text-[12px] font-serif text-gray-500 m-0 leading-tight">Consultant Physician</p>
            <p className="text-[11px] font-serif font-medium text-gray-800 m-0 tracking-tight">REG NO: MMC-12345</p>
            <p className="text-[13px] font-serif font-bold text-black mt-1">PHONE: 9876543210</p>
          </div>
        </div>

        <div className="px-1 space-y-6">
          {/* Patient Info Block - COMPACT CAPSULE */}
          <div className="grid grid-cols-2 gap-x-8 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
            <div className="space-y-1">
              <p className="m-0 text-[12px] font-serif text-gray-600">Name: <strong className="text-black font-bold ml-2 text-[15px]">{patient.name}</strong></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Age/Gender: <span className="text-black font-medium ml-2">{new Date().getFullYear() - (new Date(patient.dateOfBirth || Date.now()).getFullYear() || 1990)} Yrs / {(patient.gender || "Male").charAt(0).toUpperCase() + (patient.gender || "Male").slice(1).toLowerCase()}</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">ABHA Number: <span className="text-gray-500 ml-2 italic">xx-xxxx-xxxx-xxxx</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Phone: <span className="text-black font-medium ml-2">{patient.phone || "9840090828"}</span></p>
            </div>
            <div className="text-right space-y-1">
              <p className="m-0 text-[12px] font-serif text-gray-600">Date: <strong className="text-black font-bold ml-2">{new Date(visit.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</strong></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Patient ID: <span className="text-black font-medium ml-2">p-{patient.id?.slice(-8)}</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Prescription ID: <span className="text-black font-medium ml-2">presc-{visit.id?.slice(-8)}</span></p>
            </div>
          </div>

          {/* Diagnosis & Vitals - COMPACT */}
          <div className="flex gap-12">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-[11px] uppercase text-black border-b border-black pb-0.5 w-full">Diagnosis</h4>
                <div className="space-y-1 px-1">
                  <p className="m-0 text-[12px] font-serif text-gray-600">Initial Observation: <span className="text-black font-medium ml-1">{visit.notes || "-"}</span></p>
                  <p className="m-0 text-[12px] font-serif text-gray-600">Diagnosis: <span className="text-black font-bold ml-1 italic tracking-tight">{consultation?.diagnosis || "-"}</span></p>
                </div>
              </div>
            </div>
            <div className="w-[300px] space-y-4">
              <h4 className="font-serif font-bold text-[11px] uppercase text-black border-b border-black pb-0.5 w-full">Vitals</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 px-1">
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">BP</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{vitals?.bloodPressure || "--"} <span className="text-[9px] text-gray-400 font-medium">mmHg</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Weight</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{vitals?.weight || "--"} <span className="text-[9px] text-gray-400 font-medium">kg</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Pulse</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{vitals?.pulse || "--"} <span className="text-[9px] text-gray-400 font-medium">bpm</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Temp</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{vitals?.temperature || "--"} <span className="text-[9px] text-gray-400 font-medium">°F</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Rx Heading - COMPACT */}
          <div className="space-y-2 pt-2">
            <div className="flex items-end gap-2 underline decoration-black decoration-[1.5px] underline-offset-8">
              <span className="text-4xl font-serif font-bold text-black leading-none italic">Rx</span>
              <span className="text-[12px] font-serif text-gray-400 mb-1 ml-2 italic">/ Medications</span>
            </div>

            {/* Medications Table - NARROWER ROWS */}
            <table className="w-full text-left border-collapse mt-4">
              <thead>
                <tr className="border-b-2 border-black text-black">
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase w-[40px]">S.No</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase w-[60px]">Type</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase">Medicine Name</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase italic">Generic Name</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase">Dosage</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase text-center">Frequency</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase">Timing</th>
                  <th className="py-2 px-1 font-serif font-bold text-[11px] uppercase text-right pr-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {(consultation?.prescription?.items || []).map((m, i) => {
                  const type = m.medicineName?.split(' ')[0] || "Tab";
                  const remainingName = m.medicineName?.split(' ').slice(1).join(' ') || m.medicineName || "Unknown";

                  return (
                    <tr key={i} className="border-b border-gray-100 italic">
                      <td className="py-2 px-1 text-gray-500 font-serif text-[12px] not-italic">{i + 1}.</td>
                      <td className="py-2 px-1 text-gray-700 font-serif text-[12px]">{type}</td>
                      <td className="py-2 px-1 text-black font-serif font-bold text-[12px] not-italic">{remainingName}</td>
                      <td className="py-2 px-1 text-gray-500 font-serif text-[11px]">{m.genericName || "-"}</td>
                      <td className="py-2 px-1 text-gray-900 font-serif font-bold text-[12px] not-italic">{m.dosage || "-"}</td>
                      <td className="py-2 px-1 text-black font-serif font-bold text-[12px] text-center not-italic">{m.dosageMorning}-{m.dosageAfternoon}-{m.dosageNight}</td>
                      <td className="py-2 px-1 text-gray-600 font-serif text-[12px]">{m.instructions || "After Food"}</td>
                      <td className="py-2 px-1 text-right pr-2 text-black font-serif text-[12px] not-italic font-bold">{m.days} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Next Visit Block - COMPACT */}
          <div className="bg-blue-50/15 p-6 rounded-2xl border border-blue-50 space-y-3 break-inside-avoid mt-4 shadow-sm">
            <div className="flex gap-6 items-center">
              <span className="text-[11px] font-serif font-bold text-black min-w-[80px] uppercase underline underline-offset-2">Next Visit:</span>
              <span className="text-base font-serif font-bold text-black">{consultation?.followUpDate ? new Date(consultation.followUpDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "As required"}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-[11px] font-serif font-bold text-black min-w-[80px] uppercase underline underline-offset-2">Remarks:</span>
              <span className="text-[12px] font-serif font-medium text-gray-800 italic leading-snug">{consultation?.consultationNotes?.split('\nRemarks:')[1]?.trim() || "Drink plenty of water"}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-[11px] font-serif font-bold text-black min-w-[80px] uppercase underline underline-offset-2">Advice:</span>
              <span className="text-[12px] font-serif font-medium text-gray-800 italic leading-snug">{consultation?.adviceInstructions || "Take medicines regularly"}</span>
            </div>
          </div>

          {/* Footer Signature - MOVED UP */}
          <div className="flex justify-end pt-10 pb-10 break-inside-avoid">
            <div className="text-center space-y-1">
              <div className="border-t-[1.5px] border-dashed border-black w-56 mb-2 mx-auto"></div>
              <p className="text-[11px] text-gray-400 font-serif m-0 italic tracking-widest uppercase">Signature</p>
              <p className="text-lg font-serif font-bold text-black m-0 tracking-tight">Dr. {visit.doctor?.name || "Shivananda Manohar"}</p>
              <p className="text-[10px] text-gray-400 font-serif m-0 mt-1">
                {new Date(visit.updatedAt || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(visit.updatedAt || Date.now()).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
       </div>
    </div>
  )
}
