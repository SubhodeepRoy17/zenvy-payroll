// ./app/salary-slips/page.tsx
"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Calendar, User, Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { SalarySlipService } from "@/services/salary-slip-service"
import { PayrollService } from "@/services/payroll-service"

export default function SalarySlipPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [salarySlips, setSalarySlips] = useState<any[]>([])
  const [filteredSlips, setFilteredSlips] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(10) // Default for desktop
  const statsRef = useRef<HTMLDivElement>(null)
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated && user?.role !== 'employee') {
      fetchSalarySlips()
    } else if (isAuthenticated && user?.role === 'employee') {
      router.push('/employee-salary-slips')
    }
  }, [isAuthenticated, authLoading, router, user?.role])

  // Update itemsPerPage based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5) // Mobile: 5 per page
      } else {
        setItemsPerPage(10) // Desktop: 10 per page
      }
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  const fetchSalarySlips = async () => {
    try {
      setIsLoading(true)
      const response = await SalarySlipService.getSalarySlips({
        limit: 100,
        month: selectedMonth ? parseInt(selectedMonth.split('-')[1]) : undefined,
        year: selectedMonth ? parseInt(selectedMonth.split('-')[0]) : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        employeeId: selectedEmployee || undefined
      })
      
      if (response.success && response.data?.salarySlips) {
        setSalarySlips(response.data.salarySlips)
        setFilteredSlips(response.data.salarySlips)
      }
    } catch (error: any) {
      console.error('Error fetching salary slips:', error)
      toast.error('Failed to load salary slips')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'employee') {
      fetchSalarySlips()
    }
  }, [selectedMonth, selectedStatus, selectedEmployee])

  useEffect(() => {
    const filtered = salarySlips.filter(slip => {
      const searchLower = searchTerm.toLowerCase()
      return (
        slip.employee.name.toLowerCase().includes(searchLower) ||
        slip.employee.employeeId.toLowerCase().includes(searchLower) ||
        slip.employee.department.toLowerCase().includes(searchLower)
      )
    })
    setFilteredSlips(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, salarySlips])

  // Auto-slide functionality for mobile stats carousel
  useEffect(() => {
    if (window.innerWidth < 768) { // Only for mobile
      const startAutoSlide = () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current)
        }
        
        autoSlideRef.current = setInterval(() => {
          setCurrentSlide(prev => {
            const nextSlide = prev + 1
            const totalSlides = 4 // We have 4 stats cards
            
            if (statsRef.current) {
              const scrollWidth = statsRef.current.scrollWidth
              const clientWidth = statsRef.current.clientWidth
              const maxScroll = scrollWidth - clientWidth
              
              if (nextSlide >= totalSlides) {
                statsRef.current.scrollTo({ left: 0, behavior: 'smooth' })
                return 0
              } else {
                const scrollLeft = nextSlide * (scrollWidth / totalSlides)
                statsRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' })
                return nextSlide
              }
            }
            return prev
          })
        }, 5000) // Auto slide every 5 seconds
      }
      
      startAutoSlide()
      
      return () => {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current)
        }
      }
    }
  }, [])

  // Calculate pagination values
  const totalPages = Math.ceil(filteredSlips.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSlips = filteredSlips.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleApproveSlip = async (slipId: string) => {
    try {
      toast.info('Approving salary slip...')
      const response = await PayrollService.approvePayroll(slipId)
      if (response.success) {
        toast.success('Salary slip approved successfully')
        fetchSalarySlips()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve salary slip')
    }
  }

  const handleMarkAsPaid = async (slipId: string) => {
    try {
      toast.info('Marking as paid...')
      const response = await PayrollService.markAsPaid(slipId, {
        paymentMethod: 'bank-transfer'
      })
      if (response.success) {
        toast.success('Salary slip marked as paid')
        fetchSalarySlips()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid')
    }
  }

  const handleDownload = async (slipId: string) => {
    try {
      toast.info('Downloading salary slip...')
      await SalarySlipService.downloadSalarySlip(slipId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to download salary slip')
    }
  }

  const getMonthOptions = () => {
    const options = []
    const currentDate = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = format(date, 'MMM yyyy')
      options.push({ value, label })
    }
    
    return options
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      calculated: { label: 'Calculated', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (!isAuthenticated || user?.role === 'employee') {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"Salary Slip Management" }/>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Salary Slips</h2>
              <p className="text-muted-foreground text-sm md:text-base">Review and manage employee salary slips</p>
            </div>
            <div className="flex justify-between items-center">
              <Button 
                onClick={() => toast.info('Generate salary slips feature coming soon')}
                size="sm"
                className="text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Bulk
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className={`flex flex-col gap-4 ${showFilters ? 'block' : 'hidden md:flex'} md:flex-row md:items-center justify-between`}>
            <div className="flex flex-col md:flex-row gap-3 w-full">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or department..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                  label={undefined}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:flex md:gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-background w-full"
                >
                  <option value="">All Months</option>
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-background w-full"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="calculated">Calculated</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Summary Stats - Carousel for Mobile */}
          <div className="relative">
            <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4" title={undefined} description={undefined} footer={undefined}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Slips</p>
                    <p className="text-2xl font-bold">{salarySlips.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </Card>
              
              <Card className="p-4" title={undefined} description={undefined} footer={undefined}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">
                      {salarySlips.filter(s => s.status === 'calculated').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </Card>
              
              <Card className="p-4" title={undefined} description={undefined} footer={undefined}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid This Month</p>
                    <p className="text-2xl font-bold">
                      {salarySlips.filter(s => s.status === 'paid' && 
                        new Date(s.paymentDate).getMonth() === new Date().getMonth()).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4" title={undefined} description={undefined} footer={undefined}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl font-bold">
                      {new Set(salarySlips.map(s => s.employee.id)).size}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
            </div>

            {/* Mobile Carousel - Auto sliding without arrows */}
            <div className="md:hidden relative overflow-hidden">
              <div 
                ref={statsRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex gap-4 p-1 min-w-full">
                  {[
                    { title: "Total Slips", value: salarySlips.length, icon: <FileText className="h-8 w-8 text-primary" /> },
                    { title: "Pending Approval", value: salarySlips.filter(s => s.status === 'calculated').length, icon: <CheckCircle className="h-8 w-8 text-yellow-500" /> },
                    { title: "Paid This Month", value: salarySlips.filter(s => s.status === 'paid' && new Date(s.paymentDate).getMonth() === new Date().getMonth()).length, icon: <Calendar className="h-8 w-8 text-green-500" /> },
                    { title: "Total Employees", value: new Set(salarySlips.map(s => s.employee.id)).size, icon: <User className="h-8 w-8 text-blue-500" /> }
                  ].map((stat, index) => (
                    <div 
                      key={index}
                      className="min-w-[calc(100vw-3rem)] snap-center bg-card border rounded-xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.title}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        {stat.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-3">
                {[0, 1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSlide % 4 === dot ? 'bg-primary w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Salary Slips Table - Responsive with pagination */}
          <Card className="p-0 overflow-hidden" title={undefined} description={undefined} footer={undefined}>
            <div className="p-4 md:p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Salary Slips</h3>
              <div className="text-sm text-muted-foreground">
                Showing {filteredSlips.length > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, filteredSlips.length)} of {filteredSlips.length}
              </div>
            </div>
            
            {filteredSlips.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Salary Slips Found</h4>
                <p className="text-muted-foreground mb-4">
                  {salarySlips.length === 0 
                    ? 'No salary slips have been generated yet.'
                    : 'No salary slips match your filters.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] md:min-w-0">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium text-sm">Employee</th>
                        <th className="text-left p-4 font-medium text-sm">Month</th>
                        <th className="text-left p-4 font-medium text-sm">Basic Salary</th>
                        <th className="text-left p-4 font-medium text-sm">Net Salary</th>
                        <th className="text-left p-4 font-medium text-sm">Status</th>
                        <th className="text-left p-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSlips.map((slip) => (
                        <tr key={slip.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-sm md:text-base">{slip.employee.name}</div>
                            <div className="text-xs md:text-sm text-muted-foreground">
                              {slip.employee.employeeId} • {slip.employee.department}
                            </div>
                          </td>
                          <td className="p-4 text-sm md:text-base">
                            {new Date(slip.year, slip.month - 1, 1).toLocaleString('default', { month: 'short' })} {slip.year}
                          </td>
                          <td className="p-4 font-medium text-sm md:text-base">
                            ₹{slip.basicSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-bold text-sm md:text-base">
                            ₹{slip.netSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(slip.status)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 md:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 md:h-9 md:w-9 md:p-2"
                                onClick={() => handleDownload(slip.id)}
                                title="Download"
                              >
                                <Download className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              
                              {slip.status === 'calculated' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 md:h-9 md:w-9 md:p-2"
                                  onClick={() => handleApproveSlip(slip.id)}
                                  title="Approve"
                                >
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                                </Button>
                              )}
                              
                              {slip.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 md:h-9 md:w-9 md:p-2"
                                  onClick={() => handleMarkAsPaid(slip.id)}
                                  title="Mark as Paid"
                                >
                                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 md:h-9 md:w-9 md:p-2"
                                onClick={() => toast.info('View details feature coming soon')}
                                title="View Details"
                              >
                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="border-t p-4 md:p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        {/* Page numbers - show limited on mobile */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(totalPages, window.innerWidth < 768 ? 3 : 5) }, (_, i) => {
                            let pageNum
                            if (totalPages <= (window.innerWidth < 768 ? 3 : 5)) {
                              pageNum = i + 1
                            } else if (currentPage <= Math.floor((window.innerWidth < 768 ? 3 : 5) / 2)) {
                              pageNum = i + 1
                            } else if (currentPage > totalPages - Math.floor((window.innerWidth < 768 ? 3 : 5) / 2)) {
                              pageNum = totalPages - ((window.innerWidth < 768 ? 3 : 5) - i - 1)
                            } else {
                              pageNum = currentPage - Math.floor((window.innerWidth < 768 ? 3 : 5) / 2) + i
                            }
                            
                            if (pageNum >= 1 && pageNum <= totalPages) {
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  className="h-8 w-8 p-0 text-xs"
                                  onClick={() => goToPage(pageNum)}
                                >
                                  {pageNum}
                                </Button>
                              )
                            }
                            return null
                          })}
                          
                          {/* Show ellipsis if needed */}
                          {totalPages > (window.innerWidth < 768 ? 3 : 5) && currentPage <= totalPages - Math.floor((window.innerWidth < 768 ? 3 : 5) / 2) && (
                            <span className="px-2">...</span>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Items per page selector for desktop */}
                      <div className="hidden md:flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Show:</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value))
                            setCurrentPage(1)
                          }}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                        </select>
                        <span className="text-muted-foreground">per page</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Mobile items per page selector */}
          <div className="md:hidden flex items-center justify-center gap-2 text-sm">
            <span className="text-muted-foreground">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
            </select>
            <span className="text-muted-foreground">per page</span>
          </div>
        </div>
      </main>
    </div>
  )
}