"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { 
  FileText, 
  Calendar, 
  Clock, 
  Download, 
  ChevronRight, 
  Bell,
  CalendarDays,
  Users,
  TrendingUp,
  LogOut,
  LogIn,
  AlertCircle,
  PartyPopper,
  ArrowRight,
  CheckCircle,
  Loader2,
  IndianRupee,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmployeeService } from "@/services/employee-service"

export default function EmployeeDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingSlip, setIsLoadingSlip] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showMoreAnnouncements, setShowMoreAnnouncements] = useState(false)
  const [showMoreHolidays, setShowMoreHolidays] = useState(false)
  const [currentMonth, setCurrentMonth] = useState("")
  const [currentYear, setCurrentYear] = useState(0)

  // Get current date info
  useEffect(() => {
    const currentDate = new Date()
    setCurrentMonth(currentDate.toLocaleDateString('en-US', { month: 'long' }))
    setCurrentYear(currentDate.getFullYear())
  }, [])

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch employee dashboard data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoadingData(true)
        
        // Fetch dashboard data
        const response = await EmployeeService.getDashboardData()
        
        if (response.success && response.data) {
          setDashboardData(response.data)
          
          // Set clock in status based on today's attendance
          if (response.data.attendance.today) {
            const today = response.data.attendance.today
            setIsClockedIn(today.checkIn && !today.checkOut)
            if (today.checkIn) {
              setClockInTime(new Date(today.checkIn).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }))
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching employee data:', error)
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoadingData(false)
      }
    }
    
    // Fetch today's attendance status
    const fetchTodayAttendance = async () => {
      try {
        const response = await EmployeeService.getTodayAttendance()
        if (response.success && response.data) {
          setIsClockedIn(response.data.isClockedIn)
          if (response.data.attendance?.checkIn) {
            setClockInTime(new Date(response.data.attendance.checkIn).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching today attendance:', error)
      }
    }
    
    if (isAuthenticated) {
      fetchEmployeeData()
      fetchTodayAttendance()
    }
  }, [isAuthenticated])

  const handleClockInOut = async () => {
    try {
      let response
      
      if (!isClockedIn) {
        response = await EmployeeService.clockIn()
        if (response.success) {
          const timeString = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          setClockInTime(timeString)
          setIsClockedIn(true)
          toast.success(`Clocked in at ${timeString}`)
        } else {
          toast.error(response.message || 'Failed to clock in')
        }
      } else {
        response = await EmployeeService.clockOut()
        if (response.success) {
          setClockInTime(null)
          setIsClockedIn(false)
          toast.success('Clocked out successfully')
        } else {
          toast.error(response.message || 'Failed to clock out')
        }
      }
      
      // Refresh dashboard data
      setTimeout(() => {
        const fetchTodayAttendance = async () => {
          try {
            const response = await EmployeeService.getTodayAttendance()
            if (response.success && response.data) {
              setIsClockedIn(response.data.isClockedIn)
              if (response.data.attendance?.checkIn) {
                setClockInTime(new Date(response.data.attendance.checkIn).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }))
              }
            }
          } catch (error) {
            console.error('Error fetching today attendance:', error)
          }
        }
        fetchTodayAttendance()
      }, 500)
      
    } catch (error: any) {
      console.error('Clock in/out error:', error)
      toast.error(error.message || 'Failed to update attendance')
    }
  }

  const handleDownloadSlip = async () => {
    try {
      setIsLoadingSlip(true)
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Salary slip downloaded successfully')
    } catch (error) {
      toast.error('Failed to download salary slip')
    } finally {
      setIsLoadingSlip(false)
    }
  }

  const handleViewAllAnnouncements = () => {
    toast.info('All announcements feature coming soon!')
  }

  const handleViewAllHolidays = () => {
    toast.info('Complete holiday calendar feature coming soon!')
  }

  const handleOffThisWeek = () => {
    toast.info('Leave management feature coming soon!')
  }

  const handleViewSalaryHistory = () => {
    router.push('/employee-salary-slips')
  }

  const handleViewLeaveBalance = () => {
    toast.info('Leave balance feature coming soon!')
  }

  // Show loading while checking auth
  if (isLoading || isLoadingData) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Get latest salary slip from dashboard data
  const latestSlip = dashboardData?.payroll?.recent?.[0] || {
    month: currentMonth,
    year: currentYear.toString(),
    netSalary: "₹45,000",
    status: "paid"
  }

  // Calculate leave balance
  const leaveBalance = dashboardData?.leaves || {
    earnedLeaves: 12,
    casualLeaves: 8,
    sickLeaves: 6,
    totalLeaves: 26
  }

  // Attendance summary
  const attendanceSummary = dashboardData?.attendance?.summary || {
    totalDays: 22,
    presentDays: 20,
    absentDays: 1,
    leaveDays: 1,
    halfDays: 0,
    overtimeHours: 4.5
  }

  // Updated announcements with current dates
  const announcements = [
    {
      id: 1,
      title: "Year-End Office Party",
      description: "Annual celebration on December 20th at Grand Hotel",
      date: "Today, 09:30 AM",
      icon: <PartyPopper className="w-4 h-4" />,
      color: "bg-green-100 text-green-800"
    },
    {
      id: 2,
      title: "Q4 Performance Reviews",
      description: "Schedule your performance review by December 15th",
      date: "Dec 1, 2024",
      icon: <AlertCircle className="w-4 h-4" />,
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      id: 3,
      title: "New Healthcare Benefits",
      description: "Enhanced healthcare coverage effective January 1st",
      date: "Nov 25, 2024",
      icon: <Users className="w-4 h-4" />,
      color: "bg-blue-100 text-blue-800"
    }
  ]

  // Updated holidays with current/recent dates
  const holidays = [
    { name: "Christmas Day", date: "Dec 25", day: "Wed", type: "public" },
    { name: "Boxing Day", date: "Dec 26", day: "Thu", type: "public" },
    { name: "New Year's Day", date: "Jan 1", day: "Wed", type: "public" },
    { name: "Republic Day", date: "Jan 26", day: "Sun", type: "public" },
    { name: "Holi", date: "Mar 14", day: "Fri", type: "public" },
  ]

  // Add missing imports for showMoreAnnouncements and showMoreHolidays
  const displayedAnnouncements = showMoreAnnouncements || !isMobile ? announcements : announcements.slice(0, 2)
  const displayedHolidays = showMoreHolidays || !isMobile ? holidays : holidays.slice(0, 3)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" : "Employee Dashboard"} />
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Header with welcome */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Hello, {user?.name?.split(' ')[0] || 'Employee'}!
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">Welcome to your ZENVY personal dashboard. {formattedDate}</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-sm"
                onClick={handleOffThisWeek}
                size={isMobile ? "sm" : "default"}
              >
                <span className="hidden sm:inline">Off this week</span>
                <span className="sm:hidden">Leave</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="default"
                className="flex items-center gap-2 text-sm"
                onClick={() => toast.info('Notifications feature coming soon!')}
                size={isMobile ? "sm" : "default"}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
            {/* Left Column - 3/4 width */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* Clock In/Out Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card className="p-4 md:p-6 border-l-4 border-l-primary" title={undefined} description={undefined} footer={undefined}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-base md:text-lg">Attendance</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isClockedIn ? "Currently clocked in" : "Ready to clock in"}
                      </p>
                      {clockInTime && (
                        <div className="mt-2 text-sm font-medium">
                          Clocked in at: <span className="text-primary">{clockInTime}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <Button
                        onClick={handleClockInOut}
                        variant={isClockedIn ? "destructive" : "default"}
                        size={isMobile ? "default" : "lg"}
                        className="w-full md:w-auto px-4 md:px-8"
                        disabled={isLoadingData}
                      >
                        {isClockedIn ? (
                          <>
                            <LogOut className="w-4 h-4 mr-2" />
                            Clock Out
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Clock In
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Today: {isClockedIn ? "Working" : "Not started"}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Weekly Stats */}
                <Card className="p-4 md:p-6" title={undefined} description={undefined} footer={undefined}>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base md:text-lg">Monthly Summary</h3>
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold">{attendanceSummary.presentDays}d</div>
                        <div className="text-xs text-muted-foreground">Days Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold">
                          {attendanceSummary.totalDays > 0 
                            ? Math.round((attendanceSummary.presentDays / attendanceSummary.totalDays) * 100)
                            : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold">{attendanceSummary.overtimeHours}h</div>
                        <div className="text-xs text-muted-foreground">Overtime</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Latest Salary Card */}
              <Card className="bg-primary text-primary-foreground p-0 overflow-hidden relative border-none" title={undefined} description={undefined} footer={undefined}>
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full -mr-8 md:-mr-16 -mt-8 md:-mt-16 blur-2xl" />
                <div className="p-6 md:p-8 space-y-4 md:space-y-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-primary-foreground/80 text-sm font-medium">{currentMonth} {currentYear} Net Pay</div>
                      <div className="text-2xl md:text-4xl font-bold tracking-tight">{latestSlip.netSalary || "₹0.00"}</div>
                    </div>
                    <div className="p-3 md:p-4 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-sm">
                      <IndianRupee className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-white/20 gap-3">
                    <div className="text-sm font-medium">
                      Period: {latestSlip.month} {latestSlip.year}
                      {latestSlip.status && (
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          latestSlip.status === 'paid' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {latestSlip.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white text-primary hover:bg-white/90 w-full md:w-auto"
                      onClick={handleDownloadSlip}
                      disabled={isLoadingSlip}
                    >
                      {isLoadingSlip ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {isLoadingSlip ? 'Downloading...' : 'Download Slip'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={handleViewSalaryHistory}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm md:text-base">Salary History</div>
                      <div className="text-xs text-muted-foreground">View all previous slips</div>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  </div>
                </button>
                <button 
                  onClick={handleViewLeaveBalance}
                  className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm md:text-base">Leave Balance</div>
                      <div className="text-xs text-muted-foreground">
                        EL: {leaveBalance.earnedLeaves} | CL: {leaveBalance.casualLeaves} | SL: {leaveBalance.sickLeaves}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                  </div>
                </button>
              </div>

              {/* Today's Attendance Status Card */}
              <Card 
                title={<div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-base md:text-lg">Today's Attendance Status</span>
                </div>}
                description="Your attendance details for today" footer={undefined} className={undefined}              >
                <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg md:text-2xl font-bold">
                          {clockInTime || "--:--"}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">Clock In</div>
                      </div>
                      <LogIn className="w-4 h-4 md:w-6 md:h-6 text-green-500" />
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg md:text-2xl font-bold">
                          {isClockedIn ? "--:--" : dashboardData?.attendance?.today?.checkOut 
                            ? new Date(dashboardData.attendance.today.checkOut).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : "--:--"}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">Clock Out</div>
                      </div>
                      <LogOut className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg md:text-2xl font-bold">
                          {dashboardData?.attendance?.today?.hoursWorked 
                            ? `${dashboardData.attendance.today.hoursWorked}h`
                            : "0h"}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">Total Hours</div>
                      </div>
                      <Clock className="w-4 h-4 md:w-6 md:h-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg md:text-2xl font-bold">
                          {dashboardData?.attendance?.today?.overtimeHours || 0}h
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground">Overtime</div>
                      </div>
                      <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Upcoming Holidays Section */}
              <Card 
                title={<div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-base md:text-lg">Upcoming Holidays</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreHolidays(!showMoreHolidays)}
                    className="md:hidden"
                  >
                    {showMoreHolidays ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>}
                description="Public holidays for 2024-2025" footer={undefined} className={undefined}              >
                <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                  {displayedHolidays.map((holiday) => (
                    <div 
                      key={holiday.name} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toast.info(`${holiday.name} - ${holiday.date}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">{holiday.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {holiday.date} • {holiday.day}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                          {holiday.type}
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  ))}
                  {!isMobile && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-sm mt-2"
                      onClick={handleViewAllHolidays}
                    >
                      View All Holidays
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - 1/4 width */}
            <div className="space-y-6 md:space-y-8">
              {/* Leave Balance Card */}
              <Card 
                title={<div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-base md:text-lg">Leave Balance</span>
                </div>}
                description="Your available leaves" footer={undefined} className={undefined}              >
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Earned Leaves</span>
                      <span className="font-bold text-green-600">{leaveBalance.earnedLeaves}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.earnedLeaves / 15) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Casual Leaves</span>
                      <span className="font-bold text-blue-600">{leaveBalance.casualLeaves}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.casualLeaves / 12) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sick Leaves</span>
                      <span className="font-bold text-purple-600">{leaveBalance.sickLeaves}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.sickLeaves / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="pt-3 md:pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm md:text-base">Total Available</span>
                      <span className="font-bold text-lg">{leaveBalance.totalLeaves}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Announcements Section */}
              <Card 
                title={<div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-base md:text-lg">Announcements</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMoreAnnouncements(!showMoreAnnouncements)}
                    className="md:hidden"
                  >
                    {showMoreAnnouncements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>}
                description="Latest company updates and news." footer={undefined} className={undefined}              >
                <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
                  {displayedAnnouncements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      className="p-3 md:p-4 rounded-lg border hover:border-primary/30 transition-colors cursor-pointer"
                      onClick={() => toast.info(`Viewing: ${announcement.title}`)}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className={`p-2 rounded-full ${announcement.color} flex-shrink-0`}>
                          {announcement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{announcement.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {announcement.description}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{announcement.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!isMobile && (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-center text-sm mt-2"
                      onClick={handleViewAllAnnouncements}
                    >
                      View All Announcements
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}