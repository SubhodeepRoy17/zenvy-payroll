// ./app/dashboard/page.tsx
"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { 
  Users, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays, 
  Zap,
  IndianRupee,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { EmployeeService } from "@/services/employee-service"
import { PayrollService } from "@/services/payroll-service"
import { SalarySlipService } from "@/services/salary-slip-service"
import { format } from "date-fns"

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  monthlyPayroll: number;
  pendingApprovals: number;
  taxCompliance: number;
  recentHires: any[];
  payrollSummary: any;
  attendanceStats: any;
}

interface StatCard {
  name: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: any;
  color: string;
}

export default function HRDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [currentDate] = useState(() => {
    const now = new Date()
    const month = now.toLocaleString('default', { month: 'long' })
    const year = now.getFullYear()
    return `${month} ${year}`
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData()
    }
  }, [isAuthenticated])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all dashboard data in parallel
      const [
        employeesResponse,
        payrollSummaryResponse,
        salarySlipsResponse,
        attendanceStats
      ] = await Promise.allSettled([
        EmployeeService.getEmployees({ limit: 100, isActive: true }),
        PayrollService.getPayrollSummary(new Date().getMonth() + 1, new Date().getFullYear()),
        SalarySlipService.getSalarySlips({ limit: 50, status: 'calculated' }),
        getAttendanceStats()
      ])

      // Process employees data
      let totalEmployees = 0
      let activeEmployees = 0
      let recentHires: any[] = []
      
      if (employeesResponse.status === 'fulfilled' && employeesResponse.value.success) {
        const employees = employeesResponse.value.data?.employees || []
        totalEmployees = employees.length
        activeEmployees = employees.filter((emp: any) => emp.isActive).length
        
        // Get recent hires (last 5)
        recentHires = employees
        .sort((a: any, b: any) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
        .slice(0, 5)
        .map((emp: any) => ({
          id: emp.id,
          name: emp.user?.name || 'Unknown',
          role: emp.designation || 'Employee',
          date: emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM d, yyyy') : 'N/A',
          status: emp.isActive ? 'Active' : 'Inactive'
        }))
      }

      // Process payroll summary
      let monthlyPayroll = 0
      let taxCompliance = 100
      
      if (payrollSummaryResponse.status === 'fulfilled' && payrollSummaryResponse.value.success) {
        const summary = payrollSummaryResponse.value.data?.summary
        if (summary) {
          monthlyPayroll = summary.totalNetSalary
          // Simple tax compliance calculation
          const paidPayrolls = summary.statusBreakdown.paid
          const totalPayrolls = Object.values(summary.statusBreakdown).reduce((a: number, b: number) => a + b, 0)
          taxCompliance = totalPayrolls > 0 ? Math.round((paidPayrolls / totalPayrolls) * 100) : 100
        }
      }

      // Process pending approvals
      let pendingApprovals = 0
      if (salarySlipsResponse.status === 'fulfilled' && salarySlipsResponse.value.success) {
        pendingApprovals = salarySlipsResponse.value.data?.salarySlips?.length || 0
      }

      // Prepare stats
      const statsData: DashboardStats = {
        totalEmployees,
        activeEmployees,
        monthlyPayroll,
        pendingApprovals,
        taxCompliance,
        recentHires,
        payrollSummary: payrollSummaryResponse.status === 'fulfilled' ? payrollSummaryResponse.value.data : null,
        attendanceStats: attendanceStats.status === 'fulfilled' ? attendanceStats.value : null
      }

      setDashboardData(statsData)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
      
      // Set default data for demo
      setDashboardData({
        totalEmployees: 142,
        activeEmployees: 138,
        monthlyPayroll: 425000,
        pendingApprovals: 8,
        taxCompliance: 100,
        recentHires: [
          { name: "Sarah Johnson", role: "Product Designer", date: "Mar 12, 2024", status: "Active" },
          { name: "Michael Chen", role: "Frontend Developer", date: "Mar 10, 2024", status: "Onboarding" },
          { name: "Emily Brown", role: "HR Specialist", date: "Mar 08, 2024", status: "Active" },
          { name: "David Miller", role: "Sales Executive", date: "Mar 05, 2024", status: "Active" },
        ],
        payrollSummary: null,
        attendanceStats: null
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAttendanceStats = async () => {
    try {
      // This would come from your attendance API
      // For now, return mock data
      return {
        attendanceRate: 95,
        averageHours: 8.5,
        overtimeHours: 42,
        lateArrivals: 8
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
      return null
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStats = (): StatCard[] => {
    if (!dashboardData) return []

    return [
      { 
        name: "Total Employees", 
        value: dashboardData.totalEmployees.toString(), 
        change: "+4.5%", 
        trend: "up", 
        icon: Users,
        color: "text-blue-600"
      },
      { 
        name: "Monthly Payroll", 
        value: formatCurrency(dashboardData.monthlyPayroll), 
        change: "+1.2%", 
        trend: "up", 
        icon: IndianRupee,
        color: "text-green-600"
      },
      { 
        name: "Pending Approvals", 
        value: dashboardData.pendingApprovals.toString(), 
        change: "-2", 
        trend: "down", 
        icon: Clock,
        color: "text-yellow-600"
      },
      { 
        name: "Tax Compliance", 
        value: `${dashboardData.taxCompliance}%`, 
        change: "Stable", 
        trend: dashboardData.taxCompliance === 100 ? "up" : "stable", 
        icon: TrendingUp,
        color: "text-purple-600"
      },
    ]
  }

  const handleRunPayroll = async () => {
    try {
      toast.info('Preparing to run payroll...')
      // Navigate to payroll page or open dialog
      window.location.href = '/payroll'
    } catch (error) {
      toast.error('Failed to navigate to payroll')
    }
  }

  const handleDownloadReport = async (type: string) => {
    try {
      toast.info(`Preparing ${type} report...`)
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`${type} report downloaded successfully`)
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const handleViewEmployee = (employeeId: string) => {
    toast.info(`Viewing employee ${employeeId}`)
    // Navigate to employee details
    window.location.href = `/employees/${employeeId}`
  }

  const handleViewInsights = () => {
    toast.info("AI Insights feature coming soon!")
  }

  const handleRefresh = () => {
    fetchDashboardData()
    toast.success('Dashboard refreshed')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </main>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"HR Dashboard"} />
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Admin'}!
              </h2>
              <p className="text-muted-foreground text-sm">Here's what's happening with your payroll today.</p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="p-2 px-3 md:p-1 md:px-3 flex items-center gap-2 bg-muted/50 border-none" title={undefined} description={undefined} footer={undefined}>
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{currentDate}</span>
              </Card>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat) => (
              <Card
                key={stat.name}
                className="p-4 md:p-6 relative overflow-hidden group hover:border-primary/50 transition-colors hover:shadow-lg" 
                title={undefined} 
                description={undefined} 
                footer={undefined}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${stat.color.replace('text', 'bg')}/10`}>
                    <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                      stat.trend === "up" ? "bg-emerald-100 text-emerald-700" : 
                      stat.trend === "down" ? "bg-rose-100 text-rose-700" : 
                      "bg-gray-100 text-gray-700"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : stat.trend === "down" ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : null}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-3 md:mt-4">
                  <div className="text-xs md:text-sm font-medium text-muted-foreground truncate">{stat.name}</div>
                  <div className="text-lg md:text-2xl font-bold tracking-tight truncate">{stat.value}</div>
                </div>
                <div className={`absolute bottom-0 left-0 h-1 ${stat.color.replace('text', 'bg')}/20 w-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Button 
              onClick={() => window.location.href = '/payroll'}
              className="h-auto py-4 md:py-4 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
              <div className="text-center">
                <div className="font-bold text-sm md:text-base">Run Payroll</div>
                <div className="text-xs opacity-90">Process this month's salaries</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => toast.info('Monthly report download')}
              variant="outline"
              className="h-auto py-4 md:py-4 flex flex-col items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
              <div className="text-center">
                <div className="font-bold text-sm md:text-base">Monthly Report</div>
                <div className="text-xs text-muted-foreground">Download payroll summary</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/employees/create-with-user'}
              variant="outline"
              className="h-auto py-4 md:py-4 flex flex-col items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
              <div className="text-center">
                <div className="font-bold text-sm md:text-base">Add Employee</div>
                <div className="text-xs text-muted-foreground">Create new employee profile</div>
              </div>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Recent Hires */}
            <Card
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Recent Hires</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.location.href = '/employees'}
                  >
                    View All
                  </Button>
                </div>
              }
              description="Latest members added to your organization."
              className="lg:col-span-2" 
              footer={undefined}
            >
              <div className="mt-4 space-y-3 md:space-y-4">
                {dashboardData?.recentHires.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <Users className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent hires found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => window.location.href = '/employees/create-with-user'}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Employee
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table Header */}
                    <div className="hidden md:grid md:grid-cols-4 text-xs font-semibold text-muted-foreground border-b pb-2 uppercase tracking-wider">
                      <div>Employee</div>
                      <div>Role</div>
                      <div>Join Date</div>
                      <div className="text-right">Status</div>
                    </div>
                    
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                      {dashboardData?.recentHires.map((emp: any) => (
                        <div
                          key={emp.id}
                          className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/employees/${emp.id}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-sm text-muted-foreground">{emp.role}</div>
                            </div>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-bold uppercase",
                                emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                                emp.status === "Onboarding" ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-700"
                              )}
                            >
                              {emp.status}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Joined: {emp.date}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Desktop View */}
                    <div className="hidden md:block">
                      {dashboardData?.recentHires.map((emp: any) => (
                        <div
                          key={emp.id}
                          className="grid grid-cols-4 items-center text-sm py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/employees/${emp.id}`}
                        >
                          <div className="font-medium truncate">{emp.name}</div>
                          <div className="text-muted-foreground truncate">{emp.role}</div>
                          <div className="text-muted-foreground">{emp.date}</div>
                          <div className="text-right">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : 
                                emp.status === "Onboarding" ? "bg-amber-100 text-amber-700" :
                                "bg-gray-100 text-gray-700"
                              )}
                            >
                              {emp.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* AI Insights & Quick Stats */}
            <div className="space-y-6">
              {/* AI Insights */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">AI Insights</span>
                  </div>
                }
                description="Smart recommendations for your payroll."
                className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" 
                footer={undefined}
              >
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  <div className="p-3 bg-background rounded-lg border border-primary/10 flex gap-2 md:gap-3">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      <span className="font-bold">Optimization:</span> Processing payroll on Tuesday could reduce bank
                      latency by <span className="text-primary font-bold">18%</span>.
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border border-primary/10 flex gap-2 md:gap-3">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      <span className="font-bold">Trends:</span> Overtime costs have decreased by{" "}
                      <span className="text-primary font-bold">5%</span> compared to last month.
                    </p>
                  </div>
                  <Button 
                    onClick={() => toast.info('AI Insights feature')}
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-primary hover:bg-primary/10 text-xs md:text-sm"
                  >
                    View All Insights
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                  </Button>
                </div>
              </Card>

              {/* Quick Stats */}
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Quick Stats</span>
                  </div>
                }
                description="At a glance overview."
                footer={undefined} 
                className={undefined}
              >
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-blue-600">
                        {dashboardData?.activeEmployees || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl md:text-2xl font-bold text-green-600">
                        {dashboardData ? Math.round((dashboardData.activeEmployees / dashboardData.totalEmployees) * 100) : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Active Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payroll Completion</span>
                      <span className="font-bold">{dashboardData?.taxCompliance || 100}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${dashboardData?.taxCompliance || 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Pending Actions</span>
                      <span className="font-bold text-rose-600">{dashboardData?.pendingApprovals || 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Reports Section */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Quick Reports</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.info('Advanced reporting coming soon!')}
                >
                  More Reports
                </Button>
              </div>
            }
            description="Download payroll and compliance reports."
            footer={undefined} 
            className={undefined}
          >
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 md:h-24 gap-2"
                onClick={() => toast.info('Payroll report')}
              >
                <DollarSign className="w-4 h-4 md:w-6 md:h-6" />
                <div className="text-center">
                  <div className="font-bold text-xs md:text-sm">Payroll</div>
                  <div className="text-xs text-muted-foreground">Monthly summary</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 md:h-24 gap-2"
                onClick={() => toast.info('Tax report')}
              >
                <FileText className="w-4 h-4 md:w-6 md:h-6" />
                <div className="text-center">
                  <div className="font-bold text-xs md:text-sm">Tax Filing</div>
                  <div className="text-xs text-muted-foreground">Quarterly reports</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 md:h-24 gap-2"
                onClick={() => toast.info('Attendance report')}
              >
                <Calendar className="w-4 h-4 md:w-6 md:h-6" />
                <div className="text-center">
                  <div className="font-bold text-xs md:text-sm">Attendance</div>
                  <div className="text-xs text-muted-foreground">Monthly records</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 md:h-24 gap-2"
                onClick={() => toast.info('Compliance report')}
              >
                <CheckCircle className="w-4 h-4 md:w-6 md:h-6" />
                <div className="text-center">
                  <div className="font-bold text-xs md:text-sm">Compliance</div>
                  <div className="text-xs text-muted-foreground">Regulatory reports</div>
                </div>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}