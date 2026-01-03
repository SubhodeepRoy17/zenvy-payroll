"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { AdminService } from "@/services/admin-service"

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  position?: string
  status: 'active' | 'inactive' | 'suspended'
}

interface EditUserFormProps {
  user: User
  onSuccess: () => void
  onCancel: () => void
}

export function EditUserForm({ user, onSuccess, onCancel }: EditUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role as "admin" | "hr" | "employee",
    department: user.department || "",
    position: user.position || "",
    isActive: user.status === 'active',
    password: "",
    confirmPassword: "",
  })

  const [showPasswordFields, setShowPasswordFields] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields")
      return
    }
    
    if (showPasswordFields) {
      if (formData.password && formData.password.length < 6) {
        toast.error("Password must be at least 6 characters")
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
    }
    
    setIsSubmitting(true)
    
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        isActive: formData.isActive,
      }
      
      if (showPasswordFields && formData.password) {
        updateData.password = formData.password
      }
      
      await AdminService.updateUser(user.id, updateData)
      
      toast.success("User updated successfully")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name *"
        value={formData.name}
        onChange={(e: { target: { value: any } }) => setFormData({...formData, name: e.target.value})}
        placeholder="John Doe"
        required
        disabled={isSubmitting}
      />
      
      <Input
        label="Email Address *"
        type="email"
        value={formData.email}
        onChange={(e: { target: { value: any } }) => setFormData({...formData, email: e.target.value})}
        placeholder="john@company.com"
        required
        disabled={isSubmitting}
      />
      
      <div>
        <label className="text-sm font-medium mb-2 block">Role *</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value as any})}
          className="w-full p-2 border rounded-lg bg-background"
          required
          disabled={isSubmitting}
        >
          <option value="employee">Employee</option>
          <option value="hr">HR Manager</option>
          <option value="admin">Administrator</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Department"
          value={formData.department}
          onChange={(e: { target: { value: any } }) => setFormData({...formData, department: e.target.value})}
          placeholder="Engineering"
          disabled={isSubmitting}
        />
        
        <Input
          label="Position"
          value={formData.position}
          onChange={(e: { target: { value: any } }) => setFormData({...formData, position: e.target.value})}
          placeholder="Software Engineer"
          disabled={isSubmitting}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          className="rounded border-input"
          disabled={isSubmitting}
        />
        <label htmlFor="isActive" className="text-sm font-medium">
          Active Account
        </label>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Change Password</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordFields(!showPasswordFields)}
          >
            {showPasswordFields ? "Cancel" : "Change Password"}
          </Button>
        </div>
        
        {showPasswordFields && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="New Password"
              type="password"
              value={formData.password}
              onChange={(e: { target: { value: any } }) => setFormData({...formData, password: e.target.value})}
              placeholder="Leave blank to keep current"
              disabled={isSubmitting}
            />
            
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e: { target: { value: any } }) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Leave blank to keep current"
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update User"}
        </Button>
      </div>
    </form>
  )
}