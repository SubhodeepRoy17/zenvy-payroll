"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Card } from "@/components/Common/Card"
import { useAuth } from "@/hooks/useAuth"
import { Zap, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const { register } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { name, email, password, confirmPassword } = formData
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Only HR role remains
      await register(name, email, password, confirmPassword, "hr")
      
      toast.success("Registration successful!")
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">ZENVY</span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Create HR Manager Account</h2>
          <p className="text-muted-foreground mt-2">Join ZENVY Payroll Management System</p>
        </div>

        <Card className="p-6" title={undefined} description={undefined} footer={undefined}>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input 
              label="Full Name" 
              type="text" 
              placeholder="John Doe" 
              required 
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />

            <Input 
              label="Work Email" 
              type="email" 
              placeholder="john.doe@company.com" 
              required 
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />

            <div className="relative">
              <Input 
                label="Password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8.5 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div className="relative">
              <Input 
                label="Confirm Password" 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8.5 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1 rounded border-input text-primary focus:ring-primary" 
                required
                disabled={isLoading}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input 
                type="checkbox" 
                id="work-email" 
                className="mt-1 rounded border-input text-primary focus:ring-primary" 
                disabled={isLoading}
              />
              <label htmlFor="work-email" className="text-sm text-muted-foreground">
                I confirm this is my official work email address
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create HR Manager Account"
              )}
            </Button>
          </form>

          <div className="pt-4">
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            <Link href="/login">
              <Button 
                variant="outline" 
                className="w-full bg-transparent"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign in to existing account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}