export interface AttendanceCreateData {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'earned' | 'casual' | 'sick' | 'unpaid';
  remarks?: string;
}

export interface AttendanceBulkCreateData {
  employeeId: string;
  attendances: Array<{
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
    leaveType?: 'earned' | 'casual' | 'sick' | 'unpaid';
    remarks?: string;
  }>;
}

export interface AttendanceUpdateData {
  checkIn?: Date;
  checkOut?: Date;
  status?: 'present' | 'absent' | 'half-day' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'earned' | 'casual' | 'sick' | 'unpaid';
  remarks?: string;
  isApproved?: boolean;
}

export interface AttendanceResponse {
  id: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
  };
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked: number;
  overtimeHours: number;
  status: string;
  leaveType?: string;
  remarks?: string;
  isApproved: boolean;
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  department: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  regularHours: number;
}

export interface AttendanceStats {
  month: number;
  year: number;
  totalEmployees: number;
  averageAttendance: string;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  totalOvertimeHours: number;
}

export interface AttendanceSummaryResponse {
  month: number;
  year: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: AttendanceSummary[];
  overallStats: AttendanceStats;
  departmentFilter: string;
}