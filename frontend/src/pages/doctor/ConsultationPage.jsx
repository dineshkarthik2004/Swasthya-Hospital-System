import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { VoiceMicButton } from "@/components/VoiceMicButton"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react"
import api from "@/services/api"

export default function ConsultationPage() {
   const { id } = useParams()
   const navigate = useNavigate()
   const { toast } = useToast()

   const [loading, setLoading] = useState(true)
   const [submitting, setSubmitting] = useState(false)
   const [visit, setVisit] = useState(null)

   const [diagnosis, setDiagnosis] = useState("")
   const [remarks, setRemarks] = useState("nil")
   const [adviceInstructions, setAdviceInstructions] = useState("Drink plenty of water")
   const [followUpDate, setFollowUpDate] = useState("")
   const [labPending, setLabPending] = useState(false)
   const [clinicalNotes, setClinicalNotes] = useState("")
   const [feeType, setFeeType] = useState("Type A")

   const [medicines, setMedicines] = useState([]);
   const [medicineSuggestions, setMedicineSuggestions] = useState([]);
   const [activeSearchIndex, setActiveSearchIndex] = useState(null);

   // Composition search state
   const [compositionSuggestions, setCompositionSuggestions] = useState([]);
   const [activeCompositionIndex, setActiveCompositionIndex] = useState(null);

   // Voice candidates dropdown — shows when voice-match returns multiple options
   const [voiceCandidates, setVoiceCandidates] = useState({});

   // Debounce and Request cancellation refs
   const searchTimeoutRef = React.useRef(null);
   const abortControllerRef = React.useRef(null);
   const compositionTimeoutRef = React.useRef(null);
   const compositionAbortRef = React.useRef(null);

   // Cleanup timeouts and requests on unmount
   useEffect(() => {
      return () => {
         if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
         if (abortControllerRef.current) abortControllerRef.current.abort();
         if (compositionTimeoutRef.current) clearTimeout(compositionTimeoutRef.current);
         if (compositionAbortRef.current) compositionAbortRef.current.abort();
      };
   }, []);

   // Edit Vitals state
   const [editingVitals, setEditingVitals] = useState(false)
   const [vitalsTemp, setVitalsTemp] = useState({ bp: "", pulse: "", temp: "", weight: "", sugar: "", height: "" })

   useEffect(() => {
      if (!id) return;
      setLoading(true);
      api.get(`/api/visits/${id}`)
         .then(res => {
            const found = res.data?.data || res.data;
            console.log("VISIT DATA:", found);
            setVisit(found);
            setVitalsTemp({
               bp: found.vitals?.bloodPressure || "",
               pulse: found.vitals?.pulse || "",
               temp: found.vitals?.temperature || "",
               weight: found.vitals?.weight || "",
               sugar: found.vitals?.bloodSugar || "",
               height: found.vitals?.height || ""
            })
            if (found.consultation) {
               setDiagnosis(found.consultation.diagnosis || "")
               setRemarks(found.consultation.consultationNotes?.split('\nRemarks:')[1]?.trim() || "")
               setClinicalNotes(found.consultation.consultationNotes?.split('\nRemarks:')[0]?.trim() || "")
               setAdviceInstructions(found.consultation.adviceInstructions || "")
               setFollowUpDate(found.consultation.followUpDate?.split('T')[0] || "")
               setLabPending(found.consultation.labPending || false)
               // prepopulate medicines if they exist
               if (found.consultation.prescription && found.consultation.prescription.length > 0) {
                  setMedicines(found.consultation.prescription.map(m => ({
                     name: m.medicineName || "",
                     composition: m.composition || "",
                     m: m.dosageMorning || 0,
                     a: m.dosageAfternoon || 0,
                     n: m.dosageNight || 0,
                     timing: m.instructions || "After Food",
                     duration: m.days || 3
                  })))
               }
            }
         })
         .catch(console.error)
         .finally(() => setLoading(false))
   }, [id])

   const handleAddMedicine = () => {
      setMedicines([...medicines, { name: "", composition: "", m: 0, a: 0, n: 0, timing: "", duration: "", instruction: "" }])
   }



   const updateMedicine = (index, field, value) => {
      const newMeds = [...medicines]
      newMeds[index][field] = value
      setMedicines(newMeds)
   }

   const removeMedicine = (index) => {
      const newMeds = medicines.filter((_, i) => i !== index)
      setMedicines(newMeds)
   }

   const fetchMedicineSuggestions = (index, query) => {
      // Clear existing timeout to debounce
      if (searchTimeoutRef.current) {
         clearTimeout(searchTimeoutRef.current);
         searchTimeoutRef.current = null;
      }

      // Minimum 3 characters to reduce backend load
      if (!query || query.trim().length < 3) {
         setMedicineSuggestions([]);
         setActiveSearchIndex(null);
         // Cancel any pending request as well
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
         }
         return;
      }

      // Set debounce timeout (450ms)
      searchTimeoutRef.current = setTimeout(async () => {
         // Cancel previous request if still pending
         if (abortControllerRef.current) {
            abortControllerRef.current.abort();
         }
         
         // New controller for this request
         abortControllerRef.current = new AbortController();

         try {
            const res = await api.get(`/api/medicines/search?q=${encodeURIComponent(query)}`, {
               signal: abortControllerRef.current.signal
            });
            
            // Check if this results belong to the currently typed query to avoid race conditions
            // (Though AbortController handles most of this, it's good practice)
            setMedicineSuggestions(res.data || []);
            setActiveSearchIndex(index);
         } catch (err) {
            // Only log errors that aren't cancellation-related
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
               console.error("Search error:", err);
            }
         }
      }, 450);
   };

   const handleSelectMedicine = (index, suggestion) => {
      const newMeds = [...medicines];
      newMeds[index] = {
         ...newMeds[index],
         name: suggestion.name,
         composition: suggestion.composition || ""
      };
      setMedicines(newMeds);
      setMedicineSuggestions([]);
      setActiveSearchIndex(null);
   };

   // ─── Composition search (same pattern as medicine name search) ────────
   const fetchCompositionSuggestions = (index, query) => {
      if (compositionTimeoutRef.current) {
         clearTimeout(compositionTimeoutRef.current);
         compositionTimeoutRef.current = null;
      }
      if (!query || query.trim().length < 3) {
         setCompositionSuggestions([]);
         setActiveCompositionIndex(null);
         if (compositionAbortRef.current) {
            compositionAbortRef.current.abort();
            compositionAbortRef.current = null;
         }
         return;
      }
      compositionTimeoutRef.current = setTimeout(async () => {
         if (compositionAbortRef.current) compositionAbortRef.current.abort();
         compositionAbortRef.current = new AbortController();
         try {
            const res = await api.get(`/api/medicines/search?q=${encodeURIComponent(query)}&field=composition`, {
               signal: compositionAbortRef.current.signal
            });
            setCompositionSuggestions(res.data || []);
            setActiveCompositionIndex(index);
         } catch (err) {
            if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
               console.error("Composition search error:", err);
            }
         }
      }, 450);
   };

   const handleSelectComposition = (index, suggestion) => {
      const newMeds = [...medicines];
      newMeds[index] = {
         ...newMeds[index],
         name: suggestion.name,
         composition: suggestion.composition || ""
      };
      setMedicines(newMeds);
      setCompositionSuggestions([]);
      setActiveCompositionIndex(null);
   };

   // Handle selecting a voice candidate from dropdown
   const handleSelectVoiceCandidate = (index, candidate) => {
      const newMeds = [...medicines];
      newMeds[index] = {
         ...newMeds[index],
         name: candidate.name,
         composition: candidate.composition || ""
      };
      setMedicines(newMeds);
      // Remove candidates for this row (close dropdown)
      setVoiceCandidates(prev => {
         const updated = { ...prev };
         delete updated[index];
         return updated;
      });
   };

   // Finalize
   // Helper: append new text with comma separator (preserves old text)
   const appendText = (oldVal, newText) => {
      if (!newText || newText.trim() === "") return oldVal;
      const trimmedOld = (oldVal || "").trim();
      // If old value is empty or just the default placeholder, replace entirely
      if (!trimmedOld || trimmedOld.toLowerCase() === "nil") return newText.trim();
      return trimmedOld + ", " + newText.trim();
   };

   const applyExtractedData = (data, type) => {
      if (type === "diagnosis" || type === "diseases_only") {
         const newVal = data.diseases || data.diagnosis || "";
         setDiagnosis(prev => appendText(prev, newVal));
      }
      if (type === "notes") {
         const newVal = data.notes || "";
         setClinicalNotes(prev => appendText(prev, newVal));
      }
      if (type === "remarks") {
         const newVal = data.notes || data.remarks || "";
         setRemarks(prev => appendText(prev, newVal));
      }
      if (type === "advice") {
         const newVal = data.notes || data.advice || "";
         setAdviceInstructions(prev => appendText(prev, newVal));
      }
   };

   // Voice prescription flow: AI extract → voice-match → auto-fill
   const handleVoicePrescription = async (text) => {
      try {
         // Step 1: AI extraction to get structured medicines array
         const aiRes = await api.post("/api/ai/extract", { text, type: "prescription" });
         const aiData = aiRes.data?.data || aiRes.data;
         console.log("AI PRESCRIPTION RESPONSE:", aiData);

         // Normalize: AI now returns { medicines: [...] } array format
         let extractedMeds = [];
         if (aiData.medicines && Array.isArray(aiData.medicines)) {
            extractedMeds = aiData.medicines;
         } else if (aiData.medicine) {
            // Fallback: single medicine object (legacy format)
            extractedMeds = [aiData];
         }

         if (extractedMeds.length === 0) {
            toast({ title: "No medicines found", description: "Could not extract medicines from voice", variant: "destructive" });
            return;
         }

         // Step 2: Build voice-match request payload
         const voiceMatchPayload = {
            medicines: extractedMeds.map(med => ({
               spoken_name: med.medicine || med.name || "",
               morning: Number(med.m) || 0,
               afternoon: Number(med.a) || 0,
               night: Number(med.n) || 0,
               timing: med.timing || "",
               duration: med.duration || 0,
               instruction: med.instruction || ""
            }))
         };

         console.log("Voice-match payload:", voiceMatchPayload);

         // Step 3: Call voice-match API for smart medicine matching
         const matchRes = await api.post("/api/medicines/voice-match", voiceMatchPayload);
         const matchData = matchRes.data;
         console.log("Voice-match response:", matchData);

         if (!matchData.success || !matchData.medicines) {
            toast({ title: "Matching failed", description: "Medicine matching API returned no results", variant: "destructive" });
            return;
         }

         // Step 4: Map matched medicines into prescription rows
         const currentLength = medicines.length; // Track starting index for candidates
         const newRows = matchData.medicines.map(med => ({
            name: med.name || med.spoken_name || "",
            composition: med.composition || "",
            m: Number(med.morning) || 0,
            a: Number(med.afternoon) || 0,
            n: Number(med.night) || 0,
            timing: med.timing || "",
            duration: med.duration || "",
            instruction: med.instruction || ""
         }));

         // Add rows to prescription table
         setMedicines(prev => [...prev, ...newRows]);

         // Step 5: Store voice candidates for rows that have multiple matches (for dropdown)
         const newCandidates = {};
         matchData.medicines.forEach((med, i) => {
            if (med.candidates && med.candidates.length > 1) {
               newCandidates[currentLength + i] = med.candidates;
            }
         });
         if (Object.keys(newCandidates).length > 0) {
            setVoiceCandidates(prev => ({ ...prev, ...newCandidates }));
         }

         // Step 6: Show toasts
         const unmatched = matchData.medicines.filter(m => !m.matched);
         if (unmatched.length > 0) {
            const names = unmatched.map(m => m.spoken_name).join(", ");
            toast({
               title: "⚠️ No medicines matched",
               description: `Could not match: ${names}. Please verify these entries.`,
               variant: "destructive"
            });
         }

         const withCandidates = matchData.medicines.filter(m => m.candidates && m.candidates.length > 1);
         const exactMatched = matchData.medicines.filter(m => m.matched && (!m.candidates || m.candidates.length <= 1));

         if (exactMatched.length > 0) {
            toast({
               title: "✅ Medicines matched",
               description: `${exactMatched.length} medicine(s) auto-filled from dataset.`
            });
         }
         if (withCandidates.length > 0) {
            toast({
               title: "📋 Multiple matches found",
               description: `${withCandidates.length} medicine(s) have multiple options. Please select from dropdown.`
            });
         }

      } catch (err) {
         console.error("Voice prescription error:", err);
         toast({ title: "Error", description: "Failed to process voice prescription", variant: "destructive" });
      }
   };

   const handleVoiceResult = async (text, type) => {
      // Direct transcription for remarks/advice — APPEND with comma
      if (type === "remarks" || type === "advice") {
         if (type === "remarks") setRemarks(prev => appendText(prev, text));
         if (type === "advice") setAdviceInstructions(prev => appendText(prev, text));
         return;
      }

      // Voice prescription uses the new intelligent matching flow
      if (type === "prescription") {
         await handleVoicePrescription(text);
         return;
      }

      // For diagnosis, use diseases_only extraction type
      const extractType = type === "diagnosis" ? "diseases_only" : type;

      try {
         const res = await api.post("/api/ai/extract", { text, type: extractType });
         const data = res.data?.data || res.data;
         console.log("AI RESPONSE:", data);
         applyExtractedData(data, extractType);
      } catch (err) {
         console.error(err);
      }
   };

   const handleFinalize = async () => {
      setSubmitting(true)
      try {
         const validMedicines = medicines.filter(m => m.name.trim() !== "").map(m => ({
            medicineName: m.name,
            composition: m.composition || "",
            dosageMorning: Number(m.m) || 0,
            dosageAfternoon: Number(m.a) || 0,
            dosageNight: Number(m.n) || 0,
            days: Number(m.duration) || 0,
            instructions: m.timing + (m.instruction ? " | " + m.instruction : "")
         }))
         const validClinicalNotes = (!clinicalNotes || clinicalNotes.toLowerCase() === 'none') ? "" : clinicalNotes.trim()
         const validRemarks = (!remarks || remarks.toLowerCase() === 'none') ? "" : remarks.trim()
         const combinedNotes = validClinicalNotes + (validRemarks ? "\nRemarks: " + validRemarks : "")

         await api.post(`/api/consultations/finalize`, {
            visitId: id,
            diagnosis,
            notes: combinedNotes,
            prescription: validMedicines,
            adviceInstructions,
            followUpDate,
            labPending,
            feeType
         })

         toast({ title: "Success", description: "Prescription finalized!" })
         navigate("/doctor/history")
      } catch (e) {
         console.error(e)
         toast({ title: "Error", description: "Finalization failed", variant: "destructive" })
      } finally {
         setSubmitting(false)
      }
   }

   const handleSaveVitals = async () => {
      if (!visit?.id) {
         toast({ title: "Error", description: "Visit not loaded yet", variant: "destructive" })
         return
      }

      try {
         console.log("Sending visitId:", visit.id)
         await api.put(`/api/vitals/${visit.id}`, {
            bloodPressure: vitalsTemp.bp || "",
            pulse: vitalsTemp.pulse || "",
            temperature: vitalsTemp.temp || "",
            weight: vitalsTemp.weight || "",
            height: vitalsTemp.height || ""
         })

         toast({ title: "Success", description: "Vitals updated" })

         setEditingVitals(false)
         const res = await api.get(`/api/visits/${visit.id}`)
         setVisit(res.data?.data || res.data)
      } catch (err) {
         console.error(err.response?.data || err.message)
         toast({ title: "Error", description: "Failed to save vitals", variant: "destructive" })
      }
   }

   if (loading) return <div className="p-32 flex flex-col items-center justify-center gap-4"><Loader2 className="w-12 h-12 animate-spin text-blue-500" />Loading...</div>
   if (!visit || !visit.id) return <div className="p-10 flex flex-col items-center justify-center gap-4 text-gray-500 font-bold">Failed to load consultation</div>

   return (
      <div className="w-full pt-6 px-4 md:px-6 lg:px-10 space-y-6 flex flex-col xl:flex-row gap-8 pb-32">

         {/* LEFT PANEL */}
         <div className="w-full xl:w-[340px] flex-shrink-0 space-y-6">
            {/* Patient Info */}
            <Card className="rounded-3xl border border-gray-100 shadow-sm bg-blue-50/30 overflow-hidden p-6 flex flex-col h-[180px] justify-center items-center text-center">
               <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl uppercase mb-3 text-center">
                  {(visit.patient?.name || "P").charAt(0)}
               </div>
               <h2 className="text-xl font-bold text-gray-900 leading-none mb-2">{visit.patient?.name || "Patient"}</h2>
               <p className="text-xs font-medium text-gray-500 mb-1">{visit.patient?.gender || "MALE"}, {new Date().getFullYear() - (new Date(visit.patient?.dateOfBirth || Date.now()).getFullYear() || 1990)} Years</p>
               <p className="text-xs font-bold text-gray-600">ID: p-{(visit.patient?.id || "").slice(-8).toUpperCase()}</p>
               {visit.patient?.uhid && <p className="text-[11px] font-black text-blue-600 mt-1 uppercase tracking-tight">UHID: {visit.patient.uhid}</p>}
               {visit.patient?.abha && <p className="text-[11px] font-black text-emerald-600 mt-0.5 uppercase tracking-tight">ABHA: {visit.patient.abha}</p>}
               {visit.patient?.bloodGroup && <p className="text-xs font-bold text-red-500 mt-1">Blood: {visit.patient.bloodGroup}</p>}
            </Card>

            {/* Vitals Signs Box */}
            <div>
               <div className="flex justify-between items-center mb-4 px-2 tracking-tight">
                  <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Vitals Signs</h3>
                  {editingVitals ? (
                     <Button type="button" onClick={handleSaveVitals} className="h-6 text-[10px] font-bold px-3">Save</Button>
                  ) : (
                     <button type="button" onClick={() => setEditingVitals(true)} className="text-[11px] font-bold text-gray-900 flex items-center gap-1 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-3 h-3" /> Edit
                     </button>
                  )}
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col p-4 rounded-3xl bg-white shadow-sm border border-gray-100 gap-2 h-26 justify-center">
                     <div className="flex items-center gap-2 text-red-500">
                        <span className="font-bold text-lg leading-none"></span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">BP</span>
                     </div>
                     <Input value={vitalsTemp.bp} onChange={(e) => setVitalsTemp({ ...vitalsTemp, bp: e.target.value })} disabled={!editingVitals} className="h-7 border-gray-200 mt-1 text-xs font-bold w-full" placeholder="--" />
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-white shadow-sm border border-gray-100 gap-2 h-26 justify-center">
                     <div className="flex items-center gap-2 text-pink-500">
                        <span className="font-bold text-lg leading-none"></span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">Heart Rate</span>
                     </div>
                     <Input value={vitalsTemp.pulse} onChange={(e) => setVitalsTemp({ ...vitalsTemp, pulse: e.target.value })} disabled={!editingVitals} className="h-7 border-gray-200 mt-1 text-xs font-bold w-full" placeholder="--" />
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-white shadow-sm border border-gray-100 gap-2 h-26 justify-center">
                     <div className="flex items-center gap-2 text-orange-500">
                        <span className="font-bold text-lg leading-none"></span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">Temperature</span>
                     </div>
                     <Input value={vitalsTemp.temp} onChange={(e) => setVitalsTemp({ ...vitalsTemp, temp: e.target.value })} disabled={!editingVitals} className="h-7 border-gray-200 mt-1 text-xs font-bold w-full" placeholder="--" />
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-white shadow-sm border border-gray-100 gap-2 h-26 justify-center">
                     <div className="flex items-center gap-2 text-blue-500">
                        <span className="font-bold text-lg leading-none"></span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">Weight</span>
                     </div>
                     <Input value={vitalsTemp.weight} onChange={(e) => setVitalsTemp({ ...vitalsTemp, weight: e.target.value })} disabled={!editingVitals} className="h-7 border-gray-200 mt-1 text-xs font-bold w-full" placeholder="--" />
                  </div>
                  <div className="flex flex-col p-4 rounded-3xl bg-white shadow-sm border border-gray-100 gap-2 h-26 justify-center col-span-2">
                     <div className="flex items-center gap-2 text-green-500">
                        <span className="font-bold text-lg leading-none"></span>
                        <span className="text-[10px] uppercase font-bold text-gray-500">Height (cm)</span>
                     </div>
                     <Input value={vitalsTemp.height} onChange={(e) => setVitalsTemp({ ...vitalsTemp, height: e.target.value })} disabled={!editingVitals} className="h-7 border-gray-200 mt-1 text-xs font-bold w-full" placeholder="--" />
                  </div>
               </div>
            </div>

            {/* Patient Complaints */}
            <div className="pt-2">
               <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-3">Patient Complaints</h3>
               <Card className="rounded-3xl border border-gray-100 shadow-sm bg-gray-50/50 p-5 min-h-[100px]">
                  <p className="text-sm font-bold text-gray-800 leading-relaxed shadow-none bg-transparent">
                     {visit.notes || "No initial observation provided."}
                  </p>
               </Card>
            </div>
         </div>

         {/* RIGHT PANEL */}
         <div className="flex-1 space-y-6 max-w-full">

            {/* Prescription Card */}
            <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white pb-4">
               <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white">
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Prescription</h2>
                  <div className="flex gap-2">
                     <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "prescription")} />
                     <button onClick={handleAddMedicine} className="rounded-full h-8 px-4 bg-gray-50 text-blue-600 border border-gray-100 hover:bg-blue-50 font-bold text-xs flex items-center gap-2 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add Medicine
                     </button>
                  </div>
               </div>

               <Table className="overflow-visible">
                  <TableHeader className="bg-transparent h-12">
                     <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-6 w-[25%]">Medicine Name</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[20%]">Composition</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center w-[120px]">Frequency</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[140px]">Timing</TableHead>
                        <TableHead className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-[80px]">Duration</TableHead>
                        <TableHead className="w-[40px] pr-4"></TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {(medicines || []).map((med, index) => (
                        <React.Fragment key={index}>
                        <TableRow className="hover:bg-transparent transition-all border-b border-gray-50 h-16 relative z-[50]">
                            <TableCell className="p-2 pl-6 relative z-[100]">
                               <div className="relative">
                                  <Input 
                                     placeholder="Search or type medicine..." 
                                     value={med.name} 
                                     onChange={(e) => {
                                        const val = e.target.value;
                                        updateMedicine(index, 'name', val);
                                        fetchMedicineSuggestions(index, val);
                                     }} 
                                     onFocus={() => {
                                        if (med.name.length >= 3) fetchMedicineSuggestions(index, med.name);
                                     }}
                                     onBlur={() => {
                                        setTimeout(() => {
                                           if (activeSearchIndex === index) {
                                              setActiveSearchIndex(null);
                                              setMedicineSuggestions([]);
                                           }
                                        }, 200);
                                     }}
                                     className="h-9 text-sm font-medium border-none bg-gray-50 rounded-full px-4 shadow-none focus-visible:ring-1 transition-colors w-full" 
                                  />
                                  
                                  {activeSearchIndex === index && medicineSuggestions.length > 0 && (
                                     <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-[501] max-h-72 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 w-[650px]">
                                        {medicineSuggestions.map((s, i) => (
                                           <div 
                                              key={i} 
                                              onMouseDown={(e) => {
                                                 e.preventDefault();
                                                 handleSelectMedicine(index, s);
                                              }}
                                              className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors border-b border-gray-50/50 last:border-none"
                                           >
                                              <div className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600">{s.name}</div>
                                              <div className="text-[11px] text-gray-400 mt-0.5 truncate font-medium">
                                                 {s.composition || 'NA'}
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  )}

                                  {/* Voice candidates dropdown — multiple matches from voice */}
                                  {voiceCandidates[index] && voiceCandidates[index].length > 0 && (
                                     <div className="absolute top-full left-0 mt-1.5 bg-white border-2 border-blue-200 shadow-2xl rounded-xl overflow-hidden z-[502] max-h-72 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 w-[650px]">
                                        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                                           <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">🎤 Multiple matches — select one</span>
                                           <button
                                              type="button"
                                              onClick={() => setVoiceCandidates(prev => { const u = { ...prev }; delete u[index]; return u; })}
                                              className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                                           >✕ Close</button>
                                        </div>
                                        {voiceCandidates[index].map((c, ci) => (
                                           <div
                                              key={ci}
                                              onClick={() => handleSelectVoiceCandidate(index, c)}
                                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer group transition-colors border-b border-gray-50/50 last:border-none"
                                           >
                                              <div className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600">{c.name}</div>
                                              <div className="text-[11px] text-gray-400 mt-0.5 truncate font-medium">
                                                 {c.composition || 'NA'}
                                              </div>
                                           </div>
                                        ))}
                                     </div>
                                  )}
                               </div>
                            </TableCell>
                           <TableCell className="p-2 relative z-[90]">
                              <div className="relative">
                                 <Input 
                                    placeholder="Search composition..." 
                                    value={med.composition} 
                                    onChange={(e) => {
                                       const val = e.target.value;
                                       updateMedicine(index, 'composition', val);
                                       fetchCompositionSuggestions(index, val);
                                    }}
                                    onFocus={() => {
                                       if ((med.composition || "").length >= 3) fetchCompositionSuggestions(index, med.composition);
                                    }}
                                    onBlur={() => {
                                       setTimeout(() => {
                                          if (activeCompositionIndex === index) {
                                             setActiveCompositionIndex(null);
                                             setCompositionSuggestions([]);
                                          }
                                       }, 200);
                                    }}
                                    className="h-9 text-sm font-medium border-none bg-gray-50/50 rounded-full px-4 shadow-none text-gray-400 focus-visible:ring-1 w-full" 
                                 />
                                 {activeCompositionIndex === index && compositionSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-[501] max-h-72 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100 w-[650px]">
                                       {compositionSuggestions.map((s, i) => (
                                          <div 
                                             key={i} 
                                             onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectComposition(index, s);
                                             }}
                                             className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors border-b border-gray-50/50 last:border-none"
                                          >
                                             <div className="text-[11px] text-gray-500 font-medium truncate">
                                                {s.composition || 'NA'}
                                             </div>
                                             <div className="text-[13px] font-semibold text-gray-800 group-hover:text-blue-600 mt-0.5">{s.name}</div>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           </TableCell>
                           <TableCell className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                 <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-gray-400">M</span>
                                    <Input type="number" step="0.5" min="0" value={med.m} onChange={(e) => updateMedicine(index, 'm', e.target.value)} className="h-7 w-10 p-0 text-center text-xs font-bold border-none bg-gray-50 rounded-md focus-visible:ring-1 shadow-none" />
                                 </div>
                                 <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-gray-400">A</span>
                                    <Input type="number" step="0.5" min="0" value={med.a} onChange={(e) => updateMedicine(index, 'a', e.target.value)} className="h-7 w-10 p-0 text-center text-xs font-bold border-none bg-gray-50 rounded-md focus-visible:ring-1 shadow-none" />
                                 </div>
                                 <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-bold text-gray-400">N</span>
                                    <Input type="number" step="0.5" min="0" value={med.n} onChange={(e) => updateMedicine(index, 'n', e.target.value)} className="h-7 w-10 p-0 text-center text-xs font-bold border-none bg-gray-50 rounded-md focus-visible:ring-1 shadow-none" />
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell className="p-2">
                              <Select value={med.timing || ""} onValueChange={(v) => updateMedicine(index, 'timing', v)}>
                                 <SelectTrigger className="h-9 text-xs font-medium border-none bg-gray-50 rounded-full shadow-none px-4 w-full text-center focus:ring-0"><SelectValue placeholder="Select..." /></SelectTrigger>
                                 <SelectContent className="rounded-xl border border-gray-100 shadow-2xl z-[99999] bg-white" position="popper" sideOffset={5}>
                                    <SelectItem value="After Food">After Food</SelectItem>
                                    <SelectItem value="Before Food">Before Food</SelectItem>
                                    <SelectItem value="Bedtime">Bedtime</SelectItem>
                                    <SelectItem value="Empty Stomach">Empty Stomach</SelectItem>
                                    <SelectItem value="SOS">SOS</SelectItem>
                                 </SelectContent>
                              </Select>
                           </TableCell>
                           <TableCell className="p-2 text-center">
                              <Input type="number" min="0" value={med.duration} onChange={(e) => updateMedicine(index, 'duration', e.target.value)} placeholder="0" className="h-9 text-sm font-medium border-none bg-gray-50 rounded-full text-center shadow-none w-[60px]" />
                           </TableCell>
                           <TableCell className="p-2 pr-4 text-right">
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeMedicine(index)} className="h-8 w-8 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shadow-none border-none">
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </TableCell>
                        </TableRow>
                        {/* Per-medicine instruction row */}
                         <TableRow key={`instruction-${index}`} className="hover:bg-transparent border-b border-gray-100 relative z-[40]">
                            <TableCell colSpan={6} className="py-2 px-6">
                               <div className="w-full bg-gray-50/80 rounded-2xl p-3 px-6 shadow-sm flex items-center gap-2 border border-gray-100">
                                  <span className="text-yellow-500 not-italic text-[11px] shrink-0">💡</span>
                                 <Input 
                                    placeholder="Instruction: e.g. Take this medicine 30 min after Dolo" 
                                    value={med.instruction || ""} 
                                    onChange={(e) => updateMedicine(index, 'instruction', e.target.value)} 
                                    className="border-none bg-transparent h-6 text-[11px] font-medium italic text-gray-500 shadow-none focus-visible:ring-0 px-0 placeholder:text-gray-400" 
                                 />
                              </div>
                           </TableCell>
                        </TableRow>
                        </React.Fragment>
                     ))}
                  </TableBody>
               </Table>

            </Card>

            <div className="grid grid-cols-2 gap-6 pt-2">
               <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col pt-2 min-h-[160px]">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gray-900">Clinical Diagnosis</h3>
                     <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "diagnosis")} small />
                  </div>
                  <Textarea
                     value={diagnosis}
                     onChange={(e) => setDiagnosis(e.target.value)}
                     placeholder="Enter diagnosis..."
                     className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 px-6 py-5 min-h-[120px] shadow-none font-medium text-gray-800 text-sm bg-transparent leading-relaxed"
                  />
               </Card>

               <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col pt-2 min-h-[160px]">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gray-900">Investigation</h3>
                     <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "remarks")} small />
                  </div>
                  <Textarea
                     value={remarks}
                     onChange={(e) => setRemarks(e.target.value)}
                     placeholder="Investigation..."
                     className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 px-6 py-5 min-h-[120px] shadow-none font-medium text-gray-800 text-sm bg-transparent leading-relaxed"
                  />
               </Card>
            </div>

            {/* Clinical Notes - Now placed below Diagnosis/Remarks as requested */}
            <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col pt-2">
               <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">Clinical Notes <span className="text-gray-400 font-normal">(Visible only to doctors)</span></h3>
                  <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "notes")} small />
               </div>
               <Textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter private clinical notes here..."
                  className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 px-6 py-5 min-h-[140px] shadow-none font-medium text-gray-600 text-[14px] bg-transparent leading-relaxed"
               />
            </Card>

            <div className="grid grid-cols-2 gap-6 pt-2">
               <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col pt-2 min-h-[180px]">
                  <div className="px-6 py-4 border-b border-gray-50">
                     <h3 className="text-sm font-bold text-gray-900">Follow-Up Date</h3>
                  </div>
                  <div className="p-8 pb-4">
                     <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold text-gray-900 px-8 shadow-none focus-visible:ring-1 text-lg mb-4"
                     />
                  </div>

                  {/* Lab Pending - nested in Follow-Up card */}
                  <div className="mx-6 mb-6 p-4 px-6 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between">
                     <div className="space-y-0.5">
                        <h3 className="text-[13px] font-bold text-gray-900">Lab Pending</h3>
                        <p className="text-[10px] text-gray-400 font-medium">Awaiting results</p>
                     </div>
                     <div
                        onClick={() => setLabPending(!labPending)}
                        className={`w-11 h-6 rounded-full cursor-pointer transition-all relative ${labPending ? 'bg-blue-600' : 'bg-gray-200'}`}
                     >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${labPending ? 'translate-x-5' : ''}`}></div>
                     </div>
                  </div>
               </Card>

               <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white overflow-hidden flex flex-col pt-2 min-h-[180px]">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gray-900">Advice / Instructions</h3>
                     <VoiceMicButton endpoint="/api/voice/extract" onExtractionSuccess={(text) => handleVoiceResult(text, "advice")} small />
                  </div>
                  <Textarea
                     value={adviceInstructions}
                     onChange={(e) => setAdviceInstructions(e.target.value)}
                     placeholder="Patient instructions for printing..."
                     className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 px-8 py-6 min-h-[140px] shadow-none font-medium text-gray-800 text-sm bg-transparent leading-relaxed"
                  />
               </Card>
            </div>
         <div className="bg-white border border-gray-100 p-8 px-10 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 mt-6 shadow-sm mb-12">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 flex items-center gap-2"><div className="w-4 h-4 rounded-full border border-green-500 flex items-center justify-center text-green-500 text-[8px]">✓</div> Select Fee Type</span>
                  <Select value={feeType} onValueChange={setFeeType}>
                     <SelectTrigger className="w-[160px] rounded-full border border-gray-200 bg-white shadow-sm font-medium text-gray-900 h-10 px-5 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent position="popper" sideOffset={5} className="rounded-2xl border border-gray-100 shadow-2xl z-[99999] bg-white p-2">
                        <SelectItem value="Type A" className="font-medium">Type A</SelectItem>
                        <SelectItem value="Type B" className="font-medium">Type B</SelectItem>
                        <SelectItem value="Free" className="font-medium text-red-500">Free</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
               <Button
                  type="button"
                  onClick={handleFinalize}
                  disabled={submitting}
                  className="rounded-full bg-blue-600 hover:bg-blue-700 h-11 px-8 text-sm font-bold shadow-lg shadow-blue-100/50 transition-all active:scale-95 flex items-center gap-2 text-white"
               >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : "Finalize Prescription"}
               </Button>
             </div>
          </div>
       </div>
    </div>
 )
}
