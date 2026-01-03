import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';

// GET /api/salary-slips/[id] - Get salary slip by ID
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

    // Find payroll (salary slip)
    const salarySlip = await Payroll.findById(id)
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

    if (!salarySlip) {
      return NextResponse.json(
        ApiResponse.error('Salary slip not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== salarySlip.employee._id.toString()) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
      
      // Employees can only view approved/paid salary slips
      if (!['approved', 'paid'].includes(salarySlip.status)) {
        return NextResponse.json(
          ApiResponse.error('Salary slip not available'),
          { status: 403 }
        );
      }
    }

    // Create audit log for admin/hr
    if (user.role !== 'employee') {
      await AuditLog.create({
        user: user._id,
        action: 'read',
        entity: 'salary-slip',
        entityId: salarySlip._id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json(
      ApiResponse.success('Salary slip retrieved successfully', {
        salarySlip: {
          id: salarySlip._id.toString(),
          employee: {
            id: salarySlip.employee._id.toString(),
            employeeId: salarySlip.employee.employeeId,
            name: salarySlip.employee.user.name,
            email: salarySlip.employee.user.email,
            department: salarySlip.employee.user.department || salarySlip.employee.department,
            designation: salarySlip.employee.user.designation || salarySlip.employee.designation,
          },
          month: salarySlip.month,
          year: salarySlip.year,
          periodFrom: salarySlip.periodFrom,
          periodTo: salarySlip.periodTo,
          totalWorkingDays: salarySlip.totalWorkingDays,
          presentDays: salarySlip.presentDays,
          absentDays: salarySlip.absentDays,
          leaveDays: salarySlip.leaveDays,
          basicSalary: salarySlip.basicSalary,
          earnings: salarySlip.earnings,
          deductions: salarySlip.deductions,
          grossEarnings: salarySlip.grossEarnings,
          totalDeductions: salarySlip.totalDeductions,
          netSalary: salarySlip.netSalary,
          taxDeducted: salarySlip.taxDeducted,
          pfContribution: salarySlip.pfContribution,
          esiContribution: salarySlip.esiContribution,
          status: salarySlip.status,
          paymentDate: salarySlip.paymentDate,
          paymentMethod: salarySlip.paymentMethod,
          transactionId: salarySlip.transactionId,
          remarks: salarySlip.remarks,
          approvedBy: salarySlip.approvedBy ? {
            id: salarySlip.approvedBy._id.toString(),
            name: salarySlip.approvedBy.name,
            email: salarySlip.approvedBy.email,
          } : undefined,
          approvedAt: salarySlip.approvedAt,
          isLocked: salarySlip.isLocked,
          createdAt: salarySlip.createdAt,
          updatedAt: salarySlip.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Get salary slip error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve salary slip', error.message),
      { status: 500 }
    );
  }
}