import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import { AttendanceSummary } from '@/types/attendance';

// GET /api/attendance/summary - Get attendance summary
export async function GET(request: NextRequest) {
  try {
    // Only admin/hr can view attendance summary
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const department = searchParams.get('department');

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Build query for attendance records
    const attendanceQuery: any = {
      date: { $gte: startDate, $lte: endDate },
      isApproved: true,
    };

    // Filter by department if specified
    let employeeQuery: any = { isActive: true };
    if (department) {
      employeeQuery.department = department;
    }

    // Get all active employees
    const employees = await Employee.find(employeeQuery)
      .populate({
        path: 'user',
        select: 'name email department',
      });

    const summary: AttendanceSummary[] = [];

    // Calculate summary for each employee
    for (const employee of employees) {
      const employeeAttendance = await Attendance.find({
        ...attendanceQuery,
        employee: employee._id,
      });

      // Calculate attendance statistics
      let presentDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let overtimeHours = 0;
      let regularHours = 0;

      employeeAttendance.forEach(att => {
        switch (att.status) {
          case 'present':
            presentDays++;
            regularHours += att.hoursWorked || 8; // Default 8 hours if not specified
            overtimeHours += att.overtimeHours || 0;
            break;
          case 'absent':
            absentDays++;
            break;
          case 'leave':
            leaveDays++;
            break;
          case 'half-day':
            presentDays += 0.5;
            leaveDays += 0.5;
            regularHours += 4; // Half day = 4 hours
            break;
        }
      });

      summary.push({
        employeeId: employee.employeeId,
        employeeName: employee.user.name,
        department: employee.user.department || employee.department,
        totalDays: employeeAttendance.length,
        presentDays,
        absentDays,
        leaveDays,
        overtimeHours,
        regularHours,
      });
    }

    // Calculate overall statistics
    const overallStats = {
      totalEmployees: summary.length,
      averageAttendance: summary.length > 0 
        ? (summary.reduce((sum, emp) => sum + emp.presentDays, 0) / summary.length).toFixed(2)
        : 0,
      totalPresentDays: summary.reduce((sum, emp) => sum + emp.presentDays, 0),
      totalAbsentDays: summary.reduce((sum, emp) => sum + emp.absentDays, 0),
      totalLeaveDays: summary.reduce((sum, emp) => sum + emp.leaveDays, 0),
      totalOvertimeHours: summary.reduce((sum, emp) => sum + emp.overtimeHours, 0),
    };

    return NextResponse.json(
      ApiResponse.success('Attendance summary retrieved successfully', {
        month,
        year,
        period: {
          startDate,
          endDate,
        },
        summary,
        overallStats,
        departmentFilter: department || 'All Departments',
      })
    );
  } catch (error: any) {
    console.error('Get attendance summary error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve attendance summary', error.message),
      { status: 500 }
    );
  }
}