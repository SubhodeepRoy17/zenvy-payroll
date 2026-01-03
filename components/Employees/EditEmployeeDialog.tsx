"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/Common/Input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmployeeResponse } from '@/types/employee'
import { EmployeeService } from '@/services/employee-service'
import { toast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

interface EditEmployeeDialogProps {
  employee: EmployeeResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditEmployeeDialog({ 
  employee, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditEmployeeDialogProps) {
  const [formData, setFormData] = useState({
    department: '',
    designation: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'intern',
    workLocation: '',
    panNumber: '',
    aadhaarNumber: '',
    uanNumber: '',
    esiNumber: '',
    bankDetails: {
      accountNumber: '',
      accountHolderName: '',
      bankName: '',
      branch: '',
      ifscCode: '',
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with employee data
  useEffect(() => {
    if (employee) {
      setFormData({
        department: employee.department || '',
        designation: employee.designation || '',
        employmentType: employee.employmentType as any || 'full-time',
        workLocation: employee.workLocation || '',
        panNumber: employee.panNumber || '',
        aadhaarNumber: employee.aadhaarNumber || '',
        uanNumber: employee.uanNumber || '',
        esiNumber: employee.esiNumber || '',
        bankDetails: {
          accountNumber: employee.bankDetails?.accountNumber || '',
          accountHolderName: employee.bankDetails?.accountHolderName || '',
          bankName: employee.bankDetails?.bankName || '',
          branch: employee.bankDetails?.branch || '',
          ifscCode: employee.bankDetails?.ifscCode || '',
        },
      })
    }
  }, [employee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return

    setIsSubmitting(true)
    
    try {
      // Prepare update data (only include changed fields)
      const updateData: any = {}
      
      if (formData.department !== employee.department) updateData.department = formData.department
      if (formData.designation !== employee.designation) updateData.designation = formData.designation
      if (formData.employmentType !== employee.employmentType) updateData.employmentType = formData.employmentType
      if (formData.workLocation !== employee.workLocation) updateData.workLocation = formData.workLocation
      if (formData.panNumber !== employee.panNumber) updateData.panNumber = formData.panNumber
      if (formData.aadhaarNumber !== employee.aadhaarNumber) updateData.aadhaarNumber = formData.aadhaarNumber
      if (formData.uanNumber !== employee.uanNumber) updateData.uanNumber = formData.uanNumber
      if (formData.esiNumber !== employee.esiNumber) updateData.esiNumber = formData.esiNumber
      
      // Check if bank details changed
      const bankDetailsChanged = 
        formData.bankDetails.accountNumber !== employee.bankDetails?.accountNumber ||
        formData.bankDetails.accountHolderName !== employee.bankDetails?.accountHolderName ||
        formData.bankDetails.bankName !== employee.bankDetails?.bankName ||
        formData.bankDetails.branch !== employee.bankDetails?.branch ||
        formData.bankDetails.ifscCode !== employee.bankDetails?.ifscCode
      
      if (bankDetailsChanged) {
        updateData.bankDetails = formData.bankDetails
      }

      // Only send update if something changed
      if (Object.keys(updateData).length > 0) {
        const response = await EmployeeService.updateEmployee(employee.id, updateData)
        
        if (response.success) {
          toast({
            title: 'Success',
            description: `Employee ${employee.user.name} updated successfully!`,
          })
          onSuccess()
          onOpenChange(false)
        }
      } else {
        toast({
          title: 'No changes',
          description: 'No changes were made to the employee details.',
        })
        onOpenChange(false)
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update employee',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Update the details for {employee.user.name} ({employee.employeeId})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department *</Label>
                <Select 
                  value={formData.department}
                  onValueChange={(value) => setFormData({...formData, department: value})}
                  required
                >
                  <SelectTrigger id="edit-department">
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
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-designation">Designation *</Label>
                <Input 
                  id="edit-designation" 
                  placeholder="Software Engineer"
                  value={formData.designation}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, designation: e.target.value})}
                  required
                  label={undefined}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-employmentType">Employment Type *</Label>
                <Select 
                  value={formData.employmentType}
                  onValueChange={(value) => setFormData({...formData, employmentType: value as any})}
                  required
                >
                  <SelectTrigger id="edit-employmentType">
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
              
              <div className="space-y-2">
                <Label htmlFor="edit-workLocation">Work Location *</Label>
                <Input 
                  id="edit-workLocation" 
                  placeholder="Bangalore Office"
                  value={formData.workLocation}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, workLocation: e.target.value})}
                  required
                  label={undefined}
                />
              </div>
            </div>
          </div>

          {/* Government IDs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Government IDs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-panNumber">PAN Number</Label>
                <Input 
                  id="edit-panNumber" 
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, panNumber: e.target.value})}
                  label={undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-aadhaarNumber">Aadhaar Number</Label>
                <Input 
                  id="edit-aadhaarNumber" 
                  placeholder="1234 5678 9012"
                  value={formData.aadhaarNumber}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, aadhaarNumber: e.target.value})}
                  label={undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-uanNumber">UAN Number</Label>
                <Input 
                  id="edit-uanNumber" 
                  placeholder="123456789012"
                  value={formData.uanNumber}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, uanNumber: e.target.value})}
                  label={undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-esiNumber">ESI Number (Optional)</Label>
                <Input 
                  id="edit-esiNumber" 
                  placeholder="ESI Number"
                  value={formData.esiNumber}
                  onChange={(e: { target: { value: any } }) => setFormData({...formData, esiNumber: e.target.value})}
                  label={undefined}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bank Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bankName" className="text-sm">Bank Name</Label>
                <Input 
                  id="edit-bankName" 
                  placeholder="State Bank of India"
                  value={formData.bankDetails.bankName}
                  onChange={(e: { target: { value: any } }) => setFormData({
                    ...formData, 
                    bankDetails: {
                      ...formData.bankDetails,
                      bankName: e.target.value
                    }
                  })}
                  label={undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber" className="text-sm">Account Number</Label>
                <Input 
                  id="edit-accountNumber" 
                  placeholder="1234567890"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e: { target: { value: any } }) => setFormData({
                    ...formData, 
                    bankDetails: {
                      ...formData.bankDetails,
                      accountNumber: e.target.value
                    }
                  })}
                  label={undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-accountHolderName" className="text-sm">Account Holder Name</Label>
                <Input 
                  id="edit-accountHolderName" 
                  placeholder="John Doe"
                  value={formData.bankDetails.accountHolderName}
                  onChange={(e: { target: { value: any } }) => setFormData({
                    ...formData, 
                    bankDetails: {
                      ...formData.bankDetails,
                      accountHolderName: e.target.value
                    }
                  })}
                  label={undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-ifscCode" className="text-sm">IFSC Code</Label>
                <Input 
                  id="edit-ifscCode" 
                  placeholder="SBIN0001234"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e: { target: { value: any } }) => setFormData({
                    ...formData, 
                    bankDetails: {
                      ...formData.bankDetails,
                      ifscCode: e.target.value
                    }
                  })}
                  label={undefined}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-branch" className="text-sm">Branch</Label>
              <Input 
                id="edit-branch" 
                placeholder="Main Branch, Bangalore"
                value={formData.bankDetails.branch}
                onChange={(e: { target: { value: any } }) => setFormData({
                  ...formData, 
                  bankDetails: {
                    ...formData.bankDetails,
                    branch: e.target.value
                  }
                })}
                label={undefined}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Employee'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}