// ./components/Payroll/PayrollRunDialog.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/Common/Button"
import { Input } from "@/components/Common/Input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Users, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface PayrollRunDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function PayrollRunDialog({ isOpen, onClose, onSubmit }: PayrollRunDialogProps) {
  const [month, setMonth] = useState<Date>(new Date())
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [forceRecalculation, setForceRecalculation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      const data = {
        month: month.getMonth() + 1,
        year: month.getFullYear(),
        periodFrom: new Date(month.getFullYear(), month.getMonth(), 1),
        periodTo: new Date(month.getFullYear(), month.getMonth() + 1, 0),
        employeeIds: selectedEmployees,
        force: forceRecalculation
      }
      
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting payroll run:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Run New Payroll Cycle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Month Selection */}
          <div className="space-y-2">
            <Label htmlFor="month">Payroll Month</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !month && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {month ? format(month, "MMMM yyyy") : <span>Pick a month</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={month}
                  onSelect={(date) => date && setMonth(date)}
                  initialFocus
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee Selection (Simplified - would be populated from API) */}
          <div className="space-y-2">
            <Label>Employees to Process</Label>
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  All active employees will be processed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You can specify individual employees in advanced options
              </p>
            </div>
          </div>

          {/* Force Recalculation */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force"
              checked={forceRecalculation}
              onCheckedChange={(checked) => setForceRecalculation(checked as boolean)}
            />
            <Label htmlFor="force" className="text-sm font-normal leading-none">
              Force recalculation for existing payrolls
            </Label>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-yellow-800">Important Note</h4>
                <p className="text-sm text-yellow-700">
                  This will calculate payroll for all active employees. The process may take several minutes depending on the number of employees.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Run Payroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}