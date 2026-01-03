"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Input } from "@/components/Common/Input"
import { Button } from "@/components/Common/Button"
import { Search, Filter, Plus, Calendar, Users, Download, Eye, CheckCircle, Loader2, ChevronDown } from "lucide-react"
import { useState, useEffect, SetStateAction } from "react"
import { useAuth } from "@/hooks/useAuth"
import { PayrollService } from "@/services/payroll-service"
import { toast } from "sonner"
import { format } from "date-fns"
import { PayrollRunDialog } from "@/components/Payroll/PayrollRunDialog"

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: string;
  totalNetSalary: number;
  employeeCount: number;
  periodFrom: Date;
  periodTo: Date;
  processedAt: Date;
}

export default function PayrollPage() {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([])
  const [filteredRuns, setFilteredRuns] = useState<PayrollRun[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const [summary, setSummary] = useState({
    activeCount: 0,
    completedCount: 0,
    totalAmount: 0,
    year: new Date().getFullYear()
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchPayrollRuns()
    }
  }, [isAuthenticated, selectedYear])

  const fetchPayrollRuns = async () => {
    try {
      setIsLoading(true)
      const response = await PayrollService.getPayrollRuns(selectedYear)
      
      if (response.success && response.data) {
        setPayrollRuns(response.data.runs)
        setFilteredRuns(response.data.runs)
        setSummary(response.data.summary)
      }
    } catch (error: any) {
      console.error('Error fetching payroll runs:', error)
      toast.error('Failed to load payroll data')
      setPayrollRuns([])
      setFilteredRuns([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const filtered = payrollRuns.filter(run => {
      const monthName = getMonthName(run.month)
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        monthName.toLowerCase().includes(searchLower) ||
        run.year.toString().includes(searchLower) ||
        run.status.toLowerCase().includes(searchLower)
      
      const matchesStatus = selectedStatus === "all" || run.status === selectedStatus
      
      return matchesSearch && matchesStatus
    })
    setFilteredRuns(filtered)
  }, [searchTerm, selectedStatus, payrollRuns])

  const handleRunPayroll = async (data: any) => {
    try {
      toast.info('Running payroll... This may take a moment.')
      const response = await PayrollService.runPayroll({
        month: data.month,
        year: data.year,
        periodFrom: new Date(data.year, data.month - 1, 1),
        periodTo: new Date(data.year, data.month, 0),
        employeeIds: data.employeeIds,
        force: data.force
      })
      
      if (response.success) {
        toast.success(`Payroll run completed successfully! Processed ${response.data?.summary.success} employees.`)
        fetchPayrollRuns()
        setIsRunDialogOpen(false)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to run payroll')
    }
  }

  const handleViewRun = (run: PayrollRun) => {
    window.location.href = `/payroll/list?month=${run.month}&year=${run.year}`
  }

  const handleDownloadReports = async (run: PayrollRun) => {
    try {
      toast.info(`Downloading reports for ${getMonthName(run.month)} ${run.year}...`)
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Reports downloaded for ${getMonthName(run.month)} ${run.year}`)
    } catch (error: any) {
      toast.error('Failed to download reports')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      calculated: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Calculated' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' }
    }
    
    return config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const activeRuns = filteredRuns.filter(run => 
    run.year === currentYear && run.month === currentMonth
  )
  
  const historyRuns = filteredRuns.filter(run => 
    !(run.year === currentYear && run.month === currentMonth)
  )

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"Payroll Management" }/>
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Run Payroll</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Manage and process salary disbursements.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="text-xs sm:text-sm bg-primary/10 px-2 sm:px-3 py-1.5 rounded-lg whitespace-nowrap">
                <span className="font-semibold">{summary.activeCount} active</span> • 
                <span className="text-muted-foreground ml-1 sm:ml-2">{summary.completedCount} completed</span>
              </div>
              <Button
                onClick={() => setIsRunDialogOpen(true)}
                className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                size="sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                New Payroll Cycle
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Search runs..."
                  value={searchTerm}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm h-9 sm:h-10" label={undefined}                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden ml-2"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
            
            {/* Mobile Filters Dropdown */}
            {showFilters && (
              <div className="sm:hidden p-3 border rounded-lg space-y-3 bg-card">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm bg-background"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="calculated">Calculated</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-medium">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value))
                    }}
                    className="w-full p-2 border rounded-lg text-sm bg-background"
                  >
                    {[2026, 2025, 2024, 2023, 2022].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-background w-40"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="calculated">Calculated</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value))
                }}
                className="px-3 py-2 border rounded-lg text-sm bg-background w-32"
              >
                {[2026, 2025, 2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <div className="flex items-center gap-2 ml-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchPayrollRuns}
                >
                  <Loader2 className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Total Amount</div>
              <div className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(summary.totalAmount)}</div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-100">
              <div className="text-xs sm:text-sm text-green-600 font-medium">Completed</div>
              <div className="text-lg sm:text-2xl font-bold">{summary.completedCount}</div>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl border border-yellow-100">
              <div className="text-xs sm:text-sm text-yellow-600 font-medium">Active</div>
              <div className="text-lg sm:text-2xl font-bold">{summary.activeCount}</div>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100">
              <div className="text-xs sm:text-sm text-purple-600 font-medium">Year</div>
              <div className="text-lg sm:text-2xl font-bold">{summary.year}</div>
            </div>
          </div>

          {/* Active Cycles */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">Active Cycles</h3>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {activeRuns.length} active cycle{activeRuns.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {activeRuns.length > 0 ? (
              activeRuns.map((run) => {
                const status = getStatusBadge(run.status)
                return (
                  <div key={run.id} className="bg-card border rounded-xl p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
                      <div className="space-y-2 sm:space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {getMonthName(run.month)} {run.year}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="text-lg sm:text-xl font-bold">Payroll Cycle</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {format(new Date(run.periodFrom), 'MMM d')} - {format(new Date(run.periodTo), 'MMM d, yyyy')}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 sm:gap-6 pt-2">
                          <div>
                            <div className="text-xs sm:text-sm text-muted-foreground">Total Amount</div>
                            <div className="text-base sm:text-lg font-bold">{formatCurrency(run.totalNetSalary)}</div>
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm text-muted-foreground">Employees</div>
                            <div className="text-base sm:text-lg font-bold">{run.employeeCount}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 sm:pt-0 border-t sm:border-t-0">
                        <Button
                          variant="outline"
                          onClick={() => handleViewRun(run)}
                          className="flex items-center justify-center gap-2 flex-1 sm:flex-none text-sm"
                          size="sm"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>View Details</span>
                        </Button>
                        
                        {run.status === 'completed' ? (
                          <Button
                            onClick={() => handleDownloadReports(run)}
                            className="flex items-center justify-center gap-2 flex-1 sm:flex-none text-sm"
                            size="sm"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Download</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={() => window.location.href = `/payroll/process?month=${run.month}&year=${run.year}`}
                            className="flex items-center justify-center gap-2 flex-1 sm:flex-none text-sm"
                            size="sm"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Process</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-6 sm:py-8 border rounded-lg">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No Active Cycles</h4>
                <p className="text-muted-foreground text-sm sm:text-base mb-3 sm:mb-4">Start a new payroll cycle to begin processing.</p>
                <Button onClick={() => setIsRunDialogOpen(true)} size="sm" className="text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Start New Cycle
                </Button>
              </div>
            )}
          </div>

          {/* Previous Cycles */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold">Previous Cycles</h3>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {historyRuns.length} total cycle{historyRuns.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {historyRuns.length > 0 ? (
              <div className="grid gap-3 sm:gap-4">
                {historyRuns.map((run) => {
                  const status = getStatusBadge(run.status)
                  return (
                    <div key={run.id} className="bg-card border rounded-lg p-3 sm:p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm sm:text-base">
                              {getMonthName(run.month)} {run.year}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {run.employeeCount} employees • {formatCurrency(run.totalNetSalary)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRun(run)}
                            className="text-xs sm:text-sm"
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReports(run)}
                            className="p-2"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 border rounded-lg">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No previous payroll cycles found.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payroll Run Dialog */}
      <PayrollRunDialog
        isOpen={isRunDialogOpen}
        onClose={() => setIsRunDialogOpen(false)}
        onSubmit={handleRunPayroll}
      />
    </div>
  )
}