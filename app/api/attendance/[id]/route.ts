import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';
import { AttendanceUpdateData } from '@/types/attendance';

// GET /api/attendance/[id] - Get single attendance record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const attendanceId = params.id;

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId)
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

    if (!attendance) {
      return NextResponse.json(
        ApiResponse.error('Attendance record not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== attendance.employee._id.toString()) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      ApiResponse.success('Attendance record retrieved successfully', {
        attendance: {
          id: attendance._id.toString(),
          employee: {
            id: attendance.employee._id.toString(),
            employeeId: attendance.employee.employeeId,
            name: attendance.employee.user.name,
            department: attendance.employee.user.department,
          },
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked,
          overtimeHours: attendance.overtimeHours,
          status: attendance.status,
          leaveType: attendance.leaveType,
          remarks: attendance.remarks,
          isApproved: attendance.isApproved,
          approvedBy: attendance.approvedBy ? {
            id: attendance.approvedBy._id.toString(),
            name: attendance.approvedBy.name,
          } : undefined,
          approvedAt: attendance.approvedAt,
          createdAt: attendance.createdAt,
          updatedAt: attendance.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Get attendance record error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve attendance record', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/attendance/[id] - Update attendance record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const attendanceId = params.id;
    const data: AttendanceUpdateData = await request.json();

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return NextResponse.json(
        ApiResponse.error('Attendance record not found'),
        { status: 404 }
      );
    }

    // Check permissions
    const userEmployee = await Employee.findOne({ user: user._id });
    const isOwner = userEmployee && userEmployee._id.toString() === attendance.employee.toString();
    
    // Only allow:
    // - Employees to update their own unapproved records
    // - Admin/HR to update any record
    if (user.role === 'employee') {
      if (!isOwner) {
        return NextResponse.json(
          ApiResponse.error('You can only update your own attendance'),
          { status: 403 }
        );
      }
      if (attendance.isApproved) {
        return NextResponse.json(
          ApiResponse.error('Cannot update approved attendance'),
          { status: 403 }
        );
      }
    }

    // Track changes for audit log
    const oldData = {
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      status: attendance.status,
      leaveType: attendance.leaveType,
      remarks: attendance.remarks,
      isApproved: attendance.isApproved,
    };

    // Update fields if provided
    if (data.checkIn !== undefined) attendance.checkIn = data.checkIn;
    if (data.checkOut !== undefined) attendance.checkOut = data.checkOut;
    if (data.status !== undefined) attendance.status = data.status;
    if (data.leaveType !== undefined) attendance.leaveType = data.leaveType;
    if (data.remarks !== undefined) attendance.remarks = data.remarks;
    
    // Only admin/hr can approve/reject
    if (data.isApproved !== undefined && user.role !== 'employee') {
      attendance.isApproved = data.isApproved;
      attendance.approvedBy = user._id;
      attendance.approvedAt = new Date();
    }

    // Recalculate hours worked if check-in/check-out changed
    if ((data.checkIn !== undefined || data.checkOut !== undefined) && attendance.checkIn && attendance.checkOut) {
      const checkIn = new Date(attendance.checkIn);
      const checkOut = new Date(attendance.checkOut);
      const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
    }

    await attendance.save();

    // Get updated record with populated data
    const updatedAttendance = await Attendance.findById(attendance._id)
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
      action: 'update',
      entity: 'attendance',
      entityId: attendance._id,
      changes: {
        old: oldData,
        new: {
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          status: attendance.status,
          leaveType: attendance.leaveType,
          remarks: attendance.remarks,
          isApproved: attendance.isApproved,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Attendance record updated successfully', {
        attendance: {
          id: updatedAttendance._id.toString(),
          employee: {
            id: updatedAttendance.employee._id.toString(),
            employeeId: updatedAttendance.employee.employeeId,
            name: updatedAttendance.employee.user.name,
            department: updatedAttendance.employee.user.department,
          },
          date: updatedAttendance.date,
          checkIn: updatedAttendance.checkIn,
          checkOut: updatedAttendance.checkOut,
          hoursWorked: updatedAttendance.hoursWorked,
          overtimeHours: updatedAttendance.overtimeHours,
          status: updatedAttendance.status,
          leaveType: updatedAttendance.leaveType,
          remarks: updatedAttendance.remarks,
          isApproved: updatedAttendance.isApproved,
          approvedBy: updatedAttendance.approvedBy ? {
            id: updatedAttendance.approvedBy._id.toString(),
            name: updatedAttendance.approvedBy.name,
          } : undefined,
          approvedAt: updatedAttendance.approvedAt,
          createdAt: updatedAttendance.createdAt,
          updatedAt: updatedAttendance.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Update attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update attendance record', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/attendance/[id] - Delete attendance record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admin/hr can delete attendance records
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const attendanceId = params.id;

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return NextResponse.json(
        ApiResponse.error('Attendance record not found'),
        { status: 404 }
      );
    }

    // Check if attendance is approved
    if (attendance.isApproved) {
      return NextResponse.json(
        ApiResponse.error('Cannot delete approved attendance record'),
        { status: 403 }
      );
    }

    // Delete the record
    await Attendance.findByIdAndDelete(attendanceId);

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'delete',
      entity: 'attendance',
      entityId: attendance._id,
      changes: { deleted: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Attendance record deleted successfully')
    );
  } catch (error: any) {
    console.error('Delete attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to delete attendance record', error.message),
      { status: 500 }
    );
  }
}