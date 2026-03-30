import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/services/api";

export default function DoctorPatientHistoryDetails() {
  const { visitId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVisitDetails() {
      try {
        setLoading(true);
        const res = await api.get(`/api/visits/${visitId}`);
        const data = res?.data?.data || res?.data || res;
        if (data) {
          setSelectedVisit(data);
        } else {
          setError("Visit not found");
        }
      } catch (err) {
        console.error("Failed to fetch visit details:", err);
        setError("Failed to load patient details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    if (visitId) {
      fetchVisitDetails();
    }
  }, [visitId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="font-bold text-lg">Loading patient details...</p>
      </div>
    );
  }

  if (error || !selectedVisit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4">
        <p className="font-bold text-lg text-red-500">{error || "Visit not found"}</p>
        <Button onClick={() => navigate("/doctor/history")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to History
        </Button>
      </div>
    );
  }

  const patient = selectedVisit.patient || {};
  const age = new Date().getFullYear() - (new Date(patient.dateOfBirth || Date.now()).getFullYear() || 1990);
  const gender = (patient.gender || "Male").charAt(0).toUpperCase() + (patient.gender || "Male").slice(1).toLowerCase();
  const prescriptionItems = selectedVisit.consultation?.prescription?.items || [];

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-4">
      {/* Header - No Print */}
      <div className="flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/doctor/history")}
            className="rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient History Details</h1>
        </div>
        <Button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden mb-12 no-print">
        <div className="p-10 space-y-10">
          {/* Patient Info Section */}
          <div className="flex items-center gap-6 bg-blue-50/30 p-8 rounded-3xl border border-blue-50">
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-black uppercase text-3xl shadow-lg shadow-blue-200">
              {(patient.name || "P").charAt(0)}
            </div>
            <div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{patient.name || "Patient"}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-gray-500 uppercase tracking-wider">
                <span>{gender}</span>
                <span>·</span>
                <span>{age} years</span>
                <span>·</span>
                <span>PH: {patient.phone || "N/A"}</span>
                <span>·</span>
                <span className="text-blue-600 bg-blue-100 px-3 py-0.5 rounded-full">ID: {patient.id?.slice(-8)}</span>
              </div>
              <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-[0.2em]">
                Visit Date: {new Date(selectedVisit.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Vitals Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase ml-1">Vitals Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <VitalCard label="BP" value={selectedVisit.vitals?.bloodPressure} unit="mmHg" icon="~" color="text-red-500" bgColor="bg-red-50/50" />
              <VitalCard label="Heart Rate" value={selectedVisit.vitals?.pulse} unit="bpm" icon="♡" color="text-pink-500" bgColor="bg-pink-50/50" />
              <VitalCard label="Temperature" value={selectedVisit.vitals?.temperature} unit="°F" icon="🌡" color="text-orange-500" bgColor="bg-orange-50/50" />
              <VitalCard label="Weight" value={selectedVisit.vitals?.weight} unit="kg" icon="⚖" color="text-blue-500" bgColor="bg-blue-50/50" />
            </div>
          </div>

          {/* Complaint & Diagnosis */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase ml-1">Chief Complaint</h4>
              <div className="bg-gray-50/80 p-6 rounded-3xl border border-gray-100 text-gray-700 font-medium leading-relaxed min-h-[100px]">
                {selectedVisit.notes || "-"}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase ml-1">Diagnosis</h4>
              <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 text-blue-900 font-bold leading-relaxed min-h-[100px] shadow-sm">
                {selectedVisit.consultation?.diagnosis || "-"}
              </div>
            </div>
          </div>

          {/* Prescription Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">Prescribed Medications</h4>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{prescriptionItems.length} items</span>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50 h-12 border-b border-gray-100">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-6 w-[60px]">S.No</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medicine Name</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dosage</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">M-A-N</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest pr-6 text-right">Instructions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptionItems.map((med, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50/30 border-b border-gray-50 h-16 transition-colors">
                      <TableCell className="pl-6 text-xs font-bold text-gray-400">{idx + 1}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">{med.medicineName}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">{med.genericName || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-gray-700 text-sm">{med.dosage || "-"}</TableCell>
                      <TableCell className="text-center font-black text-blue-600 text-xs tracking-[0.3em]">{med.dosageMorning}-{med.dosageAfternoon}-{med.dosageNight}</TableCell>
                      <TableCell className="font-bold text-gray-900 text-sm">{med.days} days</TableCell>
                      <TableCell className="text-right pr-6 font-bold text-gray-500 text-xs">{med.instructions || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {prescriptionItems.length === 0 && (
                    <TableRow>
                      <td colSpan={6} className="text-center text-sm font-medium text-gray-400 h-24">No medicines prescribed in this visit</td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Doctor Notes / Remarks */}
          <div className="space-y-3">
            <h4 className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase ml-1">Clinical Remarks & Notes</h4>
            <div className="bg-orange-50/30 p-8 rounded-[2rem] border border-orange-100 text-gray-700 font-medium leading-relaxed shadow-inner">
              {selectedVisit.consultation?.consultationNotes || "No additional clinical notes provided."}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT AREA - CONDENSED TO FIT SINGLE A4 PAGE - MATCHING IMAGE-2 */}
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

      <div id="print-area" className="hidden print:block bg-white text-black p-0 serif-font max-w-[850px] mx-auto absolute z-[-9999] opacity-0 print:z-auto print:opacity-100 print:relative">
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
            <h2 className="text-[20px] font-serif font-bold m-0 text-black whitespace-nowrap leading-tight">Dr. {user?.name || "Shivananda Manohar"}</h2>
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
              <p className="m-0 text-[12px] font-serif text-gray-600">Age/Gender: <span className="text-black font-medium ml-2">{age} Yrs / {gender}</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">ABHA Number: <span className="text-gray-500 ml-2 italic">xx-xxxx-xxxx-xxxx</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Phone: <span className="text-black font-medium ml-2">{patient.phone || "9840090828"}</span></p>
            </div>
            <div className="text-right space-y-1">
              <p className="m-0 text-[12px] font-serif text-gray-600">Date: <strong className="text-black font-bold ml-2">{new Date(selectedVisit.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</strong></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Patient ID: <span className="text-black font-medium ml-2">p-{patient.id?.slice(-8)}</span></p>
              <p className="m-0 text-[12px] font-serif text-gray-600">Prescription ID: <span className="text-black font-medium ml-2">presc-{selectedVisit.id?.slice(-8)}</span></p>
            </div>
          </div>

          {/* Diagnosis & Vitals - COMPACT */}
          <div className="flex gap-12">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-[11px] uppercase text-black border-b border-black pb-0.5 w-full">Diagnosis</h4>
                <div className="space-y-1 px-1">
                  <p className="m-0 text-[12px] font-serif text-gray-600">Initial Observation: <span className="text-black font-medium ml-1">{selectedVisit.notes || "-"}</span></p>
                  <p className="m-0 text-[12px] font-serif text-gray-600">Diagnosis: <span className="text-black font-bold ml-1 italic tracking-tight">{selectedVisit.consultation?.diagnosis || "-"}</span></p>
                </div>
              </div>
            </div>
            <div className="w-[300px] space-y-4">
              <h4 className="font-serif font-bold text-[11px] uppercase text-black border-b border-black pb-0.5 w-full">Vitals</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 px-1">
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">BP</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{selectedVisit.vitals?.bloodPressure || "--"} <span className="text-[9px] text-gray-400 font-medium">mmHg</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Weight</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{selectedVisit.vitals?.weight || "--"} <span className="text-[9px] text-gray-400 font-medium">kg</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Pulse</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{selectedVisit.vitals?.pulse || "--"} <span className="text-[9px] text-gray-400 font-medium">bpm</span></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase font-bold text-gray-400 m-0">Temp</p>
                  <p className="text-[12px] font-serif font-bold text-black m-0 tracking-tighter">{selectedVisit.vitals?.temperature || "--"} <span className="text-[9px] text-gray-400 font-medium">°F</span></p>
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
                {prescriptionItems.map((m, i) => {
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
              <span className="text-base font-serif font-bold text-black">{selectedVisit.consultation?.followUpDate ? new Date(selectedVisit.consultation.followUpDate).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "As required"}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-[11px] font-serif font-bold text-black min-w-[80px] uppercase underline underline-offset-2">Remarks:</span>
              <span className="text-[12px] font-serif font-medium text-gray-800 italic leading-snug">{selectedVisit.consultation?.consultationNotes?.split('\nRemarks:')[1]?.trim() || "Drink plenty of water"}</span>
            </div>
            <div className="flex gap-6">
              <span className="text-[11px] font-serif font-bold text-black min-w-[80px] uppercase underline underline-offset-2">Advice:</span>
              <span className="text-[12px] font-serif font-medium text-gray-800 italic leading-snug">{selectedVisit.consultation?.adviceInstructions || "Take medicines regularly"}</span>
            </div>
          </div>

          {/* Footer Signature - MOVED UP */}
          <div className="flex justify-end pt-10 pb-10 break-inside-avoid">
            <div className="text-center space-y-1">
              <div className="border-t-[1.5px] border-dashed border-black w-56 mb-2 mx-auto"></div>
              <p className="text-[11px] text-gray-400 font-serif m-0 italic tracking-widest uppercase">Signature</p>
              <p className="text-lg font-serif font-bold text-black m-0 tracking-tight">Dr. {user?.name || "Shivananda Manohar"}</p>
              <p className="text-[10px] text-gray-400 font-serif m-0 mt-1">
                {new Date(selectedVisit.updatedAt || Date.now()).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(selectedVisit.updatedAt || Date.now()).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalCard({ label, value, unit, icon, color, bgColor }) {
  return (
    <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md`}>
      <div className={`w-12 h-12 ${bgColor} ${color} rounded-2xl flex items-center justify-center text-xl font-black`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-gray-900 tracking-tight">{value || "--"}</span>
          <span className="text-[10px] font-bold text-gray-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}
