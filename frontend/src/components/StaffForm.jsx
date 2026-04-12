import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function StaffForm({ initialData = {}, onSubmit, isSubmitting, onCancel, isEdit = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    password: initialData.password || "",
    role: initialData.role || "DOCTOR",
    phone: initialData.phone || "",
    specialization: initialData.specialization || "",
    licenseNumber: initialData.licenseNumber || "",
    qualification: initialData.qualification || "",
    clinicName: initialData.clinicName || "",
    doorNo: initialData.doorNo || "",
    street: initialData.street || "",
    area: initialData.area || "",
    city: initialData.city || "",
    state: initialData.state || "",
    pincode: initialData.pincode || ""
  });

  useEffect(() => {
    // Only update if we actually switch "id" to avoid infinite loops with inline {} 
    if (initialData && Object.keys(initialData).length > 0) {
       setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Full Name</Label>
          <Input name="name" value={formData.name || ""} onChange={handleChange} required className="h-12 rounded-2xl bg-gray-50/50" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Email Address</Label>
          <Input type="email" name="email" value={formData.email || ""} onChange={handleChange} required className="h-12 rounded-2xl bg-gray-50/50" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Role</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}>
            <SelectTrigger className="h-12 rounded-2xl bg-gray-50/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DOCTOR">Doctor</SelectItem>
              <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
              <SelectItem value="LAB_TECH">Lab Tech</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isEdit && (
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password || ""}
                onChange={handleChange}
                required={!isEdit}
                className="h-12 rounded-2xl bg-gray-50/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {formData.role === "DOCTOR" && (
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-black text-gray-800 tracking-wider">Doctor & Clinic Information</h3>
          
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Specialization</Label>
              <Input name="specialization" value={formData.specialization || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Qualification</Label>
              <Input name="qualification" value={formData.qualification || ""} onChange={handleChange} placeholder="MBBS, MD" className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">License ID</Label>
              <Input name="licenseNumber" value={formData.licenseNumber || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Clinic Name</Label>
              <Input name="clinicName" value={formData.clinicName || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Phone</Label>
              <Input name="phone" value={formData.phone || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Door No</Label>
              <Input name="doorNo" value={formData.doorNo || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Street</Label>
              <Input name="street" value={formData.street || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Area</Label>
              <Input name="area" value={formData.area || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">City</Label>
              <Input name="city" value={formData.city || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">State</Label>
              <Input name="state" value={formData.state || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
             <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-gray-400 ml-1">Pincode</Label>
              <Input name="pincode" value={formData.pincode || ""} onChange={handleChange} className="h-12 rounded-2xl bg-gray-50/50" />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1 h-12 rounded-[1rem] font-bold" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-[1rem] font-bold shadow-xl shadow-blue-100" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEdit ? "Save Changes" : "Create Account")}
        </Button>
      </div>
    </form>
  );
}
