"use client"

import { AvatarFallback } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { Sidebar } from "@/components/Layout/Sidebar"
import { Navbar } from "@/components/Layout/Navbar"
import { Card } from "@/components/Common/Card"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Shield, User, Building, CreditCard, Zap, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useRef } from "react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const tabsRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Navbar title={isMobile ? "" :"System Settings" }/>
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-5xl mx-auto">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground text-sm md:text-base">Configure your ZENVY experience and workspace preferences.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Desktop Tabs */}
            <TabsList className="bg-muted/50 p-1 rounded-xl h-auto hidden md:flex flex-wrap gap-1">
              <TabsTrigger
                value="general"
                className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
              >
                <Building className="w-4 h-4" />
                Workspace
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="px-4 py-2 text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Billing
              </TabsTrigger>
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
                  {[
                    { value: "general", icon: <Building className="w-4 h-4" />, label: "Workspace" },
                    { value: "profile", icon: <User className="w-4 h-4" />, label: "Profile" },
                    { value: "security", icon: <Shield className="w-4 h-4" />, label: "Security" },
                    { value: "notifications", icon: <Bell className="w-4 h-4" />, label: "Notifications" },
                    { value: "billing", icon: <CreditCard className="w-4 h-4" />, label: "Billing" }
                  ].map((tab) => (
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

            <TabsContent value="general" className="space-y-6">
              <Card title="Company Information" description="How your company appears across the platform." footer={undefined} className={undefined}>
                <div className="grid md:grid-cols-2 gap-4 md:gap-6 mt-4">
                  <Input label="Company Name" defaultValue="ZENVY Technologies Inc." className="text-sm md:text-base" />
                  <Input label="Tax ID" defaultValue="99-1234567" className="text-sm md:text-base" />
                  <Input label="Workspace URL" defaultValue="zenvy.ai/workspace/main" className="text-sm md:text-base" />
                  <Input label="Contact Email" defaultValue="admin@zenvy.ai" className="text-sm md:text-base" />
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm md:size-default">Save Changes</Button>
                </div>
              </Card>

              <Card title="Payroll Configuration" description="Set your default payroll cycles and disbursement rules." footer={undefined} className={undefined}>
                <div className="space-y-6 mt-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">AI Auto-Pilot</div>
                        <div className="text-xs text-muted-foreground">
                          Automatically process payroll on the last day of the month.
                        </div>
                      </div>
                    </div>
                    <div className="h-6 w-11 bg-primary rounded-full relative p-1 cursor-pointer">
                      <div className="h-4 w-4 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <Input label="Disbursement Day" type="number" defaultValue="31" className="text-sm md:text-base" />
                    <Input label="Default Currency" defaultValue="USD ($)" disabled className="text-sm md:text-base" />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card title="Personal Details" description="Update your personal information." footer={undefined} className={undefined}>
                <div className="flex flex-col items-center sm:flex-row gap-4 md:gap-6 mb-6 md:mb-8 mt-4">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-4 ring-primary/10">
                    <AvatarFallback className="text-lg md:text-xl">AD</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                      <Button size="sm">Upload New Photo</Button>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Remove
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                  <Input label="First Name" defaultValue="Admin" className="text-sm md:text-base" />
                  <Input label="Last Name" defaultValue="User" className="text-sm md:text-base" />
                  <Input label="Work Email" defaultValue="admin@zenvy.ai" className="text-sm md:text-base" />
                  <Input label="Phone Number" defaultValue="+1 (555) 000-0000" className="text-sm md:text-base" />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}