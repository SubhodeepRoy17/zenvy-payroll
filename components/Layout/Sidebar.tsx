"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
  Building,
  Shield,
  Activity,
  Database,
  BarChart3,
  Menu,
  X,
  Home,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast.success("Logged out successfully")
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    } finally {
      setIsLoggingOut(false)
      if (isMobile) setIsMobileOpen(false)
    }
  }

  const userRole = user?.role || 'employee'
  
  const adminLinks = [
    { name: "Dashboard", icon: Home, href: "/admin-dashboard" },
    { name: "Companies", icon: Building, href: "/admin/companies" },
    { name: "Users", icon: Users, href: "/admin/users" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
    { name: "Audit Logs", icon: Database, href: "/admin/audit-logs" },
    { name: "System Health", icon: Activity, href: "/admin/system-health" },
  ]

  const hrLinks = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Employees", icon: Users, href: "/employees" },
    { name: "Payroll", icon: CreditCard, href: "/payroll" },
    { name: "Salary Slips", icon: FileText, href: "/salary-slips" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ]

  const employeeLinks = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/employee-dashboard" },
    { name: "Salary Slips", icon: FileText, href: "/employee-salary-slips" },
    { name: "Settings", icon: Settings, href: "/employee-settings" },
  ]

  let links = []
  switch (userRole) {
    case 'admin':
      links = adminLinks
      break
    case 'hr':
      links = hrLinks
      break
    default:
      links = employeeLinks
  }

  // Mobile sidebar overlay
  if (isMobile && isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
        <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border z-50 md:hidden flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold whitespace-nowrap">ZENVY</span>
              {userRole === 'admin' && (
                <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    userRole === 'admin' && link.href.includes('/admin/') ? "border-l-4 border-red-500" : ""
                  )}
                >
                  <link.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive
                        ? "text-sidebar-primary-foreground"
                        : "text-muted-foreground group-hover:text-sidebar-foreground",
                      userRole === 'admin' && link.href.includes('/admin/') ? "text-red-600" : ""
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{link.name}</span>
                    {userRole === 'admin' && link.href.includes('/admin/') && (
                      <span className="text-xs text-red-600 font-medium">Admin</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                {userRole === 'admin' && (
                  <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "user@email.com"}</p>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                userRole === 'admin' 
                  ? "bg-red-100 text-red-800"
                  : userRole === 'hr'
                  ? "bg-blue-100 text-blue-800"
                  : "bg-primary/10 text-primary"
              )}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full",
                "text-destructive hover:bg-destructive/10 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "group relative"
              )}
            >
              <LogOut className={cn("w-5 h-5 shrink-0", isLoggingOut && "animate-pulse")} />
              <span>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-sidebar text-sidebar-foreground md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col",
          isMobile ? "hidden" : isCollapsed ? "w-20" : "w-64",
          "md:flex"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border h-16">
          <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "hidden")}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold whitespace-nowrap">ZENVY</span>
            {userRole === 'admin' && (
              <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors hidden md:block"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  userRole === 'admin' && link.href.includes('/admin/') ? "border-l-4 border-red-500" : ""
                )}
              >
                <link.icon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    isActive
                      ? "text-sidebar-primary-foreground"
                      : "text-muted-foreground group-hover:text-sidebar-foreground",
                    userRole === 'admin' && link.href.includes('/admin/') ? "text-red-600" : ""
                  )}
                />
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{link.name}</span>
                    {userRole === 'admin' && link.href.includes('/admin/') && (
                      <span className="text-xs text-red-600 font-medium">Admin</span>
                    )}
                  </div>
                )}
                {isCollapsed && (
                  <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50">
                    {link.name}
                    {userRole === 'admin' && link.href.includes('/admin/') && " (Admin)"}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className={cn("flex flex-col space-y-2", isCollapsed ? "items-center" : "")}>
            {!isCollapsed && (
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                  {userRole === 'admin' && (
                    <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "user@email.com"}</p>
                <span className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1",
                  userRole === 'admin' 
                    ? "bg-red-100 text-red-800"
                    : userRole === 'hr'
                    ? "bg-blue-100 text-blue-800"
                    : "bg-primary/10 text-primary"
                )}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "text-destructive hover:bg-destructive/10 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "group relative",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut className={cn("w-5 h-5 shrink-0", isLoggingOut && "animate-pulse")} />
              {!isCollapsed && (
                <span>
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-14 bg-popover text-popover-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}