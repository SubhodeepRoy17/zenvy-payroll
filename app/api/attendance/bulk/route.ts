import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';
import { AttendanceBulkCreateData } from '@/types/attendance';

// POST /api/attendance/bulk - Bulk upload attendance records
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can bulk upload attendance
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data: AttendanceBulkCreateData = await request.json();

    // Validate required fields
    if (!data.employeeId || !data.attendances || !Array.isArray(data.attendances)) {
      return NextResponse.json(
        ApiResponse.error('Employee ID and attendances array are required'),
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

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const createdRecords = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each attendance record
    for (const attData of data.attendances) {
      try {
        // Validate required fields for each record
        if (!attData.date || !attData.status) {
          results.errors.push(`Missing date or status for record ${attData.date}`);
          continue;
        }

        const attendanceDate = new Date(attData.date);

        // Cannot mark attendance for future dates
        if (attendanceDate > today) {
          results.errors.push(`Cannot mark attendance for future date: ${attData.date}`);
          continue;
        }

        // Check if attendance already exists
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
          employee: employee._id,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (existingAttendance) {
          results.skipped++;
          continue;
        }

        // Validate leave type if status is leave
        if (attData.status === 'leave' && !attData.leaveType) {
          results.errors.push(`Leave type required for leave on ${attData.date}`);
          continue;
        }

        // Create attendance record (auto-approved for bulk upload by admin/hr)
        const attendance = await Attendance.create({
          employee: employee._id,
          date: attData.date,
          checkIn: attData.checkIn,
          checkOut: attData.checkOut,
          status: attData.status,
          leaveType: attData.leaveType,
          remarks: attData.remarks,
          isApproved: true,
          approvedBy: user._id,
          approvedAt: new Date(),
        });

        // Calculate hours worked
        if (attData.checkIn && attData.checkOut) {
          const checkIn = new Date(attData.checkIn);
          const checkOut = new Date(attData.checkOut);
          const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
          await attendance.save();
        }

        createdRecords.push(attendance);
        results.created++;
      } catch (error: any) {
        results.errors.push(`Error for ${attData.date}: ${error.message}`);
      }
    }

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'attendance',
      changes: {
        employeeId: data.employeeId,
        totalRecords: data.attendances.length,
        results,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Bulk attendance upload completed', {
        summary: results,
        totalProcessed: data.attendances.length,
        createdRecords: createdRecords.map(record => ({
          id: record._id.toString(),
          date: record.date,
          status: record.status,
          isApproved: record.isApproved,
        })),
      })
    );
  } catch (error: any) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to process bulk attendance', error.message),
      { status: 500 }
    );
  }
}