// app/employee-settings/page.tsx
"use client"

import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Shield, 
  Bell, 
  FileText, 
  Banknote, 
  Key, 
  Smartphone,
  Mail,
  UserCog,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  MapPin,
  Phone,
  CreditCard,
  Smartphone as Mobile,
  Shield as Privacy,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

export default function EmployeeSettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    personalEmail: "john.doe@example.com",
    phoneNumber: "+91 9876543210",
    emergencyContact: "+91 9123456789",
    bankName: "State Bank of India",
    accountNumber: "1234567890",
    accountHolderName: "John Doe",
    ifscCode: "SBIN0001234",
    branch: "Main Branch, Bangalore",
    panNumber: "ABCDE1234F",
    aadhaarNumber: "1234 5678 9012",
    uanNumber: "100123456789",
    notificationsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    language: "english"
  })

  const tabsRef = useRef<HTMLDivElement>(null)

  const handleSaveChanges = (section: string) => {
    toast.success(`${section} updated successfully`)
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword)
  }

  const handleToggleBankDetails = () => {
    setShowBankDetails(!showBankDetails)
  }

  const handleChangePassword = () => {
    toast.info("Password change functionality coming soon!")
  }

  const handleEnable2FA = () => {
    toast.success("Two-factor authentication enabled")
  }

  const handleDownloadDocuments = () => {
    toast.info("Document download feature coming soon!")
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return
    
    const scrollAmount = 200
    const currentScroll = tabsRef.current.scrollLeft
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount
      : currentScroll + scrollAmount
    
    tabsRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    })
  }

  const tabs = [
    { value: "profile", icon: <User className="w-4 h-4" />, label: "Personal Info" },
    { value: "bank", icon: <Banknote className="w-4 h-4" />, label: "Bank Details" },
    { value: "documents", icon: <FileText className="w-4 h-4" />, label: "Documents" },
    { value: "security", icon: <Shield className="w-4 h-4" />, label: "Security" },
    { value: "notifications", icon: <Bell className="w-4 h-4" />, label: "Notifications" },
    { value: "preferences", icon: <UserCog className="w-4 h-4" />, label: "Preferences" }
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"My Settings" }/>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-5xl mx-auto">
          {/* Header with welcome message */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">My Settings</h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Manage your personal information, security, and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm md:text-base">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm md:text-base">{user?.name || "Employee"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "employee@company.com"}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Desktop Tabs */}
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto hidden md:flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
                >
                  {tab.icon}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Mobile Tabs Carousel */}
            <div className="md:hidden relative">
              <div className="flex items-center">
                <button
                  onClick={() => scrollTabs('left')}
                  className="p-2 bg-muted rounded-l-lg flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div 
                  ref={tabsRef}
                  className="flex overflow-x-auto scrollbar-hide gap-1 px-2"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`px-4 py-3 rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
                        activeTab === tab.value
                          ? 'bg-background shadow-sm font-bold'
                          : 'bg-muted/50'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => scrollTabs('right')}
                  className="p-2 bg-muted rounded-r-lg flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Personal Information Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card 
                title="Personal Information" 
                description="Update your contact details and personal information."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center sm:flex-row gap-4 md:gap-6 p-4 bg-muted/30 rounded-xl">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-4 ring-primary/10">
                      <AvatarFallback className="text-lg md:text-2xl bg-primary/10 text-primary">
                        {user?.name?.split(' ').map(n => n[0]).join('') || "JD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-3 text-center sm:text-left">
                      <div>
                        <h4 className="font-semibold">Profile Picture</h4>
                        <p className="text-sm text-muted-foreground">Upload a professional photo for your profile</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                        <Button size="sm">
                          <User className="w-4 h-4 mr-2" />
                          Upload New
                        </Button>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <Input 
                      label="First Name" 
                      value={formData.firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, firstName: e.target.value})}
                      className="text-sm md:text-base"
                    />
                    <Input 
                      label="Last Name" 
                      value={formData.lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, lastName: e.target.value})}
                      className="text-sm md:text-base"
                    />
                    <Input 
                      label="Personal Email" 
                      type="email"
                      icon={<Mail className="w-4 h-4" />}
                      value={formData.personalEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, personalEmail: e.target.value})}
                      className="text-sm md:text-base"
                    />
                    <Input 
                      label="Phone Number" 
                      type="tel"
                      icon={<Phone className="w-4 h-4" />}
                      value={formData.phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, phoneNumber: e.target.value})}
                      className="text-sm md:text-base"
                    />
                    <Input 
                      label="Emergency Contact" 
                      type="tel"
                      icon={<Phone className="w-4 h-4" />}
                      value={formData.emergencyContact}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, emergencyContact: e.target.value})}
                      className="text-sm md:text-base"
                    />
                  </div>

                  {/* Company Information (Read-only) */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Company Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-xs md:text-sm text-muted-foreground">Employee ID</label>
                        <p className="font-medium text-sm md:text-base">EMP-001</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs md:text-sm text-muted-foreground">Department</label>
                        <p className="font-medium text-sm md:text-base">Engineering</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs md:text-sm text-muted-foreground">Designation</label>
                        <p className="font-medium text-sm md:text-base">Software Engineer</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs md:text-sm text-muted-foreground">Joining Date</label>
                        <p className="font-medium text-sm md:text-base">Jan 15, 2023</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveChanges("Personal information")} size="sm md:size-default">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Bank Details Tab */}
            <TabsContent value="bank" className="space-y-6">
              <Card 
                title="Bank Account Details" 
                description="Manage your salary disbursement bank account information."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Security Notice */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Your bank details are secure</p>
                      <p className="text-xs text-blue-600 mt-1">
                        This information is encrypted and only used for salary disbursements. 
                        Contact HR if you need to update these details.
                      </p>
                    </div>
                  </div>

                  {/* Bank Details with Toggle */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-semibold">Bank Information</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleToggleBankDetails}
                        className="flex items-center gap-2 w-fit"
                      >
                        {showBankDetails ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>

                    {showBankDetails ? (
                      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                        <Input 
                          label="Bank Name" 
                          icon={<Banknote className="w-4 h-4" />}
                          value={formData.bankName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, bankName: e.target.value})}
                          className="text-sm md:text-base"
                        />
                        <Input 
                          label="Account Holder Name" 
                          value={formData.accountHolderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, accountHolderName: e.target.value})}
                          className="text-sm md:text-base"
                        />
                        <Input 
                          label="Account Number" 
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, accountNumber: e.target.value})}
                          className="text-sm md:text-base"
                        />
                        <Input 
                          label="IFSC Code" 
                          value={formData.ifscCode}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, ifscCode: e.target.value})}
                          className="text-sm md:text-base"
                        />
                        <div className="md:col-span-2">
                          <Input 
                            label="Branch" 
                            icon={<MapPin className="w-4 h-4" />}
                            value={formData.branch}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, branch: e.target.value})}
                            className="text-sm md:text-base"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Bank details are hidden for security</p>
                        <Button 
                          variant="link" 
                          onClick={handleToggleBankDetails}
                          className="mt-2"
                        >
                          Click to view details
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveChanges("Bank details")} size="sm md:size-default">
                      Update Bank Details
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card 
                title="Personal Documents" 
                description="Upload and manage your personal identification documents."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Document List */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">PAN Card</h4>
                          <p className="text-sm text-muted-foreground">Required for tax purposes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-0 sm:ml-3">
                        <span className="text-sm font-mono truncate">{formData.panNumber}</span>
                        <Button variant="outline" size="sm" onClick={handleDownloadDocuments}>
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Aadhaar Card</h4>
                          <p className="text-sm text-muted-foreground">Government ID proof</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-0 sm:ml-3">
                        <span className="text-sm font-mono truncate">{formData.aadhaarNumber}</span>
                        <Button variant="outline" size="sm" onClick={handleDownloadDocuments}>
                          Download
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">UAN Number</h4>
                          <p className="text-sm text-muted-foreground">Employee Provident Fund</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-0 sm:ml-3">
                        <span className="text-sm font-mono truncate">{formData.uanNumber}</span>
                        <Button variant="outline" size="sm" onClick={handleDownloadDocuments}>
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Upload New Document */}
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">Upload New Document</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload additional documents (Max 5MB, PDF/JPEG/PNG)
                    </p>
                    <Button variant="outline" size="sm md:size-default">
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card 
                title="Security Settings" 
                description="Manage your account security and privacy settings."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Password Change */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Password
                        </h4>
                        <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleChangePassword}
                        className="w-fit"
                      >
                        Change Password
                      </Button>
                    </div>
                    
                    {/* Current Password (Hidden by default) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">Current Password</label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleTogglePassword}
                          className="h-6 text-xs"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value="••••••••"
                        readOnly
                        icon={<Lock className="w-4 h-4" />} 
                        label={undefined}
                        className="text-sm md:text-base"
                      />
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleEnable2FA}
                        size="sm md:size-default"
                        className="w-fit"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Two-factor authentication is currently disabled. Enable it for enhanced security.
                      </p>
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Recent Login Activity</h4>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Smartphone className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Chrome on Windows</p>
                            <p className="text-xs text-muted-foreground">Bangalore, India • Just now</p>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium sm:ml-3">Current</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Mobile className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Mobile App</p>
                            <p className="text-xs text-muted-foreground">2 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card 
                title="Notification Preferences" 
                description="Control how and when you receive notifications."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Notification Toggles */}
                  <div className="space-y-4">
                    {[
                      { 
                        title: "Push Notifications", 
                        description: "Receive notifications in your browser",
                        checked: formData.notificationsEnabled,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, notificationsEnabled: e.target.checked}),
                        id: "push-notifications"
                      },
                      { 
                        title: "Email Notifications", 
                        description: "Receive salary slips and updates via email",
                        checked: formData.emailNotifications,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, emailNotifications: e.target.checked}),
                        id: "email-notifications"
                      },
                      { 
                        title: "SMS Notifications", 
                        description: "Receive important alerts via SMS",
                        checked: formData.smsNotifications,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, smsNotifications: e.target.checked}),
                        id: "sms-notifications"
                      }
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.description}</p>
                        </div>
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={notification.checked}
                            onChange={notification.onChange}
                            className="sr-only"
                            id={notification.id}
                          />
                          <label 
                            htmlFor={notification.id}
                            className={`block w-11 h-6 rounded-full cursor-pointer transition-colors ${
                              notification.checked ? 'bg-primary' : 'bg-gray-300'
                            }`}
                          >
                            <span 
                              className={`block w-4 h-4 bg-white rounded-full transform transition-transform mt-1 ${
                                notification.checked ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Notification Types</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { title: "Salary Disbursement", description: "When salary is credited", color: "bg-green-500" },
                        { title: "Payslip Available", description: "When new payslip is ready", color: "bg-blue-500" },
                        { title: "Tax Updates", description: "Important tax-related information", color: "bg-purple-500" },
                        { title: "Policy Changes", description: "Company policy updates", color: "bg-amber-500" }
                      ].map((type, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${type.color}`} />
                            <span className="font-medium">{type.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveChanges("Notification preferences")} size="sm md:size-default">
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card 
                title="Preferences" 
                description="Customize your ZENVY experience."
                footer={undefined} 
                className={undefined}
              >
                <div className="space-y-6 mt-4">
                  {/* Appearance */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Appearance</h4>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Dark Mode</h4>
                        <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                      </div>
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={formData.darkMode}
                          onChange={(e) => setFormData({...formData, darkMode: e.target.checked})}
                          className="sr-only"
                          id="dark-mode"
                        />
                        <label 
                          htmlFor="dark-mode"
                          className={`block w-11 h-6 rounded-full cursor-pointer transition-colors ${
                            formData.darkMode ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span 
                            className={`block w-4 h-4 bg-white rounded-full transform transition-transform mt-1 ${
                              formData.darkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Language & Region</h4>
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Language</label>
                        <select 
                          value={formData.language}
                          onChange={(e) => setFormData({...formData, language: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg bg-background text-sm md:text-base"
                        >
                          <option value="english">English</option>
                          <option value="hindi">Hindi</option>
                          <option value="tamil">Tamil</option>
                          <option value="telugu">Telugu</option>
                          <option value="kannada">Kannada</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Currency</label>
                        <select 
                          className="w-full px-3 py-2 border rounded-lg bg-background text-sm md:text-base"
                          disabled
                        >
                          <option>Indian Rupee (₹)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Data & Privacy */}
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Privacy className="w-4 h-4" />
                      Data & Privacy
                    </h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start text-sm md:text-base">
                        Export My Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm md:text-base">
                        Delete Account
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deleting your account will permanently remove all your data. This action cannot be undone.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => handleSaveChanges("Preferences")} size="sm md:size-default">
                      Save Preferences
                    </Button>
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