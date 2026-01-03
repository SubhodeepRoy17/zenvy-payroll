import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/middleware/auth';
import Employee from '@/models/Employee';
import Attendance from '@/models/Attendance';
import Payroll from '@/models/Payroll';

// GET /api/employees/dashboard - Get employee dashboard data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Find employee for the authenticated user
    const employee = await Employee.findOne({ user: user._id })
      .populate({
        path: 'user',
        select: 'name email avatar',
      })
      .populate({
        path: 'company',
        select: 'name',
      })
      .populate({
        path: 'salaryStructure',
        select: 'name value',
      });

    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee record not found'),
        { status: 404 }
      );
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month attendance summary
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
    });

    const attendanceSummary = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'present').length,
      absentDays: attendanceRecords.filter(a => a.status === 'absent').length,
      leaveDays: attendanceRecords.filter(a => a.status === 'leave').length,
      halfDays: attendanceRecords.filter(a => a.status === 'half-day').length,
      overtimeHours: attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };

    // Get recent payrolls
    const recentPayrolls = await Payroll.find({
      employee: employee._id,
      status: { $in: ['approved', 'paid'] },
    })
      .sort({ year: -1, month: -1 })
      .limit(3)
      .select('month year netSalary status paymentDate');

    // Get leave balance
    const leaveBalance = {
      earnedLeaves: employee.leaves.earnedLeaves,
      casualLeaves: employee.leaves.casualLeaves,
      sickLeaves: employee.leaves.sickLeaves,
      totalLeaves: employee.leaves.earnedLeaves + employee.leaves.casualLeaves + employee.leaves.sickLeaves,
    };

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow },
    });

    return NextResponse.json(
      ApiResponse.success('Dashboard data retrieved successfully', {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          name: employee.user.name,
          email: employee.user.email,
          avatar: employee.user.avatar,
          department: employee.department,
          designation: employee.designation,
          company: employee.company.name,
          joiningDate: employee.joiningDate,
          workLocation: employee.workLocation,
        },
        attendance: {
          summary: attendanceSummary,
          today: todayAttendance ? {
            status: todayAttendance.status,
            checkIn: todayAttendance.checkIn,
            checkOut: todayAttendance.checkOut,
            hoursWorked: todayAttendance.hoursWorked,
          } : null,
        },
        payroll: {
          recent: recentPayrolls.map(p => ({
            month: p.month,
            year: p.year,
            netSalary: p.netSalary,
            status: p.status,
            paymentDate: p.paymentDate,
          })),
          salaryStructure: {
            name: employee.salaryStructure.name,
            value: employee.salaryStructure.value,
          },
        },
        leaves: leaveBalance,
        stats: {
          totalMonths: Math.floor((currentDate.getTime() - employee.joiningDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
        },
      })
    );
  } catch (error: any) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve dashboard data', error.message),
      { status: 500 }
    );
  }
}