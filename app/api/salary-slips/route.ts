import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { PDFGenerator } from '@/lib/pdf-generator';

// GET /api/salary-slips - List salary slips
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const sortBy = searchParams.get('sortBy') || 'year-month';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};

    // For employees, they can only see their own salary slips
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ user: user._id });
      if (!employee) {
        return NextResponse.json(
          ApiResponse.error('Employee record not found'),
          { status: 404 }
        );
      }
      query.employee = employee._id;
      query.status = { $in: ['approved', 'paid'] }; // Employees can only see approved/paid slips
    } else if (employeeId) {
      // For admin/hr, they can filter by employee
      const employee = await Employee.findOne({ employeeId });
      if (employee) {
        query.employee = employee._id;
      }
    }

    // Date filters
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Payroll.countDocuments(query);

    // Determine sort field
    let sortField: string | { [key: string]: 1 | -1 } = sortBy;
    if (sortBy === 'year-month') {
      sortField = { year: sortOrder === 'asc' ? 1 : -1, month: sortOrder === 'asc' ? 1 : -1 };
    }

    // Get payroll records (salary slips) with populated data
    const salarySlips = await Payroll.find(query)
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
    const formattedSlips = salarySlips.map(slip => ({
      id: slip._id.toString(),
      employee: {
        id: slip.employee._id.toString(),
        employeeId: slip.employee.employeeId,
        name: slip.employee.user.name,
        department: slip.employee.user.department || slip.employee.department,
        designation: slip.employee.user.designation || slip.employee.designation,
      },
      month: slip.month,
      year: slip.year,
      periodFrom: slip.periodFrom,
      periodTo: slip.periodTo,
      basicSalary: slip.basicSalary,
      grossEarnings: slip.grossEarnings,
      totalDeductions: slip.totalDeductions,
      netSalary: slip.netSalary,
      status: slip.status,
      paymentDate: slip.paymentDate,
      paymentMethod: slip.paymentMethod,
      approvedBy: slip.approvedBy ? {
        id: slip.approvedBy._id.toString(),
        name: slip.approvedBy.name,
      } : undefined,
      approvedAt: slip.approvedAt,
      isLocked: slip.isLocked,
      createdAt: slip.createdAt,
      updatedAt: slip.updatedAt,
    }));

    // Create audit log for admin/hr
    if (user.role !== 'employee') {
      await AuditLog.create({
        user: user._id,
        action: 'read',
        entity: 'salary-slip',
        changes: { query, page, limit },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json(
      ApiResponse.success('Salary slips retrieved successfully', {
        salarySlips: formattedSlips,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get salary slips error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve salary slips', error.message),
      { status: 500 }
    );
  }
}

// POST /api/salary-slips/generate - Generate salary slips for period
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can generate salary slips
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    if (!data.month || !data.year) {
      return NextResponse.json(
        ApiResponse.error('Month and year are required'),
        { status: 400 }
      );
    }

    // Get company
    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('No active company found'),
        { status: 404 }
      );
    }

    // Find payroll records for the period
    const query: any = {
      month: data.month,
      year: data.year,
      company: company._id,
      status: { $in: ['calculated', 'approved', 'paid'] },
    };

    if (data.employeeIds && data.employeeIds.length > 0) {
      const employees = await Employee.find({ employeeId: { $in: data.employeeIds } });
      const employeeIds = employees.map(emp => emp._id);
      query.employee = { $in: employeeIds };
    }

    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        populate: {
          path: 'user',
          select: 'name',
        },
      });

    if (payrolls.length === 0) {
      return NextResponse.json(
        ApiResponse.error('No payroll records found for the specified period'),
        { status: 404 }
      );
    }

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'salary-slip',
      changes: {
        month: data.month,
        year: data.year,
        employeeCount: payrolls.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary slips ready for download', {
        summary: {
          month: data.month,
          year: data.year,
          totalEmployees: payrolls.length,
          totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
        },
        salarySlips: payrolls.map(p => ({
          id: p._id.toString(),
          employeeId: p.employee.employeeId,
          employeeName: p.employee.user.name,
          netSalary: p.netSalary,
          status: p.status,
        })),
      })
    );
  } catch (error: any) {
    console.error('Generate salary slips error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to generate salary slips', error.message),
      { status: 500 }
    );
  }
}