import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Loader2, CheckCircle2, History, Clock, Upload, FileSpreadsheet, FileText, FileImage, File } from "lucide-react";
import api from "@/services/api";

export default function MedicineManagement() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        productName: "",
        composition: "",
        productForm: "Tablet"
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Load initial logs/history if needed, or just track session adds
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, productForm: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast({ title: "Error", description: "Please select a file first", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            setUploading(true);
            const res = await api.post("/api/medicines/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.success) {
                toast({ title: "Success", description: "File uploaded and processed successfully." });
                
                const newLog = {
                    id: Date.now(),
                    name: `File: ${selectedFile.name}`,
                    form: "Bulk Upload",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'Success'
                };
                setLogs(prev => [newLog, ...prev]);
                setSelectedFile(null);
                // Reset file input
                const fileInput = document.getElementById('medicine-file-upload');
                if (fileInput) fileInput.value = "";
            }
        } catch (err) {
            console.error("Error uploading file:", err);
            toast({ 
                title: "Error", 
                description: err.response?.data?.error || "Failed to upload file", 
                variant: "destructive" 
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productName.trim()) {
            toast({ title: "Error", description: "Product name is required", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/api/medicines/add", formData);
            if (res.data.success) {
                toast({ title: "Success", description: "Medicine added successfully to the hospital list." });
                
                // Add to local session logs
                const newLog = {
                    id: Date.now(),
                    name: formData.productName,
                    form: formData.productForm,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'Success'
                };
                setLogs(prev => [newLog, ...prev]);
                
                setFormData({ productName: "", composition: "", productForm: "Tablet" });
            }
        } catch (err) {
            console.error("Error adding medicine:", err);
            toast({ 
                title: "Error", 
                description: err.response?.data?.error || "Failed to add medicine", 
                variant: "destructive" 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Medicine Management</h1>
                    <p className="text-gray-400 text-sm font-medium mt-2">Add new medicines to your hospital's private list.</p>
                </div>
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <Pill className="w-8 h-8" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <Card className="rounded-[2.5rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white mb-10">
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-emerald-500" />
                                Add New Medicine
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Product Name</Label>
                                    <Input 
                                        name="productName" 
                                        value={formData.productName} 
                                        onChange={handleChange} 
                                        placeholder="e.g. Paracetamol 500mg"
                                        className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all text-lg font-medium" 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Product Form</Label>
                                    <Select value={formData.productForm} onValueChange={handleSelectChange}>
                                        <SelectTrigger className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all text-lg font-medium">
                                            <SelectValue placeholder="Select Form" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
                                            <SelectItem value="Tablet">Tablet</SelectItem>
                                            <SelectItem value="Capsule">Capsule</SelectItem>
                                            <SelectItem value="Syrup">Syrup</SelectItem>
                                            <SelectItem value="Injection">Injection</SelectItem>
                                            <SelectItem value="Ointment">Ointment</SelectItem>
                                            <SelectItem value="Drops">Drops</SelectItem>
                                            <SelectItem value="Inhaler">Inhaler</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Composition / Generic Name</Label>
                                <Input 
                                    name="composition" 
                                    value={formData.composition} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Acetaminophen"
                                    className="h-14 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all text-lg font-medium" 
                                />
                            </div>

                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-black shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        "Add Medicine to List"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* BULK UPLOAD SECTION */}
                    <Card className="rounded-[2.5rem] border border-gray-100 shadow-2xl p-0 overflow-hidden bg-white">
                        <div className="p-10 border-b border-gray-50 bg-gray-50/30">
                            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-indigo-500" />
                                Bulk Upload Medicines
                            </h2>
                            <p className="text-gray-400 text-xs font-medium mt-1">Upload Excel, PDF, or JPG files containing medicine lists.</p>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    id="medicine-file-upload"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept=".xlsx,.xls,.xlsb,.csv,.pdf,.jpg,.jpeg,.png"
                                />
                                <div className={`border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${selectedFile ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 group-hover:border-indigo-200 group-hover:bg-gray-50/50'}`}>
                                    {selectedFile ? (
                                        <>
                                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-500 shadow-md mb-4">
                                                {selectedFile.name.match(/\.(xlsx|xls|xlsb|csv)$/i) ? <FileSpreadsheet className="w-8 h-8" /> : 
                                                 selectedFile.name.match(/\.(pdf)$/i) ? <FileText className="w-8 h-8" /> :
                                                 selectedFile.name.match(/\.(jpg|jpeg|png)$/i) ? <FileImage className="w-8 h-8" /> :
                                                 <File className="w-8 h-8" />}
                                            </div>
                                            <p className="text-lg font-black text-gray-800 truncate max-w-xs">{selectedFile.name}</p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); document.getElementById('medicine-file-upload').value = ""; }}
                                                className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline cursor-pointer relative z-20"
                                            >
                                                Remove File
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-8 h-8" />
                                            </div>
                                            <p className="text-lg font-black text-gray-400">Click to select or drag & drop</p>
                                            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-2">Excel, CSV, PDF, or Images</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button 
                                    onClick={handleFileUpload}
                                    disabled={!selectedFile || uploading}
                                    className={`w-full h-16 rounded-2xl text-lg font-black shadow-lg transition-all active:scale-[0.98] ${selectedFile ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                                >
                                    {uploading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 mr-2" />
                                            Upload and Process List
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* LOGS / RECENT ACTIVITY COLUMN */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <History className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Activity Log</h3>
                    </div>

                    <div className="space-y-4">
                        {logs.length === 0 ? (
                            <div className="p-10 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-3">
                                <Clock className="w-10 h-10 text-gray-200" />
                                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest leading-loose">No medicines added <br/> in this session yet</p>
                            </div>
                        ) : (
                            logs.map(log => (
                                <div key={log.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-start gap-4 animate-in slide-in-from-right duration-500">
                                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-black text-gray-900 truncate pr-2">{log.name}</p>
                                            <span className="text-[10px] font-black text-gray-400 uppercase shrink-0">{log.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-500 rounded-md uppercase tracking-tighter">{log.form}</span>
                                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Added Successfully</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
