import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    console.log("[LoginPage] Attempting login for:", email);

    const result = await login(email, password)
    
    if (result.success) {
      // User requirements: Do NOT clear form or reset loading before navigation
      console.log("[LoginPage] Login successful. API Response Data:", result.rawPayload);
      
      const role = (result.role || "").toUpperCase();
      toast({ title: "Login Successful", description: `Signed in as ${role}.` });

      // Based on user role mapping:
      if (role === "RECEPTIONIST" || role === "ADMIN") {
         console.log("[LoginPage] Navigating to Receptionist Dashboard...");
         navigate("/receptionist/dashboard")
      } else if (role === "DOCTOR") {
         console.log("[LoginPage] Navigating to Doctor Dashboard...");
         navigate("/doctor/dashboard")
      } else {
         console.log("[LoginPage] Navigating to Patient Dashboard...");
         navigate("/patient/records") // User requested patient/dashboard, our route is records
      }
    } else {
      console.error("[LoginPage] Login failed:", result.error);
      setError(result.error)
      toast({ title: "Login Failed", description: result.error || "Please check your credentials.", variant: "destructive" })
      setLoading(false); // Only allow retry on failure
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4 text-primary">
            <Activity className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Swasthya Clinic</CardTitle>
          <CardDescription>
            Enter your email and password to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </Button>
            <div className="text-center text-sm mt-4">
               Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
