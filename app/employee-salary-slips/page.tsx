// ./app/employee-salary-slips/page.tsx
"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Download, Printer, FileText, Calendar, Filter, Loader2, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { format } from "date-fns"
import { SalarySlipService } from "@/services/salary-slip-service"
import { EmployeeService } from "@/services/employee-service"
import { Button } from "@/components/Common/Button"
import { Card } from "@/components/Common/Card"
import { Badge } from "@/components/ui/badge"

export default function EmployeeSalarySlipsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [salarySlips, setSalarySlips] = useState<any[]>([])
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlip, setSelectedSlip] = useState<any>(null)
  const [currentStat, setCurrentStat] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const slipCardsRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [currentSlide, setCurrentSlide] = useState(0); // Add this

// Update the selected slip when slide changes
useEffect(() => {
  if (salarySlips.length > 0 && currentSlide < salarySlips.length) {
    setSelectedSlip(salarySlips[currentSlide]);
  }
}, [currentSlide, salarySlips]);


  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    } else if (isAuthenticated) {
      fetchEmployeeData()
    }
  }, [isAuthenticated, authLoading, router])

  const fetchEmployeeData = async () => {
    try {
      setIsLoading(true)
      await fetchSalarySlips()
    } catch (error: any) {
      console.error('Error fetching employee data:', error)
      toast.error('Failed to load salary slips')
    } finally {
      setIsLoading(false)
    }
  }

  const convertNumberToWords = (num: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    const convertHundreds = (n: number): string => {
      if (n === 0) return ''
      let result = ''
      
      if (n >= 100) {
        result += units[Math.floor(n / 100)] + ' Hundred '
        n %= 100
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' '
        n %= 10
      } else if (n >= 10) {
        result += teens[n - 10] + ' '
        n = 0
      }
      
      if (n > 0) {
        result += units[n] + ' '
      }
      
      return result.trim()
    }
    
    const convertToWords = (n: number): string => {
      if (n === 0) return 'Zero'
      
      let result = ''
      
      if (n >= 10000000) {
        result += convertHundreds(Math.floor(n / 10000000)) + ' Crore '
        n %= 10000000
      }
      
      if (n >= 100000) {
        result += convertHundreds(Math.floor(n / 100000)) + ' Lakh '
        n %= 100000
      }
      
      if (n >= 1000) {
        result += convertHundreds(Math.floor(n / 1000)) + ' Thousand '
        n %= 1000
      }
      
      result += convertHundreds(n)
      
      return result.trim()
    }
    
    const rupees = Math.floor(num)
    const paise = Math.round((num - rupees) * 100)
    
    let result = ''
    
    if (rupees > 0) {
      result += convertToWords(rupees) + ' Rupees'
    }
    
    if (paise > 0) {
      if (result) result += ' and '
      result += convertToWords(paise) + ' Paise'
    }
    
    return result || 'Zero Rupees'
  }

  const fetchSalarySlips = async () => {
    try {
      if (!user?.id) {
        toast.error('Employee ID not found')
        return
      }

      const response = await SalarySlipService.getEmployeeSalarySlips(user.id, {
        year: selectedYear,
        limit: 50
      })

      if (response.success && response.data) {
        setSalarySlips(response.data.salarySlips)
        setEmployeeData(response.data.employee)
        setSummary(response.data.summary)
        
        if (response.data.salarySlips.length > 0) {
          setSelectedSlip(response.data.salarySlips[0])
        }
      }
    } catch (error: any) {
      console.error('Error fetching salary slips:', error)
      toast.error('Failed to load salary slips')
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchSalarySlips()
    }
  }, [selectedYear, isAuthenticated, user?.id])

  const handleDownload = async (slipId: string) => {
    try {
      toast.info('Downloading salary slip...')
      await SalarySlipService.downloadSalarySlip(slipId)
      toast.success('Salary slip downloaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to download salary slip')
    }
  }

  const handlePrint = () => {
    toast.info("Opening print dialog...")
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const calculateTotalEarnings = () => {
    return salarySlips.reduce((total, slip) => total + slip.netSalary, 0)
  }

  const scrollStats = (direction: 'left' | 'right') => {
    if (!statsRef.current) return
    
    const scrollAmount = 300
    const currentScroll = statsRef.current.scrollLeft
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount
    
    statsRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }

  const nextStat = () => {
    setCurrentStat((prev) => (prev + 1) % 3)
  }

  const prevStat = () => {
    setCurrentStat((prev) => (prev - 1 + 3) % 3)
  }

  const scrollToSlip = (index: number) => {
    if (slipCardsRef.current) {
      const slipElement = slipCardsRef.current.children[index] as HTMLElement
      slipCardsRef.current.scrollTo({
        left: slipElement.offsetLeft - 16,
        behavior: 'smooth'
      })
    }
  }

  // Show loading while checking auth
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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const statusColors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    calculated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
  }

  const stats = [
    { title: "Latest Salary", value: selectedSlip ? formatCurrency(selectedSlip.netSalary) : 'N/A', icon: <FileText className="h-8 w-8 text-primary" /> },
    { title: "Total Earnings", value: formatCurrency(calculateTotalEarnings()), icon: <div className="text-green-500 text-sm font-medium px-3 py-1 bg-green-50 rounded-full dark:bg-green-900/30">+{summary?.totalSlips || 0} slips</div> },
    { title: "Available Slips", value: salarySlips.length, icon: <Filter className="h-8 w-8 text-muted-foreground" /> }
  ]

  return (
    <div className="flex min-h-screen bg-background">
  <Sidebar />

  <main className="flex-1 overflow-y-auto">
    <Navbar title={isMobile ? "" :"My Salary Slips" }/>

    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* ================= Header ================= */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              My Salary Slips
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              View and download your monthly salary slips
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-background">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent outline-none text-sm font-medium cursor-pointer w-full"
              >
                {[2026, 2025, 2024, 2023, 2022].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              {selectedSlip && (
                <Button
                  onClick={() => handleDownload(selectedSlip.id)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Download PDF</span>
                </Button>
              )}

              <Button onClick={handlePrint} size="sm">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Print</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Stats Desktop ================= */}
      <div className="max-w-6xl mx-auto hidden md:grid md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6" title={undefined} description={undefined} footer={undefined}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>

      {/* ================= Main Content ================= */}
      <div className="max-w-6xl mx-auto">
        {/* Mobile Tabs */}
        <div className="lg:hidden mb-6">
          <div className="flex border-b">
            {["list", "detail"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 py-3 text-center font-medium border-b-2 ${
                  viewMode === mode
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {mode === "list" ? "List" : "Details"}
              </button>
            ))}
          </div>
        </div>

        {/* ================= Grid ================= */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* ===== Salary Slip List ===== */}
          <div
            className={`lg:col-span-1 ${
              viewMode === "detail" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Salary Slips</h3>
              <span className="text-sm text-muted-foreground">
                {salarySlips.length} slips
              </span>
            </div>

            {salarySlips.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No salary slips found
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {salarySlips.map((slip) => (
                  <div
                    key={slip.id}
                    onClick={() => {
                      setSelectedSlip(slip)
                      setViewMode("detail")
                    }}
                    className={`p-4 border rounded-lg cursor-pointer ${
                      selectedSlip?.id === slip.id
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold">
                        {getMonthName(slip.month)} {slip.year}
                      </span>
                      <Badge className={statusColors[slip.status]}>
                        {slip.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(slip.createdAt), "MMM d, yyyy")}
                      </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(slip.netSalary)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Salary Slip Detail ===== */}
          <div
            className={`lg:col-span-2 ${
              viewMode === "list" ? "hidden lg:block" : "block"
            }`}
          >
            {selectedSlip ? (
            <Card
                className="p-4 md:p-6 lg:p-8"
                title={undefined}
                description={undefined}
                footer={undefined}
            >
                {/* Mobile Back Button */}
                <div className="lg:hidden mb-4">
                <button
                    onClick={() => setViewMode("list")}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to List
                </button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-bold leading-tight">
                    Salary Slip for {getMonthName(selectedSlip.month)}{" "}
                    {selectedSlip.year}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                    <p className="text-sm text-muted-foreground">
                        Generated on{" "}
                        {format(new Date(selectedSlip.createdAt), "MMM d, yyyy")}
                    </p>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <Badge
                        className={`${statusColors[selectedSlip.status]} text-xs px-2 py-1`}
                    >
                        {selectedSlip.status.charAt(0).toUpperCase() +
                        selectedSlip.status.slice(1)}
                    </Badge>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                    onClick={() => handleDownload(selectedSlip.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    >
                    <Download className="h-4 w-4" />
                    <span className="hidden xs:inline">PDF</span>
                    </Button>

                    <Button
                    onClick={handlePrint}
                    size="sm"
                    className="flex items-center gap-2"
                    >
                    <Printer className="h-4 w-4" />
                    <span className="hidden xs:inline">Print</span>
                    </Button>
                </div>
                </div>

                {/* Employee & Pay Period */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Employee Details */}
                <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Employee Details
                    </h3>
                    <div className="space-y-1.5">
                    <p className="font-medium text-sm md:text-base">
                        {employeeData?.name || user?.name}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {employeeData?.designation || user?.position}
                    </p>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <span>ID: {employeeData?.employeeId || "N/A"}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                        {employeeData?.department || "Department"}
                        </span>
                    </div>
                    <p className="sm:hidden text-xs text-muted-foreground">
                        {employeeData?.department || "Department not specified"}
                    </p>
                    </div>
                </div>

                {/* Pay Period */}
                <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                    Pay Period
                    </h3>
                    <div className="space-y-1.5">
                    <p className="font-medium text-sm md:text-base">
                        {getMonthName(selectedSlip.month)} {selectedSlip.year}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {format(new Date(selectedSlip.periodFrom), "MMM d")} –{" "}
                        {format(new Date(selectedSlip.periodTo), "MMM d, yyyy")}
                    </p>
                    {selectedSlip.paymentDate && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                        Paid on:{" "}
                        {format(
                            new Date(selectedSlip.paymentDate),
                            "MMM d, yyyy"
                        )}
                        </p>
                    )}
                    </div>
                </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="space-y-6">
                {/* Earnings */}
                <div className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 p-4 md:p-5 rounded-xl border">
                    <div className="flex justify-between mb-4">
                    <h3 className="font-semibold text-green-700 dark:text-green-400">
                        Earnings
                    </h3>
                    <span className="text-sm font-medium text-green-700">
                        Total: {formatCurrency(selectedSlip.grossEarnings)}
                    </span>
                    </div>

                    <div className="space-y-3">
                    <div className="flex justify-between py-2.5 border-b">
                        <span>Basic Salary</span>
                        <span className="font-semibold">
                        {formatCurrency(selectedSlip.basicSalary)}
                        </span>
                    </div>

                    {selectedSlip.earnings?.map((earning: any, index: number) => (
                        <div
                        key={index}
                        className="flex justify-between py-2.5 border-b"
                        >
                        <span>{earning.component}</span>
                        <span>{formatCurrency(earning.amount)}</span>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Deductions */}
                <div className="bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/20 p-4 md:p-5 rounded-xl border">
                    <div className="flex justify-between mb-4">
                    <h3 className="font-semibold text-red-700 dark:text-red-400">
                        Deductions
                    </h3>
                    <span className="text-sm font-medium text-red-700">
                        Total: {formatCurrency(selectedSlip.totalDeductions)}
                    </span>
                    </div>

                    {selectedSlip.deductions?.map((deduction: any, index: number) => (
                    <div
                        key={index}
                        className="flex justify-between py-2.5 border-b"
                    >
                        <span>{deduction.component}</span>
                        <span className="text-red-600">
                        -{formatCurrency(deduction.amount)}
                        </span>
                    </div>
                    ))}
                </div>
                </div>

                {/* Net Salary */}
                <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-lg">Net Salary</h3>
                <div className="text-2xl font-bold text-primary mt-2">
                    {formatCurrency(selectedSlip.netSalary)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {convertNumberToWords(selectedSlip.netSalary)} only
                </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={() => handleDownload(selectedSlip.id)}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                >
                    <Download className="mr-2" />
                    Download PDF
                </Button>

                <Button
                    onClick={handlePrint}
                    size="lg"
                    className="flex-1"
                >
                    <Printer className="mr-2" />
                    Print Slip
                </Button>
                </div>
            </Card>
            ) : (
              <Card className="p-8 text-center" title={undefined} description={undefined} footer={undefined}>
                <Eye className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-3 text-muted-foreground">
                  Select a salary slip to view details
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

  )
}