"use client"

import { useState, useEffect, SetStateAction } from 'react'
import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/Common/Input"
import { Search, Plus, Filter, MoreVertical, RefreshCw, UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmployeeService, EmployeeCreateFormData } from '@/services/employee-service'
import { EmployeeResponse } from '@/types/employee'
import { useAuth } from '@/hooks/useAuth'
import { EditEmployeeDialog } from '@/components/Employees/EditEmployeeDialog'
import { toast } from '@/hooks/use-toast'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'employeeId',
    sortOrder: 'asc' as 'asc' | 'desc',
    department: 'all',
    isActive: undefined as boolean | undefined
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Form state
  const [formData, setFormData] = useState<EmployeeCreateFormData>({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    designation: '',
    employmentType: 'full-time',
    joiningDate: new Date().toISOString().split('T')[0],
    workLocation: '',
    panNumber: '',
    aadhaarNumber: '',
    uanNumber: '', 
    bankDetails: {
      accountNumber: '',
      accountHolderName: '',
      bankName: '',
      branch: '',
      ifscCode: '',
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
      // Update limit based on screen size
      const newLimit = window.innerWidth < 640 ? 5 : 10
      if (filters.limit !== newLimit) {
        setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [filters.limit])

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await EmployeeService.getEmployees({
        ...filters,
        search: searchTerm || undefined
      })

      if (response.success && response.data) {
        setEmployees(response.data.employees)
        setPagination(response.data.pagination)
      } else {
        throw new Error(response.message || 'Failed to fetch employees')
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err)
      setError(err.message || 'Failed to load employees')
      toast({
        title: 'Error',
        description: err.message || 'Failed to load employees',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchEmployees()
  }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder])

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        setFilters(prev => ({ ...prev, page: 1 }))
        fetchEmployees()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Handle employee actions
  const handleViewProfile = (employee: EmployeeResponse) => {
    window.location.href = `/employees/${employee.id}`
  }

  const handleEditEmployee = (employee: EmployeeResponse) => {
    setSelectedEmployee(employee)
    setIsEditDialogOpen(true)
  }

  const handleRunPayroll = (employee: EmployeeResponse) => {
    window.location.href = `/payroll?employee=${employee.id}`
  }

  const handleDeactivate = async (employee: EmployeeResponse) => {
    try {
      setSelectedEmployee(employee)
      setIsDeleteDialogOpen(true)
    } catch (err) {
      console.error('Error preparing deactivation:', err)
    }
  }

  const confirmDeactivate = async () => {
    if (!selectedEmployee) return

    try {
      const response = await EmployeeService.deactivateEmployee(selectedEmployee.id)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `${selectedEmployee.user.name} has been deactivated`
        })
        fetchEmployees()
      } else {
        throw new Error(response.message || 'Failed to deactivate employee')
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to deactivate employee',
        variant: 'destructive'
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedEmployee(null)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await EmployeeService.createEmployee(formData)
      
      if (response.success) {
        const employee = response.data.employee
        const credentials = response.data.employee.credentials
        
        toast({
          title: 'Success',
          description: `Employee ${employee.user.name} created successfully!`,
        })
        
        alert(
          `🎉 Employee Created Successfully!\n\n` +
          `👤 Name: ${employee.user.name}\n` +
          `📧 Email: ${credentials.email}\n` +
          `🔑 Password: ${credentials.password}\n` +
          `🆔 Employee ID: ${employee.employeeId}\n\n` +
          `📝 ${credentials.message}`
        )
        
        setIsAddDialogOpen(false)
        fetchEmployees()
        
        setFormData({
          name: '',
          email: '',
          employeeId: '',
          department: '',
          designation: '',
          employmentType: 'full-time',
          joiningDate: new Date().toISOString().split('T')[0],
          workLocation: '',
          panNumber: '',
          aadhaarNumber: '',
          uanNumber: '', 
          bankDetails: {
            accountNumber: '',
            accountHolderName: '',
            bankName: '',
            branch: '',
            ifscCode: '',
          },
        })
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create employee',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status badge color
  const getStatusColor = (status: boolean) => {
    return status ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  // Generate pagination range
  const getPaginationRange = () => {
    const maxPagesToShow = isMobile ? 3 : 5
    const start = Math.max(1, pagination.page - Math.floor(maxPagesToShow / 2))
    const end = Math.min(pagination.pages, start + maxPagesToShow - 1)
    
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  // Loading skeleton
  if (loading && employees.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar/>
        <main className="flex-1 overflow-y-auto">
          <Navbar title={isMobile ? "" :"Employee Directory"} />
          <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <Skeleton className="h-7 sm:h-8 w-40 sm:w-48" />
                <Skeleton className="h-3 sm:h-4 w-48 sm:w-64 mt-1 sm:mt-2" />
              </div>
              <Skeleton className="h-9 sm:h-10 w-32 sm:w-40" />
            </div>

            <Card className="p-0 overflow-hidden" title={undefined} description={undefined} footer={undefined}>
              <div className="p-3 sm:p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                <Skeleton className="h-9 sm:h-10 w-full sm:w-96" />
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Skeleton className="h-9 sm:h-10 w-20 sm:w-24 flex-1 sm:flex-none" />
                  <Skeleton className="h-9 sm:h-10 w-20 sm:w-24 flex-1 sm:flex-none" />
                </div>
              </div>

              {[...Array(isMobile ? 5 : 10)].map((_, i) => (
                <div key={i} className="p-3 sm:p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
                    <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                      <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                      <Skeleton className="h-2 sm:h-3 w-20 sm:w-24" />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="hidden sm:block">
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 sm:h-6 w-12 sm:w-20" />
                  <Skeleton className="h-7 sm:h-8 w-7 sm:w-8 rounded ml-2 sm:ml-0" />
                </div>
              ))}
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"Employee Directory" }/>
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Employees</h2>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">
                {pagination.total} total employees • Showing {employees.length} of {pagination.total}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={fetchEmployees}
                disabled={loading}
                size="sm"
                className="flex-1 sm:flex-none min-w-[100px]"
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm">Refresh</span>
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="font-bold flex-1 sm:flex-none" size="sm">
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Add Employee</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader className="text-left sm:text-center">
                    <DialogTitle className="text-lg sm:text-xl">Add New Employee</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      Fill in the details to add a new employee. A user account will be automatically created.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="employeeId" className="text-xs sm:text-sm">Employee ID *</Label>
                        <Input 
                          id="employeeId" 
                          placeholder="EMP001"
                          value={formData.employeeId}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, employeeId: e.target.value})}
                          required
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="name" className="text-xs sm:text-sm">Full Name *</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, name: e.target.value})}
                          required
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="email" className="text-xs sm:text-sm">Email Address *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e: { target: { value: any } }) => setFormData({...formData, email: e.target.value})}
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="department" className="text-xs sm:text-sm">Department *</Label>
                        <Select 
                          value={formData.department}
                          onValueChange={(value) => setFormData({...formData, department: value})}
                          required
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="hr">Human Resources</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="designation" className="text-xs sm:text-sm">Designation *</Label>
                        <Input 
                          id="designation" 
                          placeholder="Software Engineer"
                          value={formData.designation}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, designation: e.target.value})}
                          required
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="employmentType" className="text-xs sm:text-sm">Employment Type *</Label>
                        <Select 
                          value={formData.employmentType}
                          onValueChange={(value) => setFormData({...formData, employmentType: value as 'full-time' | 'part-time' | 'contract' | 'intern'})}
                          required
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full Time</SelectItem>
                            <SelectItem value="part-time">Part Time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="intern">Intern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="joiningDate" className="text-xs sm:text-sm">Joining Date *</Label>
                        <Input 
                          id="joiningDate" 
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, joiningDate: e.target.value})}
                          required
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <Label htmlFor="workLocation" className="text-xs sm:text-sm">Work Location *</Label>
                      <Input 
                        id="workLocation" 
                        placeholder="Bangalore Office"
                        value={formData.workLocation}
                        onChange={(e: { target: { value: any } }) => setFormData({...formData, workLocation: e.target.value})}
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="panNumber" className="text-xs sm:text-sm">PAN Number</Label>
                        <Input 
                          id="panNumber" 
                          placeholder="ABCDE1234F"
                          value={formData.panNumber || ''}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, panNumber: e.target.value})}
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="aadhaarNumber" className="text-xs sm:text-sm">Aadhaar Number</Label>
                        <Input 
                          id="aadhaarNumber" 
                          placeholder="1234 5678 9012"
                          value={formData.aadhaarNumber || ''}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, aadhaarNumber: e.target.value})}
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="uanNumber" className="text-xs sm:text-sm">UAN Number *</Label>
                        <Input 
                          id="uanNumber" 
                          placeholder="123456789012"
                          value={formData.uanNumber || ''}
                          onChange={(e: { target: { value: any } }) => setFormData({...formData, uanNumber: e.target.value})}
                          required
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                    </div>

                    <div className="space-y-2 sm:space-y-3">
                      <Label className="text-xs sm:text-sm font-medium">Bank Details (Optional)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                          <Input 
                            id="bankName" 
                            placeholder="State Bank of India"
                            value={formData.bankDetails?.bankName || ''}
                            onChange={(e: { target: { value: any } }) => setFormData({
                              ...formData, 
                              bankDetails: {
                                ...formData.bankDetails,
                                bankName: e.target.value
                              }
                            })}
                            className="text-sm"
                            label={undefined}
                          />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="accountNumber" className="text-xs">Account Number</Label>
                          <Input 
                            id="accountNumber" 
                            placeholder="1234567890"
                            value={formData.bankDetails?.accountNumber || ''}
                            onChange={(e: { target: { value: any } }) => setFormData({
                              ...formData, 
                              bankDetails: {
                                ...formData.bankDetails,
                                accountNumber: e.target.value
                              }
                            })}
                            className="text-sm"
                            label={undefined}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="ifscCode" className="text-xs">IFSC Code</Label>
                          <Input 
                            id="ifscCode" 
                            placeholder="SBIN0001234"
                            value={formData.bankDetails?.ifscCode || ''}
                            onChange={(e: { target: { value: any } }) => setFormData({
                              ...formData, 
                              bankDetails: {
                                ...formData.bankDetails,
                                ifscCode: e.target.value
                              }
                            })}
                            className="text-sm"
                            label={undefined}
                          />
                        </div>
                        <div className="space-y-1 sm:space-y-2">
                          <Label htmlFor="branch" className="text-xs">Branch</Label>
                          <Input 
                            id="branch" 
                            placeholder="Main Branch, Bangalore"
                            value={formData.bankDetails?.branch || ''}
                            onChange={(e: { target: { value: any } }) => setFormData({
                              ...formData, 
                              bankDetails: {
                                ...formData.bankDetails,
                                branch: e.target.value
                              }
                            })}
                            className="text-sm"
                            label={undefined}
                          />
                        </div>
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <Label htmlFor="accountHolderName" className="text-xs">Account Holder Name</Label>
                        <Input 
                          id="accountHolderName" 
                          placeholder="John Doe"
                          value={formData.bankDetails?.accountHolderName || ''}
                          onChange={(e: { target: { value: any } }) => setFormData({
                            ...formData, 
                            bankDetails: {
                              ...formData.bankDetails,
                              accountHolderName: e.target.value
                            }
                          })}
                          className="text-sm"
                          label={undefined}
                        />
                      </div>
                    </div>
                    
                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto order-2 sm:order-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto order-1 sm:order-2">
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                            <span className="text-xs sm:text-sm">Creating...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="text-xs sm:text-sm">Create Employee</span>
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="bg-destructive/10 border-destructive" title={undefined} description={undefined} footer={undefined}>
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0" />
                <p className="text-destructive font-medium text-sm sm:text-base flex-1">{error}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchEmployees}
                  className="ml-auto flex-shrink-0"
                >
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Search and Filters */}
          <Card className="p-0 overflow-hidden" title={undefined} description={undefined} footer={undefined}>
            <div className="p-3 sm:p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search name, email, department, ID..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 bg-background w-full text-sm"
                  value={searchTerm}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchTerm(e.target.value)} 
                  label={undefined}
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Select 
                  value={filters.department} 
                  onValueChange={(value) => setFilters({...filters, department: value, page: 1})}
                >
                  <SelectTrigger className="w-full sm:w-[160px] bg-background text-sm">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={filters.isActive?.toString() || 'all'} 
                  onValueChange={(value) => setFilters({
                    ...filters, 
                    isActive: value === 'all' ? undefined : value === 'true',
                    page: 1
                  })}
                >
                  <SelectTrigger className="w-full sm:w-[140px] bg-background text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="bg-background w-full sm:w-auto text-sm" size="sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">More Filters</span>
                  <span className="sm:hidden">Filters</span>
                </Button>
              </div>
            </div>

            {/* Employees Table - Responsive */}
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  {/* Mobile Optimized Table View */}
                  <div className="relative">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30">
                          <tr className="border-b">
                            <th className="p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <span>Employee</span>
                                {isMobile && <ChevronDown className="w-3 h-3" />}
                              </div>
                            </th>
                            <th className={`p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ${isMobile ? 'hidden' : ''}`}>
                              ID
                            </th>
                            <th className={`p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ${isMobile ? 'hidden' : ''}`}>
                              Department & Role
                            </th>
                            <th className={`p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap ${isMobile ? 'hidden' : ''}`}>
                              Joining Date
                            </th>
                            <th className="p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                              Status
                            </th>
                            <th className="p-3 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {employees.map((employee) => {
                            const userName = employee.user?.name || 'Unknown';
                            const userEmail = employee.user?.email || 'No email';
                            const userAvatar = employee.user?.avatar;
                            
                            return (
                              <tr 
                                key={employee.id} 
                                className="hover:bg-muted/20 transition-colors cursor-pointer group"
                                onClick={() => handleViewProfile(employee)}
                              >
                                <td className="p-3">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background group-hover:border-primary/20 transition-all flex-shrink-0">
                                      <AvatarImage src={userAvatar} alt={userName} />
                                      <AvatarFallback className="text-xs">
                                        {userName
                                          .split(" ")
                                          .map((n) => n?.[0] || '')
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-sm truncate">{userName}</div>
                                      {isMobile ? (
                                        <div className="text-xs text-muted-foreground truncate">
                                          {employee.designation || 'N/A'} • {employee.department || 'N/A'}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className={`p-3 ${isMobile ? 'hidden' : ''}`}>
                                  <span className="text-sm font-medium text-muted-foreground font-mono whitespace-nowrap">
                                    {employee.employeeId || 'N/A'}
                                  </span>
                                </td>
                                <td className={`p-3 ${isMobile ? 'hidden' : ''}`}>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium truncate">{employee.designation || 'N/A'}</span>
                                    <Badge variant="outline" className="w-fit text-xs mt-1">
                                      {employee.department || 'N/A'}
                                    </Badge>
                                  </div>
                                </td>
                                <td className={`p-3 ${isMobile ? 'hidden' : ''}`}>
                                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    {employee.joiningDate ? formatDate(employee.joiningDate) : 'N/A'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${getStatusColor(
                                      employee.isActive !== undefined ? employee.isActive : true
                                    )}`}
                                  >
                                    {employee.isActive !== undefined ? (employee.isActive ? 'Active' : 'Inactive') : 'Active'}
                                  </span>
                                </td>
                                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 sm:w-48">
                                      <DropdownMenuItem onClick={() => handleViewProfile(employee)} className="text-xs sm:text-sm">
                                        View Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditEmployee(employee)} className="text-xs sm:text-sm">
                                        Edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRunPayroll(employee)} className="text-xs sm:text-sm">
                                        Run Payroll
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive text-xs sm:text-sm"
                                        onClick={() => handleDeactivate(employee)}
                                      >
                                        Deactivate
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {employees.length === 0 && !loading && (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">No employees found</h3>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        {searchTerm ? 'Try adjusting your search terms' : 'No employees have been added yet'}
                      </p>
                      <Button 
                        className="mt-3 sm:mt-4 text-sm"
                        onClick={() => setIsAddDialogOpen(true)}
                        size="sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Add Your First Employee
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pagination - Responsive */}
            {pagination.pages > 1 && (
              <div className="p-3 sm:p-4 border-t bg-muted/10 text-xs sm:text-sm text-muted-foreground">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                  <div className="text-center sm:text-left">
                    <span className="font-medium">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} employees
                    </span>
                    {isMobile && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Page {pagination.page} of {pagination.pages}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* First Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={pagination.page === 1 || loading}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      title="First page"
                    >
                      <ChevronsLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    {/* Previous Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPaginationRange().map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs ${isMobile && pagination.page === pageNum ? 'font-bold' : ''}`}
                        >
                          {pageNum}
                        </Button>
                      ))}
                      
                      {/* Ellipsis for many pages */}
                      {pagination.pages > (isMobile ? 3 : 5) && pagination.page < pagination.pages - 1 && (
                        <span className="px-1 sm:px-2">...</span>
                      )}
                      
                      {/* Last page button if not in range */}
                      {pagination.pages > (isMobile ? 3 : 5) && !getPaginationRange().includes(pagination.pages) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.pages)}
                          disabled={loading}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs"
                        >
                          {pagination.pages}
                        </Button>
                      )}
                    </div>
                    
                    {/* Next Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages || loading}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      title="Next page"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    
                    {/* Last Page Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.pages)}
                      disabled={pagination.page === pagination.pages || loading}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      title="Last page"
                    >
                      <ChevronsRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  
                  {/* Items per page info for mobile */}
                  {isMobile && (
                    <div className="text-xs text-center text-muted-foreground">
                      Showing {pagination.limit} per page
                    </div>
                  )}
                </div>
                
                {/* Quick Page Jumper for Desktop */}
                {!isMobile && pagination.pages > 5 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">Go to page:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={pagination.pages}
                        value={pagination.page}
                        onChange={(e) => {
                          const page = Math.max(1, Math.min(pagination.pages, parseInt(e.target.value) || 1))
                          handlePageChange(page)
                        }}
                        className="w-12 h-7 text-center border rounded text-xs"
                        disabled={loading}
                      />
                      <span className="text-xs text-muted-foreground">of {pagination.pages}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Edit Employee Dialog */}
      <EditEmployeeDialog
        employee={selectedEmployee}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchEmployees}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Deactivate Employee</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to deactivate {selectedEmployee?.user.name}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-sm text-muted-foreground">
              The employee will no longer be able to access the system and will 
              be marked as inactive. Their data will be preserved.
            </p>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedEmployee(null)
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Deactivate Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}