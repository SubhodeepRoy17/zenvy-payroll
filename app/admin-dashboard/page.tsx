// app/admin-dashboard/page.tsx
"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building, 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  Database,
  Key,
  Bell,
  FileText,
  CreditCard,
  Globe,
  Server,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCog,
  Lock,
  Activity,
  Cpu,
  Database as DatabaseIcon,
  Network,
  ShieldCheck,
  Calendar,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { AdminService } from "@/services/admin-service"
import { apiService } from "@/services/api-service"
import { CreateUserForm } from "@/components/Admin/CreateUserForm"
import { EditUserForm } from "@/components/Admin/EditUserForm"
import { formatRelativeTime, formatPreciseTime } from '@/utils/time-utils';

interface SystemStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface User {
  company: any
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  employeeId?: string;
}

interface Company {
  id: string;
  name: string;
  employees: number;
  status: 'active' | 'inactive' | 'pending';
  created: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

interface LoadingState {
  stats: boolean;
  users: boolean;
  companies: boolean;
  logs: boolean;
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [systemStats, setSystemStats] = useState<SystemStat[]>([
    { label: "Total Companies", value: "0", change: "+0", trend: "stable", icon: Building, color: "text-blue-600" },
    { label: "Active Users", value: "0", change: "+0", trend: "stable", icon: Users, color: "text-green-600" },
    { label: "System Health", value: "98%", change: "Stable", trend: "stable", icon: Server, color: "text-purple-600" },
    { label: "API Requests", value: "0", change: "+0%", trend: "stable", icon: Activity, color: "text-amber-600" },
  ])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isCreatingCompany, setIsCreatingCompany] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [loading, setLoading] = useState<LoadingState>({
    stats: true,
    users: true,
    companies: true,
    logs: true,
  })
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({})
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [usersPage, setUsersPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard')
      toast.error('Access denied. Admin privileges required.')
    }
  }, [user, router])

  // Fetch system statistics
  const fetchSystemStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const response = await AdminService.getSystemStats() as { success: boolean; data: any }
      if (response.success) {
        const stats = response.data.stats
        
        setSystemStats([
          { 
            label: "Total Companies", 
            value: stats.companies.total.toString(), 
            change: `+${stats.companies.active}`, 
            trend: stats.companies.active > 0 ? "up" : "stable", 
            icon: Building, 
            color: "text-blue-600" 
          },
          { 
            label: "Active Users", 
            value: stats.users.active.toString(), 
            change: `+${stats.users.byRole.hr + stats.users.byRole.admin}`, 
            trend: stats.users.active > 0 ? "up" : "stable", 
            icon: Users, 
            color: "text-green-600" 
          },
          { 
            label: "System Health", 
            value: stats.system.health.uptime, 
            change: "Stable", 
            trend: "stable", 
            icon: Server, 
            color: "text-purple-600" 
          },
          { 
            label: "Active Employees", 
            value: stats.employees.active.toString(), 
            change: `+${stats.employees.byType.fullTime}`, 
            trend: stats.employees.active > 0 ? "up" : "stable", 
            icon: Activity, 
            color: "text-amber-600" 
          },
        ])
      }
    } catch (error: any) {
      console.error('Failed to fetch system stats:', error)
      toast.error('Failed to load system statistics')
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  // Fetch users
    const fetchUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }))
    try {
        const response = await AdminService.getUsers({
        page: 1,
        limit: 10,
        sortBy: 'lastLogin',
        sortOrder: 'desc'
        })
        
        if (response.success) {
        const apiUsers = response.data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department || user.company?.name || 'N/A',
            lastActive: user.lastLogin 
            ? formatRelativeTime(user.lastLogin)  // Use relative time here
            : 'Never',
            lastLogin: user.lastLogin, // Keep the raw date for sorting
            status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspended',
            company: user.company ? {
            id: user.company.id,
            name: user.company.name,
            isActive: user.company.isActive,
            } : null,
            employeeId: user.employeeId || '',
            isEmployeeActive: user.isEmployeeActive
        }))
        setUsers(apiUsers)
        }
    } catch (error: any) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to load users')
    } finally {
        setLoading(prev => ({ ...prev, users: false }))
    }
    }

  // Fetch companies
  const fetchCompanies = async () => {
    setLoading(prev => ({ ...prev, companies: true }))
    try {
      const response = await apiService.get('/api/companies', {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }) as { success: boolean; data: { companies: any[] } }
      
      if (response.success) {
        const apiCompanies = response.data.companies.map((company: any) => ({
          id: company.id,
          name: company.name,
          employees: 0, // Will be updated in separate call
          status: (company.isActive ? 'active' : 'inactive') as 'active' | 'inactive' | 'pending',
          created: new Date(company.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }))
        setCompanies(apiCompanies)
        
        // Fetch employee counts for each company
        fetchEmployeeCounts(apiCompanies.map((c: any) => c.id))
      }
    } catch (error: any) {
      console.error('Failed to fetch companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(prev => ({ ...prev, companies: false }))
    }
  }

  // Fetch employee counts for companies
  const fetchEmployeeCounts = async (companyIds: string[]) => {
    try {
      const counts: Record<string, number> = {}
      
      // Using Promise.all to fetch all counts in parallel
      await Promise.all(
        companyIds.map(async (companyId) => {
          try {
            const response = await apiService.get('/api/employees', {
              companyId,
              isActive: true,
              limit: 1,
              page: 1
            }) as { success: boolean; data: { pagination?: { total: number } } }
            
            if (response.success) {
              counts[companyId] = response.data.pagination?.total || 0
            }
          } catch (error) {
            console.error(`Failed to fetch employee count for company ${companyId}:`, error)
            counts[companyId] = 0
          }
        })
      )
      
      setEmployeeCounts(counts)
      
      // Update companies with employee counts
      setCompanies(prev => prev.map(company => ({
        ...company,
        employees: counts[company.id] || 0
      })))
    } catch (error) {
      console.error('Failed to fetch employee counts:', error)
    }
  }

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoading(prev => ({ ...prev, logs: true }))
    try {
      const response = await AdminService.getAuditLogs({
        page: 1,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'desc'
      })
      
      if (response.success) {
        const apiLogs = response.data.logs.map((log: any) => ({
          id: log.id,
          timestamp: new Date(log.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          user: log.user.email,
          action: log.action.charAt(0).toUpperCase() + log.action.slice(1),
          details: log.changes 
            ? typeof log.changes === 'string' 
              ? log.changes 
              : JSON.stringify(log.changes, null, 2)
            : 'No details',
          ip: log.ipAddress || 'N/A'
        }))
        setSystemLogs(apiLogs)
      }
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(prev => ({ ...prev, logs: false }))
    }
  }

  // Load data when tab changes or user is admin
  useEffect(() => {
    if (user?.role === 'admin') {
      const loadData = async () => {
        await Promise.all([
          fetchSystemStats(),
          fetchCompanies(),
          fetchUsers(),
          fetchAuditLogs()
        ])
      }
      loadData()
    }
  }, [user, activeTab])

  const handleCreateCompany = () => {
    setIsCreatingCompany(true)
    toast.info('Redirecting to company creation...')
    setTimeout(() => {
      router.push('/admin/companies/create')
    }, 500)
  }

  const handleCreateUser = async () => {
    setIsCreatingUser(true)
    try {
      // For now, redirect to user creation page
      // In future, you could implement a modal instead
      toast.info('Redirecting to user creation...')
      setTimeout(() => {
        router.push('/admin/users/create')
      }, 500)
    } catch (error) {
      toast.error('Failed to create user')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    toast.warning(`Delete user ${userName}?`, {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await AdminService.deleteUser(userId)
            setUsers(users.filter(u => u.id !== userId))
            toast.success('User deleted successfully')
          } catch (error: any) {
            toast.error(error.message || 'Failed to delete user')
          }
        }
      }
    })
  }

  const handleSuspendUser = async (userId: string, userName: string) => {
    try {
      await AdminService.updateUser(userId, { isActive: false })
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'suspended' } : u
      ))
      toast.warning(`User ${userName} suspended`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to suspend user')
    }
  }

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      await AdminService.updateUser(userId, { isActive: true })
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'active' } : u
      ))
      toast.success(`User ${userName} activated`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate user')
    }
  }

  const handleActivateCompany = async (companyId: string, companyName: string) => {
    try {
      await apiService.put(`/api/companies/${companyId}`, { isActive: true })
      setCompanies(companies.map(c => 
        c.id === companyId ? { ...c, status: 'active' } : c
      ))
      toast.success(`Company ${companyName} activated`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate company')
    }
  }

  const handleDeactivateCompany = async (companyId: string, companyName: string) => {
    toast.warning(`Deactivate company ${companyName}?`, {
      action: {
        label: 'Deactivate',
        onClick: async () => {
          try {
            await apiService.put(`/api/companies/${companyId}`, { isActive: false })
            setCompanies(companies.map(c => 
              c.id === companyId ? { ...c, status: 'inactive' } : c
            ))
            toast.success(`Company ${companyName} deactivated`)
          } catch (error: any) {
            toast.error(error.message || 'Failed to deactivate company')
          }
        }
      }
    })
  }

  const handleRunBackup = async () => {
    toast.info('Starting system backup...')
    // Simulate backup process
    setTimeout(() => {
      toast.success('Backup completed successfully')
    }, 2000)
  }

  const handleClearLogs = async () => {
    toast.warning('Clear all audit logs?', {
      action: {
        label: 'Clear',
        onClick: async () => {
          try {
            await AdminService.clearAuditLogs()
            setSystemLogs([])
            toast.success('Audit logs cleared')
          } catch (error: any) {
            toast.error(error.message || 'Failed to clear logs')
          }
        }
      }
    })
  }

  const handleSystemHealthCheck = async () => {
    toast.info('Running system health check...')
    try {
      await fetchSystemStats()
      toast.success('System health check completed')
    } catch (error) {
      toast.error('Health check failed')
    }
  }

  const handleRefreshData = async () => {
    toast.info('Refreshing data...')
    try {
      await Promise.all([
        fetchSystemStats(),
        fetchCompanies(),
        fetchUsers(),
        fetchAuditLogs()
      ])
      toast.success('Data refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh data')
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Admin privileges required to access this page.</p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="mt-4"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"Admin Dashboard" }/>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">System Administration</h2>
              <p className="text-muted-foreground text-sm">
                Manage companies, users, and system configurations
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshData}
                className="flex items-center gap-2 text-sm"
                disabled={loading.stats || loading.users || loading.companies || loading.logs}
                size={isMobile ? "sm" : "default"}
              >
                <RefreshCw className={`w-4 h-4 ${loading.stats ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSystemHealthCheck}
                className="flex items-center gap-2 text-sm"
                size={isMobile ? "sm" : "default"}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Health Check</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRunBackup}
                className="flex items-center gap-2 text-sm"
                size={isMobile ? "sm" : "default"}
              >
                <DatabaseIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Run Backup</span>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            {/* Responsive Tabs List */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex w-max min-w-full">
                  <TabsTrigger value="overview" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Stats</span>
                  </TabsTrigger>
                  <TabsTrigger value="companies" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <Building className="w-4 h-4" />
                    <span>Companies</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <Users className="w-4 h-4" />
                    <span>Users</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Security</span>
                    <span className="sm:hidden">Sec</span>
                  </TabsTrigger>
                  <TabsTrigger value="system" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">System</span>
                    <span className="sm:hidden">Sys</span>
                  </TabsTrigger>
                  <TabsTrigger value="logs" className="px-3 py-2 text-xs md:text-sm font-medium data-[state=active]:bg-background rounded-lg flex items-center gap-2 flex-1 md:flex-none">
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Audit Logs</span>
                    <span className="sm:hidden">Logs</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Overview Tab - Mobile Responsive */}
            <TabsContent value="overview" className="space-y-4 md:space-y-6">
              {/* System Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {systemStats.map((stat) => (
                  <Card key={stat.label} className="p-4 md:p-6" title={undefined} description={undefined} footer={undefined}>
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg bg-opacity-10 ${stat.color.replace('text', 'bg')}`}>
                        {loading.stats ? (
                          <Loader2 className={`w-4 h-4 md:w-5 md:h-5 animate-spin ${stat.color}`} />
                        ) : (
                          <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-800' :
                        stat.trend === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="mt-3 md:mt-4">
                      <div className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</div>
                      <div className="text-xl md:text-2xl font-bold truncate">
                        {loading.stats ? (
                          <div className="h-6 md:h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                        ) : (
                          stat.value
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card title="Quick Actions" description="Common administrative tasks" footer={undefined} className={undefined}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
                  <Button 
                    onClick={handleCreateCompany}
                    className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 md:gap-3"
                    disabled={isCreatingCompany || loading.companies}
                    size="sm"
                  >
                    {isCreatingCompany ? (
                      <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                    ) : (
                      <Building className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                    <div className="text-center">
                      <div className="font-bold text-sm md:text-base">Create Company</div>
                      <div className="text-xs opacity-90">Set up new organization</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={handleCreateUser}
                    variant="outline"
                    className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 md:gap-3"
                    disabled={isCreatingUser || loading.users}
                    size="sm"
                  >
                    {isCreatingUser ? (
                      <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
                    ) : (
                      <UserCog className="w-6 h-6 md:w-8 md:h-8" />
                    )}
                    <div className="text-center">
                      <div className="font-bold text-sm md:text-base">Add User</div>
                      <div className="text-xs text-muted-foreground">Create admin/HR user</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={() => router.push('/admin/settings')}
                    variant="outline"
                    className="h-auto py-4 md:py-6 flex flex-col items-center justify-center gap-2 md:gap-3"
                    size="sm"
                  >
                    <Settings className="w-6 h-6 md:w-8 md:h-8" />
                    <div className="text-center">
                      <div className="font-bold text-sm md:text-base">System Settings</div>
                      <div className="text-xs text-muted-foreground">Configure global settings</div>
                    </div>
                  </Button>
                </div>
              </Card>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <Card title="Recent Users" description="Recently active system users" footer={undefined} className={undefined}>
                  {loading.users ? (
                    <div className="space-y-3 md:space-y-4 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-gray-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4 mt-4">
                      {users.slice(0, 4).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              user.status === 'active' ? 'bg-green-500' :
                              user.status === 'inactive' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{user.name}</div>
                              <div className="text-sm text-muted-foreground truncate">{user.role}</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <div className="text-xs md:text-sm truncate">{user.lastActive}</div>
                            <div className={`text-xs ${
                              user.status === 'active' ? 'text-green-600' :
                              user.status === 'inactive' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {user.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card title="System Status" description="Current system health and metrics" footer={undefined} className={undefined}>
                  {loading.stats ? (
                    <div className="space-y-3 md:space-y-4 mt-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-gray-200" />
                            <div className="h-4 w-32 bg-gray-200 rounded"></div>
                          </div>
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm">Database</span>
                        </div>
                        <span className="text-sm font-medium">Healthy</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm">API Server</span>
                        </div>
                        <span className="text-sm font-medium">Online</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm">Storage</span>
                        </div>
                        <span className="text-sm font-medium">85% used</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm">Backup</span>
                        </div>
                        <span className="text-sm font-medium">Last: 2 hours ago</span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            {/* Companies Tab - Mobile Responsive */}
            <TabsContent value="companies" className="space-y-4 md:space-y-6">
              <Card title="Company Management" description="Manage all organizations in the system" footer={undefined} className={undefined}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">All Companies</h3>
                    <p className="text-sm text-muted-foreground">
                      {loading.companies ? 'Loading...' : `${companies.length} companies registered`}
                    </p>
                  </div>
                  <Button onClick={handleCreateCompany} disabled={loading.companies} className="w-full sm:w-auto">
                    {loading.companies ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    New Company
                  </Button>
                </div>

                {loading.companies ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-b p-3 animate-pulse">
                        <div className="grid grid-cols-5 gap-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Mobile View */}
                      <div className="sm:hidden space-y-3">
                        {companies.map((company) => (
                          <div key={company.id} className="border rounded-lg p-3 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{company.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {company.employees} employees
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                company.status === 'active' ? 'bg-green-100 text-green-800' :
                                company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {company.status}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Created: {company.created}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => router.push(`/companies/${company.id}`)}
                                className="flex-1"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => router.push(`/admin/companies/edit/${company.id}`)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {company.status === 'active' ? (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeactivateCompany(company.id, company.name)}
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleActivateCompany(company.id, company.name)}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <table className="hidden sm:table w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">Company</th>
                            <th className="text-left p-3 font-medium">Employees</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Created</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companies.map((company) => (
                            <tr key={company.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <div className="font-medium">{company.name}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium">{company.employees}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  company.status === 'active' ? 'bg-green-100 text-green-800' :
                                  company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {company.status}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {company.created}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => router.push(`/companies/${company.id}`)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => router.push(`/admin/companies/edit/${company.id}`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {company.status === 'active' ? (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleDeactivateCompany(company.id, company.name)}
                                    >
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleActivateCompany(company.id, company.name)}
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>

              {/* Company Configuration - Responsive */}
              <Card title="Global Company Settings" description="Configure default settings for all companies" footer={undefined} className={undefined}>
                <div className="space-y-4 md:space-y-6 mt-4">
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Currency</label>
                      <select className="w-full p-2 border rounded-lg bg-background text-sm">
                        <option>Indian Rupee (₹)</option>
                        <option>US Dollar ($)</option>
                        <option>Euro (€)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Timezone</label>
                      <select className="w-full p-2 border rounded-lg bg-background text-sm">
                        <option>Asia/Kolkata (IST)</option>
                        <option>America/New_York (EST)</option>
                        <option>Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Default Payroll Settings</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input label="Payment Day" defaultValue="31" className="text-sm" />
                      <Input label="Working Days/Month" defaultValue="26" className="text-sm" />
                      <Input label="Overtime Rate (₹/hr)" defaultValue="200" className="text-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="w-full md:w-auto">Save Global Settings</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Users Tab - Mobile Responsive */}
            <TabsContent value="users" className="space-y-4 md:space-y-6">
              <Card title="User Management" description="Manage system users and permissions" footer={undefined} className={undefined}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">System Users</h3>
                    <p className="text-sm text-muted-foreground">
                      {loading.users ? 'Loading...' : `${users.filter(u => u.status === 'active').length} active users`}
                    </p>
                  </div>
                  <Button onClick={() => setIsCreatingUser(true)} disabled={loading.users} className="w-full sm:w-auto">
                    {loading.users ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add User
                  </Button>
                </div>

                {/* User Creation Modal */}
                {isCreatingUser && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Create New User</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreatingUser(false)}
                        >
                          ✕
                        </Button>
                      </div>
                      
                      <CreateUserForm 
                        onSuccess={() => {
                          setIsCreatingUser(false);
                          fetchUsers();
                        }}
                        onCancel={() => setIsCreatingUser(false)}
                      />
                    </div>
                  </div>
                )}

                {/* User Edit Modal */}
                {editingUser && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Edit User</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(null)}
                        >
                          ✕
                        </Button>
                      </div>
                      
                      <EditUserForm 
                        user={editingUser}
                        onSuccess={() => {
                          setEditingUser(null);
                          fetchUsers();
                        }}
                        onCancel={() => setEditingUser(null)}
                      />
                    </div>
                  </div>
                )}

                {loading.users ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-b p-3 animate-pulse">
                        <div className="grid grid-cols-5 gap-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Mobile View */}
                      <div className="sm:hidden space-y-3">
                        {users.map((user) => (
                          <div key={user.id} className="border rounded-lg p-3 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                <div className="mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                    user.role === 'hr' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs md:text-sm truncate">{user.lastActive}</div>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                                  user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-sm">
                              <div className="font-medium">{user.company?.name || 'No company'}</div>
                              {user.employeeId && (
                                <div className="text-xs text-muted-foreground">ID: {user.employeeId}</div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEditingUser(user)}
                                className="flex-1"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user.status === 'active' ? (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleSuspendUser(user.id, user.name)}
                                  className="flex-1"
                                >
                                  <Lock className="w-4 h-4 text-yellow-600" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleActivateUser(user.id, user.name)}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                disabled={user.role === 'admin' && users.filter(u => u.role === 'admin' && u.status === 'active').length <= 1}
                                className="flex-1"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View */}
                      <table className="hidden sm:table w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Role</th>
                            <th className="text-left p-3 font-medium">Company</th>
                            <th className="text-left p-3 font-medium">Last Active</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-left p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                  user.role === 'hr' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="p-3">
                                {user.company ? (
                                  <div className="text-sm">
                                    <div className="font-medium">{user.company.name}</div>
                                    {user.employeeId && (
                                      <div className="text-xs text-muted-foreground">ID: {user.employeeId}</div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">No company</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {user.lastActive}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800' :
                                  user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => setEditingUser(user)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {user.status === 'active' ? (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleSuspendUser(user.id, user.name)}
                                    >
                                      <Lock className="w-4 h-4 text-yellow-600" />
                                    </Button>
                                  ) : (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleActivateUser(user.id, user.name)}
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    disabled={user.role === 'admin' && users.filter(u => u.role === 'admin' && u.status === 'active').length <= 1}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination - Responsive */}
                    {users.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {users.length} users
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                            disabled={usersPage === 1}
                            className="flex-1 sm:flex-none"
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-center flex-1 sm:flex-none">
                            Page {usersPage}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUsersPage(prev => prev + 1)}
                            className="flex-1 sm:flex-none"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Security Tab - Responsive */}
            <TabsContent value="security" className="space-y-4 md:space-y-6">
              <Card title="Security Settings" description="Configure system security and access controls" footer={undefined} className={undefined}>
                <div className="space-y-4 md:space-y-6 mt-4">
                  {/* Two-Factor Authentication */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                      Two-Factor Authentication
                    </h4>
                    <div className="p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="font-medium text-sm md:text-base">Enforce 2FA for all users</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Require two-factor authentication for all user accounts</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" id="enforce-2fa" />
                          <label htmlFor="enforce-2fa" className="block w-11 h-6 bg-gray-300 rounded-full cursor-pointer">
                            <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 mt-1" />
                          </label>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <select className="p-2 border rounded-lg bg-background text-sm">
                          <option>Email OTP</option>
                          <option>SMS OTP</option>
                          <option>Authenticator App</option>
                        </select>
                        <Input label="Grace Period (days)" defaultValue="14" className="text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Password Policies */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Key className="w-4 h-4 md:w-5 md:h-5" />
                      Password Policies
                    </h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Password Length</label>
                        <Input type="number" defaultValue="8" label={undefined} className="text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password Expiry</label>
                        <Input type="number" defaultValue="90" label={undefined} className="text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max Login Attempts</label>
                        <Input type="number" defaultValue="5" label={undefined} className="text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Session Timeout</label>
                        <Input type="number" defaultValue="30" label={undefined} className="text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* IP Whitelisting */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Network className="w-4 h-4 md:w-5 md:h-5" />
                      IP Whitelisting
                    </h4>
                    <div className="p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="font-medium text-sm md:text-base">Enable IP Restrictions</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" id="ip-restrictions" />
                          <label htmlFor="ip-restrictions" className="block w-11 h-6 bg-gray-300 rounded-full cursor-pointer">
                            <span className="block w-4 h-4 bg-white rounded-full transform translate-x-1 mt-1" />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Input placeholder="Enter IP address" label={undefined} className="flex-1 text-sm" />
                          <Button size="sm" className="w-full sm:w-auto">Add</Button>
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          Current allowed IPs: 192.168.1.0/24, 10.0.0.0/8
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="w-full md:w-auto">Save Security Settings</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* System Tab - Responsive */}
            <TabsContent value="system" className="space-y-4 md:space-y-6">
              <Card title="System Configuration" description="Manage system-wide settings and maintenance" footer={undefined} className={undefined}>
                <div className="space-y-4 md:space-y-6 mt-4">
                  {/* Database Management */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Database className="w-4 h-4 md:w-5 md:h-5" />
                      Database Management
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <Button variant="outline" className="flex flex-col items-center py-4 md:py-6 gap-2" size="sm">
                        <Download className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-xs md:text-sm">Export Data</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center py-4 md:py-6 gap-2" size="sm">
                        <Upload className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-xs md:text-sm">Import Data</span>
                      </Button>
                      <Button variant="outline" className="flex flex-col items-center py-4 md:py-6 gap-2" size="sm">
                        <RefreshCw className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-xs md:text-sm">Optimize DB</span>
                      </Button>
                    </div>
                  </div>

                  {/* Backup & Recovery */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <DatabaseIcon className="w-4 h-4 md:w-5 md:h-5" />
                      Backup & Recovery
                    </h4>
                    <div className="p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <p className="font-medium text-sm md:text-base">Auto Backup Schedule</p>
                          <p className="text-xs md:text-sm text-muted-foreground">Automatically backup system data</p>
                        </div>
                        <div className="relative">
                          <input type="checkbox" className="sr-only" id="auto-backup" />
                          <label htmlFor="auto-backup" className="block w-11 h-6 bg-primary rounded-full cursor-pointer">
                            <span className="block w-4 h-4 bg-white rounded-full transform translate-x-6 mt-1" />
                          </label>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <select className="p-2 border rounded-lg bg-background text-sm">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                        <Input label="Retention (days)" defaultValue="30" className="text-sm" />
                        <Input label="Backup Time" type="time" defaultValue="02:00" className="text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* System Maintenance */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Cpu className="w-4 h-4 md:w-5 md:h-5" />
                      System Maintenance
                    </h4>
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm md:text-base">Clear Cache</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Clear system cache and temporary files</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Clear Now</Button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm md:text-base">Rebuild Indexes</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Rebuild database indexes</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Rebuild</Button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm md:text-base">System Diagnostics</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Run system diagnostics</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Run</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Management */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                      <Globe className="w-4 h-4 md:w-5 md:h-5" />
                      API Management
                    </h4>
                    <div className="p-4 border rounded-lg">
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm md:text-base">API Rate Limiting</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Requests per minute per IP</p>
                          </div>
                          <Input className="w-full sm:w-32 text-sm" defaultValue="60" label={undefined} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm md:text-base">Generate API Key</p>
                            <p className="text-xs md:text-sm text-muted-foreground">Create new API access key</p>
                          </div>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">Generate</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Audit Logs Tab - Responsive */}
            <TabsContent value="logs" className="space-y-4 md:space-y-6">
              <Card title="Audit Logs" description="System activity and security logs" footer={undefined} className={undefined}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">System Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      {loading.logs ? 'Loading...' : `Track all system actions and changes`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClearLogs} className="flex-1 sm:flex-none">
                      Clear Logs
                    </Button>
                    <Button variant="outline" onClick={fetchAuditLogs} disabled={loading.logs} className="flex-1 sm:flex-none">
                      {loading.logs ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                </div>

                {loading.logs ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="flex justify-between">
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                              <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : systemLogs.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <FileText className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                    <p className="text-muted-foreground">No system activity recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    {systemLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-full flex-shrink-0 ${
                          log.action.includes('Created') || log.action.includes('Register') ? 'bg-green-100 text-green-600' :
                          log.action.includes('Updated') || log.action.includes('Modified') ? 'bg-blue-100 text-blue-600' :
                          log.action.includes('Deleted') || log.action.includes('Removed') ? 'bg-red-100 text-red-600' :
                          log.action.includes('Login') ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {log.action.includes('Created') || log.action.includes('Register') ? <Plus className="w-4 h-4" /> :
                           log.action.includes('Updated') || log.action.includes('Modified') ? <Edit className="w-4 h-4" /> :
                           log.action.includes('Deleted') || log.action.includes('Removed') ? <Trash2 className="w-4 h-4" /> :
                           log.action.includes('Login') ? <Key className="w-4 h-4" /> :
                           <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm md:text-base truncate">{log.action}</p>
                              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{log.details}</p>
                            </div>
                            <div className="text-right text-xs md:text-sm flex-shrink-0">
                              <div className="text-muted-foreground truncate">{log.timestamp}</div>
                              <div className="font-mono text-xs truncate">{log.ip}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs md:text-sm">
                            <span className="text-muted-foreground">By: </span>
                            <span className="font-medium truncate">{log.user}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Log Filters */}
                <div className="mt-6 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-4 text-sm md:text-base">Filter Logs</h4>
                  <div className="grid md:grid-cols-4 gap-4">
                    <select className="p-2 border rounded-lg bg-background text-sm">
                      <option>All Actions</option>
                      <option>User Actions</option>
                      <option>System Actions</option>
                      <option>Security Events</option>
                    </select>
                    <Input type="date" label="From Date" className="text-sm" />
                    <Input type="date" label="To Date" className="text-sm" />
                    <Input placeholder="Search logs..." label={undefined} className="text-sm" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
                    <Button variant="outline" className="w-full sm:w-auto">Apply Filters</Button>
                    <Button className="w-full sm:w-auto">Export Logs</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

function setIsCollapsed(arg0: boolean) {
    throw new Error("Function not implemented.")
}
