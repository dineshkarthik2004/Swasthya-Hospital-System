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
    <div className="bg-white min-h-screen">
       {/* Print Controls (Hidden on Print) */}
       <div className="print:hidden p-4 bg-gray-100 flex justify-center gap-4">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">
             <Printer className="w-4 h-4" /> Print Prescription
          </button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white border rounded-lg font-bold text-gray-700">
             Go Back
          </button>
       </div>

       {/* Print Area */}
       <div className="max-w-[800px] mx-auto p-10 print:p-0 print:max-w-none text-gray-900 bg-white">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-blue-600 pb-4 mb-6">
             <div>
                <h1 className="text-3xl font-black text-blue-700 tracking-tight flex items-center gap-2">
                   <div className="w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-lg text-lg">+</div>
                   CITY CARE CLINIC
                </h1>
                <p className="text-sm font-medium mt-1 text-gray-600">123 Health Avenue, Medical District, Chennai</p>
                <p className="text-sm text-gray-500">Phone: +91 98765 43210  |  Email: contact@citycare.com</p>
             </div>
             <div className="text-right">
                <h2 className="text-xl font-bold">Dr. Shivananda Manohar</h2>
                <p className="text-sm font-medium text-gray-600">MBBS, MD (General Medicine)</p>
                <p className="text-sm text-gray-500">Reg No: 123456</p>
             </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 gap-4 border border-gray-200 p-4 rounded-xl mb-6 bg-gray-50/50">
             <div className="space-y-1">
                <div className="flex"><span className="w-24 text-gray-500 font-medium">Patient Name:</span> <span className="font-bold">{patient?.name}</span></div>
                <div className="flex"><span className="w-24 text-gray-500 font-medium">Age / Gender:</span> <span className="font-bold">{new Date().getFullYear() - (new Date(patient?.dateOfBirth).getFullYear() || new Date().getFullYear() - 30)} Yrs / {patient?.gender}</span></div>
                <div className="flex"><span className="w-24 text-gray-500 font-medium">Patient ID:</span> <span className="font-bold">P-{patient?.id?.slice(-8)}</span></div>
             </div>
             <div className="space-y-1 text-right">
                <div className="flex justify-end"><span className="w-24 text-gray-500 font-medium text-left">Date:</span> <span className="font-bold">{new Date(visit.createdAt).toLocaleDateString()}</span></div>
                <div className="flex justify-end"><span className="w-24 text-gray-500 font-medium text-left">Phone:</span> <span className="font-bold">{patient?.phone}</span></div>
             </div>
          </div>

          {/* Vitals Overview */}
          {vitals && (
             <div className="flex justify-between items-center py-3 border-y border-dashed border-gray-300 mb-6 text-sm">
                <div><span className="text-gray-500">Weight:</span> <span className="font-bold">{vitals.weight || "-"} kg</span></div>
                <div><span className="text-gray-500">BP:</span> <span className="font-bold">{vitals.bloodPressure || "-"} mmHg</span></div>
                <div><span className="text-gray-500">PR:</span> <span className="font-bold">{vitals.pulse || "-"} bpm</span></div>
                <div><span className="text-gray-500">Temp:</span> <span className="font-bold">{vitals.temperature || "-"} °F</span></div>
             </div>
          )}

          {/* Diagnosis & Rx Container */}
          <div className="flex gap-8 min-h-[400px]">
             
             {/* Left Column: Diagnosis & Notes */}
             <div className="w-1/3 border-r pr-6 space-y-6 flex-shrink-0">
                {consultation?.diagnosis && (
                   <div>
                      <h3 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-2 border-b pb-1">Diagnosis</h3>
                      <p className="font-medium text-sm leading-relaxed">{consultation.diagnosis}</p>
                   </div>
                )}
                {visit.notes && (
                   <div>
                      <h3 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-2 border-b pb-1">Symptoms</h3>
                      <p className="font-medium text-sm leading-relaxed">{visit.notes}</p>
                   </div>
                )}
                {consultation?.consultationNotes && (
                   <div>
                      <h3 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-2 border-b pb-1">Remarks</h3>
                      <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap">{consultation.consultationNotes}</p>
                   </div>
                )}
             </div>

             {/* Right Column: Prescription Table */}
             <div className="flex-1">
                <div className="text-4xl font-serif italic text-blue-800 mb-4 pr-4">Rx</div>
                {consultation?.prescription?.items?.length > 0 ? (
                   <div className="space-y-4">
                      {consultation.prescription.items.map((med, idx) => (
                         <div key={idx} className="border-b border-gray-100 pb-3">
                            <div className="flex items-baseline gap-2 mb-1">
                               <span className="font-black text-gray-400 text-sm">{idx + 1}.</span>
                               <span className="font-bold text-lg text-gray-900">{med.medicineName}</span>
                               {med.dosage && <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{med.dosage}</span>}
                            </div>
                            <div className="ml-5 flex items-center justify-between mt-1 text-sm bg-blue-50/50 p-2 rounded-lg">
                               <div className="flex gap-4 font-semibold text-gray-700 font-mono">
                                  <span>{med.dosageMorning || 0} - {med.dosageAfternoon || 0} - {med.dosageNight || 0}</span>
                                  <span className="text-blue-600">{med.instructions}</span>
                               </div>
                               <div className="font-bold text-gray-900 border border-gray-200 bg-white px-3 py-1 rounded">
                                  {med.days} Days
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                ) : (
                   <div className="text-gray-400 italic mt-10">No specific medicines prescribed.</div>
                )}
             </div>
          </div>

          {/* Footer Signature Box */}
          <div className="mt-20 flex justify-between items-end">
             <div className="text-xs text-gray-500 font-medium w-1/2">
                * Please bring this prescription for your next visit.<br/>
                * Medicines should be taken exactly as prescribed.
             </div>
             <div className="text-center">
                <div className="w-48 border-b-2 border-gray-400 mb-2"></div>
                <div className="font-bold text-gray-900">Doctor's Signature</div>
             </div>
          </div>
       </div>
    </div>
  )
}
