import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/middleware/auth';
import Attendance from '@/models/Attendance';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';

export async function POST(request: NextRequest) {
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

    const { action } = await request.json(); // 'clock-in' or 'clock-out'
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance record
    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow },
    });

    if (action === 'clock-in') {
      if (attendance && attendance.checkIn) {
        return NextResponse.json(
          ApiResponse.error('Already clocked in today'),
          { status: 400 }
        );
      }

      if (!attendance) {
        attendance = await Attendance.create({
          employee: employee._id,
          date: new Date(),
          status: 'present',
          checkIn: new Date(),
        });
      } else {
        attendance.checkIn = new Date();
        attendance.status = 'present';
        await attendance.save();
      }

      // Create audit log
      await AuditLog.create({
        user: user._id,
        action: 'clock-in',
        entity: 'attendance',
        entityId: attendance._id,
        changes: { checkIn: attendance.checkIn },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        ApiResponse.success('Clocked in successfully', {
          checkIn: attendance.checkIn,
          status: attendance.status,
        })
      );
    } else if (action === 'clock-out') {
      if (!attendance || !attendance.checkIn) {
        return NextResponse.json(
          ApiResponse.error('Not clocked in yet'),
          { status: 400 }
        );
      }

      if (attendance.checkOut) {
        return NextResponse.json(
          ApiResponse.error('Already clocked out'),
          { status: 400 }
        );
      }

      attendance.checkOut = new Date();
      
      // Calculate hours worked
      const hoursWorked = (attendance.checkOut.getTime() - attendance.checkIn.getTime()) / (1000 * 60 * 60);
      attendance.hoursWorked = parseFloat(hoursWorked.toFixed(2));
      
      // Calculate overtime (if worked more than 8 hours)
      attendance.overtimeHours = Math.max(0, hoursWorked - 8);
      
      await attendance.save();

      // Create audit log
      await AuditLog.create({
        user: user._id,
        action: 'clock-out',
        entity: 'attendance',
        entityId: attendance._id,
        changes: { 
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked,
          overtimeHours: attendance.overtimeHours
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });

      return NextResponse.json(
        ApiResponse.success('Clocked out successfully', {
          checkOut: attendance.checkOut,
          hoursWorked: attendance.hoursWorked,
          overtimeHours: attendance.overtimeHours,
        })
      );
    } else {
      return NextResponse.json(
        ApiResponse.error('Invalid action'),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Clock in/out error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to process attendance', error.message),
      { status: 500 }
    );
  }
}