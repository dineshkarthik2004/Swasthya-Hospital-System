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
    navigate(`/print/${visitId}`);
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
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase ml-1">Diagnosis</h4>
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

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
              <Table className="min-w-[800px] md:min-w-0">
                <TableHeader className="bg-gray-50/50 h-12 border-b border-gray-100">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-6 w-[60px]">S.No</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-[20%]">Medicine Name</TableHead>
                    <TableHead className="text-[10px] font-black text-gray-400 uppercase tracking-widest w-[20%]">Generic Name</TableHead>
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
                        <span className="font-bold text-gray-900 text-sm uppercase">{med.medicineName}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight italic">{med.genericName || "-"}</span>
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
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase ml-1">Clinical Notes</h4>
              <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 text-gray-600 font-medium leading-relaxed shadow-inner min-h-[120px]">
                {(() => {
                  const val = selectedVisit.consultation?.consultationNotes?.split('\nRemarks:')[0]?.trim();
                  return (!val || val.toLowerCase() === 'none') ? "No clinical notes." : val;
                })()}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase ml-1">Remarks</h4>
              <div className="bg-orange-50/30 p-8 rounded-[2rem] border border-orange-100 text-gray-700 font-medium leading-relaxed shadow-inner min-h-[120px]">
                {(() => {
                  const val = selectedVisit.consultation?.consultationNotes?.split('\nRemarks:')[1]?.trim();
                  return (!val || val.toLowerCase() === 'none' || val === 'undefined') ? "No remarks provided." : val;
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Print Area Removed - Using Standalone Print Engine */}
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
