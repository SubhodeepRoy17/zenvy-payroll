"use client"

import { useState, useEffect, SetStateAction } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Card } from "@/components/Common/Card"
import { useAuth } from "@/hooks/useAuth"
import { Zap, Eye, EyeOff, Github, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<"admin" | "hr" | "employee">("hr")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth()

  // Redirect based on user role after authentication
  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      console.log('🚀 User authenticated, role:', user.role, 'Actual user:', user);
      
      // Determine redirect path based on actual user role from context
      let redirectPath = "/dashboard"; // Default
      
      switch (user.role) {
        case 'admin':
          redirectPath = "/admin-dashboard";
          console.log('🔀 Redirecting admin to:', redirectPath);
          break;
        case 'hr':
          redirectPath = "/dashboard";
          console.log('🔀 Redirecting HR to:', redirectPath);
          break;
        case 'employee':
          redirectPath = "/employee-dashboard";
          console.log('🔀 Redirecting employee to:', redirectPath);
          break;
        default:
          redirectPath = "/dashboard";
          console.log('🔀 Redirecting default to:', redirectPath);
      }
      
      // Use router.replace to prevent going back to login
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    // Admin access restriction - only allow admin login if email is admin
    if (role === "admin") {
      // You can add specific admin email checks here if needed
      // For now, just allow any admin login attempt
      console.log('🔐 Admin login attempt for:', email);
    }

    setIsLoading(true)

    try {
      console.log('🔄 Starting login process for role:', role);
      
      // Call login with the selected role
      await login(email, password, role)
      
      toast.success("Login successful!")
      console.log('✅ Login function completed');
      
      // Note: The useEffect above will handle the redirect
      // based on the actual user role returned from the server
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Special handling for admin login attempts
      if (role === "admin") {
        if (error.message?.includes("permissions") || error.message?.includes("Insufficient")) {
          toast.error("Admin access denied. Please use admin credentials.");
        } else if (error.message?.includes("User not found")) {
          toast.error("Admin account not found. Please check your credentials.");
        } else {
          toast.error(error.message || "Admin login failed. Please try again.");
        }
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to determine redirect path
  const getRedirectPath = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return "/admin-dashboard";
      case 'hr':
        return "/dashboard";
      case 'employee':
        return "/employee-dashboard";
      default:
        return "/dashboard";
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    )
  }

  // If already authenticated, show redirecting message
  if (isAuthenticated && user) {
    const redirectPath = getRedirectPath(user.role);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-6">
          <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">
            Logged in as <span className="font-semibold text-primary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
          </p>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting to {user.role === 'admin' ? 'Admin' : user.role === 'hr' ? 'HR' : 'Employee'} Dashboard...</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.href = redirectPath}
        >
          Click here if not redirected
        </Button>
      </div>
    )
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
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground mt-2">Please enter your details to sign in</p>
        </div>

        <Card className="p-2" title={undefined} description={undefined} footer={undefined}>
          <div className="flex p-1 bg-muted rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole("hr")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === "hr"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              HR Admin
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === "admin"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRole("employee")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === "employee"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={isLoading}
            >
              Employee
            </button>
          </div>

          {/* Admin login warning */}
          {role === "admin" && (
            <div className="mb-4 px-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Admin Access:</strong> Only authorized administrators can log in with this role.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 p-4">
            <Input 
              label="Email address" 
              type="email" 
              placeholder="name@company.com" 
              required 
              value={email}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <div className="relative">
              <Input 
                label="Password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setPassword(e.target.value)}
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
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="rounded border-input text-primary focus:ring-primary" 
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="text-sm font-medium">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </a>
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
                  {role === "admin" ? "Admin Login..." : "Signing in..."}
                </>
              ) : (
                role === "admin" ? "Login as Administrator" : `Sign In as ${role === "hr" ? "HR Admin" : "Employee"}`
              )}
            </Button>
          </form>

          <div className="relative my-6 px-4">
            <div className="absolute inset-0 flex items-center px-4">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 px-4 pb-4">
            <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
              <Github className="w-4 h-4 mr-2" />
              Github
            </Button>
            <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>
        </Card>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Need admin access? Contact system administrator.</p>
            <p>Demo credentials: 
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded mx-1">
                admin@zenvy.com / admin123
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}