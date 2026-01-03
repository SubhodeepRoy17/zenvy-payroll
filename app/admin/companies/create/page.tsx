"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { apiService } from "@/services/api-service"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Card } from "@/components/Common/Card"
import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { ArrowLeft, Building, Globe, Phone, Mail, MapPin, Calendar, CreditCard, Shield, User, DollarSign, ChevronLeft } from "lucide-react"

interface CompanyFormData {
  name: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  phone: string
  email: string
  website: string
  taxId: string
  currency: string
  fiscalYearStart: string
  fiscalYearEnd: string
  logo: string
  
  // Settings
  workingDaysPerWeek: number
  workingHoursPerDay: number
  overtimeRate: number
  leaveEncashmentRate: number
  taxDeductionPercentage: number
  pfDeductionPercentage: number
  esiDeductionPercentage: number
  probationPeriodMonths: number
  noticePeriodDays: number
  paymentDate: number
  currencySymbol: string
}

export default function CreateCompanyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEdit] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    currency: "INR",
    fiscalYearStart: "",
    fiscalYearEnd: "",
    logo: "",
    
    // Default settings
    workingDaysPerWeek: 6,
    workingHoursPerDay: 8,
    overtimeRate: 1.5,
    leaveEncashmentRate: 1,
    taxDeductionPercentage: 10,
    pfDeductionPercentage: 12,
    esiDeductionPercentage: 0.75,
    probationPeriodMonths: 3,
    noticePeriodDays: 30,
    paymentDate: 1,
    currencySymbol: "₹"
  })

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    router.push('/admin-dashboard')
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    const requiredFields = [
      'name', 'address', 'city', 'state', 'country', 'postalCode',
      'phone', 'email', 'taxId', 'currency', 'fiscalYearStart', 'fiscalYearEnd'
    ]

    for (const field of requiredFields) {
      if (!formData[field as keyof CompanyFormData]) {
        toast.error(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`)
        return
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Invalid email format')
      return
    }

    // Validate phone
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      toast.error('Invalid phone number')
      return
    }

    // Validate fiscal year dates
    if (new Date(formData.fiscalYearStart) >= new Date(formData.fiscalYearEnd)) {
      toast.error('Fiscal year start must be before fiscal year end')
      return
    }

    setIsSubmitting(true)

    try {
      const companyData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
        phone: formData.phone,
        email: formData.email.toLowerCase(),
        website: formData.website || undefined,
        taxId: formData.taxId,
        currency: formData.currency,
        fiscalYearStart: new Date(formData.fiscalYearStart),
        fiscalYearEnd: new Date(formData.fiscalYearEnd),
        logo: formData.logo || undefined,
        settings: {
          workingDaysPerWeek: formData.workingDaysPerWeek,
          workingHoursPerDay: formData.workingHoursPerDay,
          overtimeRate: formData.overtimeRate,
          leaveEncashmentRate: formData.leaveEncashmentRate,
          taxDeductionPercentage: formData.taxDeductionPercentage,
          pfDeductionPercentage: formData.pfDeductionPercentage,
          esiDeductionPercentage: formData.esiDeductionPercentage,
          probationPeriodMonths: formData.probationPeriodMonths,
          noticePeriodDays: formData.noticePeriodDays,
          paymentDate: formData.paymentDate,
          currencySymbol: formData.currencySymbol
        }
      }

      const response = await apiService.post('/api/companies', companyData) as { success: boolean; message?: string }
      
      if (response.success) {
        toast.success('Company created successfully!')
        router.push('/admin-dashboard?tab=companies')
      } else {
        toast.error(response.message || 'Failed to create company')
      }
    } catch (error: any) {
      console.error('Create company error:', error)
      toast.error(error.message || 'Failed to create company')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"Create Company"} />
        
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin-dashboard?tab=companies')}
              className="mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              size="sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back to Companies
            </Button>
            
            <h1 className="text-2xl sm:text-3xl font-bold">Create New Company</h1>
            <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">
              Set up a new organization in the system
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Information Card */}
              <Card title="Basic Information" description="Company details and contact information" footer={undefined} className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        Company Name *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter company name"
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        Tax ID / GSTIN *
                      </label>
                      <Input
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleInputChange}
                        placeholder="Enter Tax ID or GSTIN"
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                        Email Address *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="company@example.com"
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        Phone Number *
                      </label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 1234567890"
                        required
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                        Website
                      </label>
                      <Input
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.com"
                        className="text-sm"
                        label={undefined}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                        Currency *
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="w-full p-2 sm:p-3 border rounded-lg bg-background text-sm"
                        required
                        disabled={isSubmitting}
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 sm:p-3 border rounded-lg bg-background min-h-[80px] text-sm"
                      placeholder="Enter full address"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">City *</label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">State *</label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Country *</label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                        required
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Postal Code *</label>
                      <Input
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="Postal Code"
                        required
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fiscal Year Card */}
              <Card title="Fiscal Year" description="Set the financial year for the company" footer={undefined} className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      Fiscal Year Start *
                    </label>
                    <Input
                      name="fiscalYearStart"
                      type="date"
                      value={formData.fiscalYearStart}
                      onChange={handleInputChange}
                      required
                      className="text-sm"
                      label={undefined}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      Fiscal Year End *
                    </label>
                    <Input
                      name="fiscalYearEnd"
                      type="date"
                      value={formData.fiscalYearEnd}
                      onChange={handleInputChange}
                      required
                      className="text-sm"
                      label={undefined}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </Card>

              {/* Company Settings Card */}
              {!isEdit && (
                <Card title="Company Settings" description="Configure default payroll and HR settings" footer={undefined} className="p-4 sm:p-6">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Working Days/Week</label>
                        <Input
                          name="workingDaysPerWeek"
                          type="number"
                          min="1"
                          max="7"
                          value={formData.workingDaysPerWeek}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Working Hours/Day</label>
                        <Input
                          name="workingHoursPerDay"
                          type="number"
                          min="1"
                          max="24"
                          value={formData.workingHoursPerDay}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Overtime Rate</label>
                        <Input
                          name="overtimeRate"
                          type="number"
                          step="0.1"
                          min="1"
                          value={formData.overtimeRate}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Leave Encashment Rate</label>
                        <Input
                          name="leaveEncashmentRate"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.leaveEncashmentRate}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Tax Deduction (%)</label>
                        <Input
                          name="taxDeductionPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.taxDeductionPercentage}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">PF Deduction (%)</label>
                        <Input
                          name="pfDeductionPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.pfDeductionPercentage}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">ESI Deduction (%)</label>
                        <Input
                          name="esiDeductionPercentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.esiDeductionPercentage}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Probation Period (months)</label>
                        <Input
                          name="probationPeriodMonths"
                          type="number"
                          min="0"
                          value={formData.probationPeriodMonths}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Notice Period (days)</label>
                        <Input
                          name="noticePeriodDays"
                          type="number"
                          min="0"
                          value={formData.noticePeriodDays}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium">Payment Day</label>
                        <Input
                          name="paymentDate"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.paymentDate}
                          onChange={handleInputChange}
                          className="text-sm"
                          label={undefined}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Currency Symbol</label>
                      <Input
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleInputChange}
                        placeholder="₹"
                        maxLength={3}
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Logo Upload Card */}
              <Card title="Company Logo" description="Upload company logo (optional)" footer={undefined} className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed rounded-lg flex items-center justify-center flex-shrink-0">
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Company logo preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs sm:text-sm font-medium">Logo URL</label>
                      <Input
                        name="logo"
                        value={formData.logo}
                        onChange={handleInputChange}
                        placeholder="https://example.com/logo.png"
                        className="text-sm"
                        label={undefined}
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a direct URL to your company logo image
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin-dashboard?tab=companies')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-2 sm:order-1"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto order-1 sm:order-2"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">
                        {isEdit ? 'Updating...' : 'Creating...'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs sm:text-sm">
                      {isEdit ? 'Update Company' : 'Create Company'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}