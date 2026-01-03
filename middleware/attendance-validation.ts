import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-response';

export function validateAttendanceCreate(data: any): NextResponse | null {
  // Required fields validation
  if (!data.employeeId || !data.date || !data.status) {
    return NextResponse.json(
      ApiResponse.error('Employee ID, date, and status are required'),
      { status: 400 }
    );
  }

  // Date validation
  const attendanceDate = new Date(data.date);
  if (isNaN(attendanceDate.getTime())) {
    return NextResponse.json(
      ApiResponse.error('Invalid date format'),
      { status: 400 }
    );
  }

  // Future date validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (attendanceDate > today) {
    return NextResponse.json(
      ApiResponse.error('Cannot mark attendance for future dates'),
      { status: 400 }
    );
  }

  // Status validation
  const validStatuses = ['present', 'absent', 'half-day', 'leave', 'holiday', 'weekend'];
  if (!validStatuses.includes(data.status)) {
    return NextResponse.json(
      ApiResponse.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`),
      { status: 400 }
    );
  }

  // Leave type validation
  if (data.status === 'leave' && !data.leaveType) {
    return NextResponse.json(
      ApiResponse.error('Leave type is required when status is "leave"'),
      { status: 400 }
    );
  }

  if (data.leaveType) {
    const validLeaveTypes = ['earned', 'casual', 'sick', 'unpaid'];
    if (!validLeaveTypes.includes(data.leaveType)) {
      return NextResponse.json(
        ApiResponse.error(`Invalid leave type. Must be one of: ${validLeaveTypes.join(', ')}`),
        { status: 400 }
      );
    }
  }

  // Time validation
  if (data.checkIn && data.checkOut) {
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return NextResponse.json(
        ApiResponse.error('Invalid time format'),
        { status: 400 }
      );
    }

    if (checkOut <= checkIn) {
      return NextResponse.json(
        ApiResponse.error('Check-out time must be after check-in time'),
        { status: 400 }
      );
    }
  }

  return null;
}