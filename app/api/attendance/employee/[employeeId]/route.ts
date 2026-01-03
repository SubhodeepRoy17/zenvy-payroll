import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';

// GET /api/attendance/employee/[employeeId] - Get employee's attendance
export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const employeeIdentifier = params.employeeId;

    // Find employee
    let employee;
    if (employeeIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      // If it's an ObjectId
      employee = await Employee.findById(employeeIdentifier);
    } else {
      // If it's an employee ID
      employee = await Employee.findOne({ employeeId: employeeIdentifier });
    }

    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== employee._id.toString()) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const limit = parseInt(searchParams.get('limit') || '30');

    // Calculate date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .limit(limit);

    // Calculate monthly statistics
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let halfDays = 0;
    let overtimeHours = 0;
    let regularHours = 0;

    attendanceRecords.forEach(att => {
      switch (att.status) {
        case 'present':
          presentDays++;
          regularHours += att.hoursWorked || 8;
          overtimeHours += att.overtimeHours || 0;
          break;
        case 'absent':
          absentDays++;
          break;
        case 'leave':
          leaveDays++;
          break;
        case 'half-day':
          halfDays++;
          regularHours += 4;
          break;
      }
    });

    // Format response
    const formattedAttendance = attendanceRecords.map(record => ({
      id: record._id.toString(),
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hoursWorked: record.hoursWorked,
      overtimeHours: record.overtimeHours,
      status: record.status,
      leaveType: record.leaveType,
      remarks: record.remarks,
      isApproved: record.isApproved,
      approvedAt: record.approvedAt,
    }));

    return NextResponse.json(
      ApiResponse.success('Employee attendance retrieved successfully', {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          name: employee.user?.name || 'Unknown',
          department: employee.department,
          designation: employee.designation,
        },
        period: {
          month,
          year,
          startDate,
          endDate,
        },
        statistics: {
          totalDays: attendanceRecords.length,
          presentDays,
          absentDays,
          leaveDays,
          halfDays,
          regularHours,
          overtimeHours,
          attendancePercentage: attendanceRecords.length > 0 
            ? ((presentDays + halfDays * 0.5) / attendanceRecords.length * 100).toFixed(2)
            : '0',
        },
        attendance: formattedAttendance,
      })
    );
  } catch (error: any) {
    console.error('Get employee attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve employee attendance', error.message),
      { status: 500 }
    );
  }
}