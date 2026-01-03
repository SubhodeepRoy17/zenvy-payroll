import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { PayrollResponse, PayrollSummary } from '@/types/payroll';

// GET /api/payroll - List payroll records with filters
export async function GET(request: NextRequest) {
  try {
    // Only admin/hr can view payroll
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const department = searchParams.get('department');
    const sortBy = searchParams.get('sortBy') || 'year-month';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};

    // Date filters
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Employee filter
    if (employeeId) {
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    // Department filter
    if (department) {
      const employeesInDept = await Employee.find({ department }).select('_id');
      const employeeIds = employeesInDept.map(emp => emp._id);
      query.employee = { $in: employeeIds };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Payroll.countDocuments(query);

    // Determine sort field
    let sortField: string | { [key: string]: 1 | -1 } = sortBy;
    if (sortBy === 'year-month') {
      sortField = { year: sortOrder === 'asc' ? 1 : -1, month: sortOrder === 'asc' ? 1 : -1 };
    }

    // Get payroll records with populated data
    const payrollRecords = await Payroll.find(query)
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
      })
      .skip(skip)
      .limit(limit)
      .sort(sortField);

    // Format response
    const formattedPayrolls: PayrollResponse[] = payrollRecords.map(payroll => ({
      id: payroll._id.toString(),
      employee: {
        id: payroll.employee._id.toString(),
        employeeId: payroll.employee.employeeId,
        name: payroll.employee.user.name,
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
      } : undefined,
      approvedAt: payroll.approvedAt,
      isLocked: payroll.isLocked,
      createdAt: payroll.createdAt,
      updatedAt: payroll.updatedAt,
    }));

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'payroll',
      changes: { query, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll records retrieved successfully', {
        payrolls: formattedPayrolls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve payroll records', error.message),
      { status: 500 }
    );
  }
}

// POST /api/payroll - Create payroll record (manual)
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can create payroll
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    if (!data.employeeId || !data.month || !data.year) {
      return NextResponse.json(
        ApiResponse.error('Employee ID, month, and year are required'),
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

    // Check if payroll already exists for this month/year
    const existingPayroll = await Payroll.findOne({
      employee: employee._id,
      month: data.month,
      year: data.year,
    });

    if (existingPayroll) {
      return NextResponse.json(
        ApiResponse.error('Payroll already exists for this employee and period'),
        { status: 409 }
      );
    }

    // Import payroll calculator
    const { PayrollCalculator } = await import('@/lib/payroll-calculator');

    // Calculate payroll
    const payrollData = await PayrollCalculator.calculateMonthlyPayroll(
      employee._id.toString(),
      data.month,
      data.year
    );

    // Create payroll record
    const payroll = await Payroll.create({
      employee: employee._id,
      month: data.month,
      year: data.year,
      periodFrom: new Date(data.year, data.month - 1, 1),
      periodTo: new Date(data.year, data.month, 0),
      totalWorkingDays: payrollData.totalWorkingDays,
      presentDays: payrollData.presentDays,
      absentDays: payrollData.absentDays,
      leaveDays: payrollData.leaveDays,
      basicSalary: payrollData.basicSalary,
      earnings: payrollData.earnings,
      deductions: payrollData.deductions,
      grossEarnings: payrollData.grossEarnings,
      totalDeductions: payrollData.totalDeductions,
      netSalary: payrollData.netSalary,
      taxDeducted: payrollData.taxDeducted,
      pfContribution: payrollData.pfContribution,
      esiContribution: payrollData.esiContribution,
      status: 'calculated',
    });

    // Get populated payroll
    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate({
        path: 'employee',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email department designation',
        },
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'payroll',
      entityId: payroll._id,
      changes: data,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll calculated and created successfully', {
        payroll: {
          id: populatedPayroll._id.toString(),
          employee: {
            id: populatedPayroll.employee._id.toString(),
            employeeId: populatedPayroll.employee.employeeId,
            name: populatedPayroll.employee.user.name,
            department: populatedPayroll.employee.user.department,
            designation: populatedPayroll.employee.user.designation,
          },
          month: populatedPayroll.month,
          year: populatedPayroll.year,
          periodFrom: populatedPayroll.periodFrom,
          periodTo: populatedPayroll.periodTo,
          basicSalary: populatedPayroll.basicSalary,
          grossEarnings: populatedPayroll.grossEarnings,
          totalDeductions: populatedPayroll.totalDeductions,
          netSalary: populatedPayroll.netSalary,
          status: populatedPayroll.status,
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to create payroll', error.message),
      { status: 500 }
    );
  }
}