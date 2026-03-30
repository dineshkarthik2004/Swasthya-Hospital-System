import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import api from "@/services/api"

export default function PatientRegisterPage() {
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", age: "", gender: "MALE"
  })
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post("/auth/register", {
        ...formData,
        role: "PATIENT"
      })

      toast({ title: "Registration Successful", description: "You can now log in." })
      navigate("/login")
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.error || "Could not register account.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4 text-primary">
            <Activity className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create Patient Account</CardTitle>
          <CardDescription>
            Enter your details to register as a new patient.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (Required)</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {loading ? "Registering..." : "Register"}
            </Button>

            <div className="text-center text-sm mt-4">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
