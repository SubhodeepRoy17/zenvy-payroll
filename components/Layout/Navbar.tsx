"use client"

import { Bell, Search, Moon, Sun, User, Shield, Settings as SettingsIcon, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

interface NavbarProps {
  title: string
}

export function Navbar({ title }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    setMounted(true)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      toast.success("Logged out successfully")
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    }
  }

  const handleProfileClick = () => {
    if (user?.role === 'admin') {
      router.push("/admin/settings")
    }
    else if (user?.role === 'employee') { 
      router.push("/employee-settings")
    }
    else {
      router.push("/settings")
    }
  }

  const handleAdminDashboard = () => {
    if (user?.role === 'admin') {
      router.push("/admin-dashboard")
    }
  }

  const handleSecurityClick = () => {
    if (user?.role === 'admin') {
      router.push("/admin-dashboard?tab=security")
    } else {
      toast.info("Security settings coming soon!")
    }
  }

  const handleThemeToggle = () => {
    if (!mounted) return
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (isMobile) setIsSearchOpen(false)
    toast.info("Search feature coming soon!")
  }

  const handleNotificationsClick = () => {
    toast.info("Notifications center coming soon!")
  }

  const getUserInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserRole = () => {
    if (!user?.role) return "Employee"
    const roleMap: Record<string, string> = {
      'admin': 'Administrator',
      'hr': 'HR Manager',
      'employee': 'Employee'
    }
    return roleMap[user.role] || user.role.charAt(0).toUpperCase() + user.role.slice(1)
  }

  // Mobile search bar
  if (isMobile && isSearchOpen) {
    return (
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-4 flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 mr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-9 bg-muted/50 border-none focus-visible:ring-1"
              autoFocus
            />
          </div>
        </form>
        <button
          onClick={() => setIsSearchOpen(false)}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>
    )
  }

  // Show loading state
  if (!mounted) {
    return (
      <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg md:text-xl font-semibold truncate max-w-[200px] md:max-w-none">{title}</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    )
  }

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Left side - Title */}
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className="text-lg md:text-xl font-semibold truncate max-w-[150px] md:max-w-none">
          {title}
          {user?.role === 'admin' && (
            <span className="hidden md:inline ml-2 text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search button for mobile */}
        {isMobile && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Search form for desktop */}
        {!isMobile && (
          <form onSubmit={handleSearch} className="relative w-64 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees, reports..."
              className="pl-10 h-9 bg-muted/50 border-none focus-visible:ring-1"
            />
          </form>
        )}

        {/* Admin dashboard button */}
        {user?.role === 'admin' && !isMobile && (
          <button
            onClick={handleAdminDashboard}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors relative"
            aria-label="Admin Dashboard"
          >
            <Shield className="w-5 h-5 text-red-600" />
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors hidden sm:block"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <button 
          onClick={handleNotificationsClick}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="relative">
              <Avatar className="h-8 w-8 cursor-pointer ring-offset-2 hover:ring-2 hover:ring-primary/20 transition-all">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className={cn(
                    user?.role === 'admin' 
                      ? "bg-red-100 text-red-800"
                      : user?.role === 'hr'
                      ? "bg-blue-100 text-blue-800"
                      : "bg-primary/10 text-primary"
                  )}>
                    {getUserInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              {user?.role === 'admin' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-background" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col space-y-1">
              <div className="font-medium flex items-center gap-2 truncate">
                {user?.name || "User"}
                {user?.role === 'admin' && (
                  <Shield className="w-3 h-3 text-red-600 shrink-0" />
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</div>
              <div className="mt-1">
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  user?.role === 'admin' 
                    ? "bg-red-100 text-red-800"
                    : user?.role === 'hr'
                    ? "bg-blue-100 text-blue-800"
                    : "bg-primary/10 text-primary"
                )}>
                  {getUserRole()}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleProfileClick}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              {user?.role === 'admin' ? 'Admin Settings' : 'Profile Settings'}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleSecurityClick}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </DropdownMenuItem>
            
            {user?.role === 'admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAdminDashboard}>
                  <Shield className="mr-2 h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">Admin Dashboard</span>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Helper function for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}