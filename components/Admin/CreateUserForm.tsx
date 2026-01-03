"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { AdminService } from "@/services/admin-service"

interface CreateUserFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee" as "admin" | "hr" | "employee",
    department: "",
    position: "",
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields")
      return
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await AdminService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        position: formData.position,
        isActive: formData.isActive,
      })
      
      toast.success("User created successfully")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Failed to create user")
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
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Password *"
          type="password"
          value={formData.password}
          onChange={(e: { target: { value: any } }) => setFormData({...formData, password: e.target.value})}
          placeholder="••••••••"
          required
          disabled={isSubmitting}
        />
        
        <Input
          label="Confirm Password *"
          type="password"
          value={formData.confirmPassword}
          onChange={(e: { target: { value: any } }) => setFormData({...formData, confirmPassword: e.target.value})}
          placeholder="••••••••"
          required
          disabled={isSubmitting}
        />
      </div>
      
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
          {isSubmitting ? "Creating..." : "Create User"}
        </Button>
      </div>
    </form>
  )
}