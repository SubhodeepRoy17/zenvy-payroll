import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Find employee
    const employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee record not found'),
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow },
    });

    return NextResponse.json(
      ApiResponse.success('Today\'s attendance retrieved', {
        attendance: attendance ? {
          status: attendance.status,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked,
          overtimeHours: attendance.overtimeHours,
        } : null,
        isClockedIn: attendance && attendance.checkIn && !attendance.checkOut,
      })
    );
  } catch (error: any) {
    console.error('Get today attendance error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to get today\'s attendance', error.message),
      { status: 500 }
    );
  }
}