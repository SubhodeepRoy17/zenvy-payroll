import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { AttendanceCreateData, AttendanceBulkCreateData, AttendanceResponse } from '@/types/attendance';

// GET /api/attendance - Get attendance records with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const isApproved = searchParams.get('isApproved');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};

    // For employees, they can only see their own attendance
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ user: user._id });
      if (!employee) {
        return NextResponse.json(
          ApiResponse.error('Employee record not found'),
          { status: 404 }
        );
      }
      query.employee = employee._id;
    } else if (employeeId) {
      // For admin/hr, they can filter by employee
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Other filters
    if (status) query.status = status;
    if (isApproved !== null) query.isApproved = isApproved === 'true';

    // Department filter (for admin/hr)
    if (department && user.role !== 'employee') {
      const employeesInDept = await Employee.find({ department }).select('_id');
      const employeeIds = employeesInDept.map(emp => emp._id);
      query.employee = { $in: employeeIds };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Attendance.countDocuments(query);

    // Get attendance records with populated data
    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'employee',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email department',
        },
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Format response
    const formattedAttendance: AttendanceResponse[] = attendanceRecords.map(record => ({
      id: record._id.toString(),
      employee: {
        id: record.employee._id.toString(),
        employeeId: record.employee.employeeId,
        name: record.employee.user.name,
        department: record.employee.user.department,
      },
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      hoursWorked: record.hoursWorked,
      overtimeHours: record.overtimeHours,
      status: record.status,
      leaveType: record.leaveType,
      remarks: record.remarks,
      isApproved: record.isApproved,
      approvedBy: record.approvedBy ? {
        id: record.approvedBy._id.toString(),
        name: record.approvedBy.name,
      } : undefined,
      approvedAt: record.approvedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    // Create audit log for admin/hr
    if (user.role !== 'employee') {
      await AuditLog.create({
        user: user._id,
        action: 'read',
        entity: 'attendance',
        changes: { query, page, limit },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json(
      ApiResponse.success('Attendance records retrieved successfully', {
        attendance: formattedAttendance,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve attendance records', error.message),
      { status: 500 }
    );
  }
}

// POST /api/attendance - Create attendance record
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data: AttendanceCreateData = await request.json();

    // Validate required fields
    if (!data.employeeId || !data.date || !data.status) {
      return NextResponse.json(
        ApiResponse.error('Employee ID, date, and status are required'),
        { status: 400 }
      );
    }

    // Find employee
    const employee = await Employee.findOne({ employeeId: data.employeeId });
    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    // Check permissions:
    // - Employees can only mark their own attendance
    // - Admin/HR can mark attendance for any employee
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== employee._id.toString()) {
        return NextResponse.json(
          ApiResponse.error('You can only mark your own attendance'),
          { status: 403 }
        );
      }
    }

    // Validate date (cannot mark attendance for future dates)
    const attendanceDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (attendanceDate > today) {
      return NextResponse.json(
        ApiResponse.error('Cannot mark attendance for future dates'),
        { status: 400 }
      );
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        ApiResponse.error('Attendance already marked for this date'),
        { status: 409 }
      );
    }

    // Validate check-in/check-out times
    if (data.checkIn && data.checkOut) {
      const checkInTime = new Date(data.checkIn);
      const checkOutTime = new Date(data.checkOut);
      
      if (checkOutTime <= checkInTime) {
        return NextResponse.json(
          ApiResponse.error('Check-out time must be after check-in time'),
          { status: 400 }
        );
      }
    }

    // Validate leave type if status is leave
    if (data.status === 'leave' && !data.leaveType) {
      return NextResponse.json(
        ApiResponse.error('Leave type is required when status is "leave"'),
        { status: 400 }
      );
    }

    // Auto-approve for admin/hr, require approval for employees
    const isAutoApproved = user.role !== 'employee';

    // Create attendance record
    const attendance = await Attendance.create({
      employee: employee._id,
      date: data.date,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      status: data.status,
      leaveType: data.leaveType,
      remarks: data.remarks,
      isApproved: isAutoApproved,
      approvedBy: isAutoApproved ? user._id : undefined,
      approvedAt: isAutoApproved ? new Date() : undefined,
    });

    // Calculate hours worked
    if (data.checkIn && data.checkOut) {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
      await attendance.save();
    }

    // Populate for response
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'employee',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email department',
        },
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'attendance',
      entityId: attendance._id,
      changes: data,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success(
        `Attendance marked successfully${isAutoApproved ? ' and approved' : ' (pending approval)'}`,
        {
          attendance: {
            id: populatedAttendance._id.toString(),
            employee: {
              id: populatedAttendance.employee._id.toString(),
              employeeId: populatedAttendance.employee.employeeId,
              name: populatedAttendance.employee.user.name,
              department: populatedAttendance.employee.user.department,
            },
            date: populatedAttendance.date,
            checkIn: populatedAttendance.checkIn,
            checkOut: populatedAttendance.checkOut,
            hoursWorked: populatedAttendance.hoursWorked,
            overtimeHours: populatedAttendance.overtimeHours,
            status: populatedAttendance.status,
            leaveType: populatedAttendance.leaveType,
            remarks: populatedAttendance.remarks,
            isApproved: populatedAttendance.isApproved,
            approvedBy: populatedAttendance.approvedBy ? {
              id: populatedAttendance.approvedBy._id.toString(),
              name: populatedAttendance.approvedBy.name,
            } : undefined,
            approvedAt: populatedAttendance.approvedAt,
            createdAt: populatedAttendance.createdAt,
            updatedAt: populatedAttendance.updatedAt,
          },
        }
      ),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to mark attendance', error.message),
      { status: 500 }
    );
  }
}