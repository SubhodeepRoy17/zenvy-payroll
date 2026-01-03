import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';

// GET /api/payroll/[id] - Get payroll by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;

    // Find payroll
    const payroll = await Payroll.findById(id)
      .populate({
        path: 'employee',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email department designation',
        },
      })
      .populate({
        path: 'approvedBy',
        select: 'name email',
      });

    if (!payroll) {
      return NextResponse.json(
        ApiResponse.error('Payroll not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== payroll.employee._id.toString()) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      ApiResponse.success('Payroll retrieved successfully', {
        payroll: {
          id: payroll._id.toString(),
          employee: {
            id: payroll.employee._id.toString(),
            employeeId: payroll.employee.employeeId,
            name: payroll.employee.user.name,
            email: payroll.employee.user.email,
            department: payroll.employee.user.department || payroll.employee.department,
            designation: payroll.employee.user.designation || payroll.employee.designation,
          },
          month: payroll.month,
          year: payroll.year,
          periodFrom: payroll.periodFrom,
          periodTo: payroll.periodTo,
          totalWorkingDays: payroll.totalWorkingDays,
          presentDays: payroll.presentDays,
          absentDays: payroll.absentDays,
          leaveDays: payroll.leaveDays,
          basicSalary: payroll.basicSalary,
          earnings: payroll.earnings,
          deductions: payroll.deductions,
          grossEarnings: payroll.grossEarnings,
          totalDeductions: payroll.totalDeductions,
          netSalary: payroll.netSalary,
          taxDeducted: payroll.taxDeducted,
          pfContribution: payroll.pfContribution,
          esiContribution: payroll.esiContribution,
          status: payroll.status,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod,
          transactionId: payroll.transactionId,
          remarks: payroll.remarks,
          approvedBy: payroll.approvedBy ? {
            id: payroll.approvedBy._id.toString(),
            name: payroll.approvedBy.name,
            email: payroll.approvedBy.email,
          } : undefined,
          approvedAt: payroll.approvedAt,
          isLocked: payroll.isLocked,
          createdAt: payroll.createdAt,
          updatedAt: payroll.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Get payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve payroll', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/payroll/[id] - Update payroll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only admin/hr can update payroll
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;
    const data = await request.json();

    // Find payroll
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return NextResponse.json(
        ApiResponse.error('Payroll not found'),
        { status: 404 }
      );
    }

    // Check if payroll is locked
    if (payroll.isLocked) {
      return NextResponse.json(
        ApiResponse.error('Payroll is locked and cannot be modified'),
        { status: 403 }
      );
    }

    // Track changes for audit log
    const oldData = {
      status: payroll.status,
      paymentDate: payroll.paymentDate,
      paymentMethod: payroll.paymentMethod,
      transactionId: payroll.transactionId,
      remarks: payroll.remarks,
      isLocked: payroll.isLocked,
    };

    // Update fields
    const updates: any = {};
    if (data.status !== undefined) updates.status = data.status;
    if (data.paymentDate !== undefined) updates.paymentDate = data.paymentDate;
    if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
    if (data.transactionId !== undefined) updates.transactionId = data.transactionId;
    if (data.remarks !== undefined) updates.remarks = data.remarks;
    if (data.isLocked !== undefined) updates.isLocked = data.isLocked;

    // Apply updates
    Object.assign(payroll, updates);
    await payroll.save();

    // Get updated payroll with populated data
    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: 'employee',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email',
        },
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'update',
      entity: 'payroll',
      entityId: payroll._id,
      changes: {
        old: oldData,
        new: {
          status: payroll.status,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod,
          transactionId: payroll.transactionId,
          remarks: payroll.remarks,
          isLocked: payroll.isLocked,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll updated successfully', {
        payroll: {
          id: updatedPayroll._id.toString(),
          employee: {
            id: updatedPayroll.employee._id.toString(),
            employeeId: updatedPayroll.employee.employeeId,
            name: updatedPayroll.employee.user.name,
          },
          month: updatedPayroll.month,
          year: updatedPayroll.year,
          netSalary: updatedPayroll.netSalary,
          status: updatedPayroll.status,
          paymentDate: updatedPayroll.paymentDate,
          paymentMethod: updatedPayroll.paymentMethod,
          transactionId: updatedPayroll.transactionId,
          isLocked: updatedPayroll.isLocked,
        },
      })
    );
  } catch (error: any) {
    console.error('Update payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update payroll', error.message),
      { status: 500 }
    );
  }
}