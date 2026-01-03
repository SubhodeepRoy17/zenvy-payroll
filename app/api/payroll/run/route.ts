import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Company from '@/models/Company';
import Employee from '@/models/Employee';
import Payroll from '@/models/Payroll';
import AuditLog from '@/models/AuditLog';
import { PayrollRunData } from '@/types/payroll';

// POST /api/payroll/run - Run payroll for all/multiple employees
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can run payroll
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data: PayrollRunData = await request.json();

    // Validate required fields
    if (!data.month || !data.year || !data.periodFrom || !data.periodTo) {
      return NextResponse.json(
        ApiResponse.error('Month, year, periodFrom, and periodTo are required'),
        { status: 400 }
      );
    }

    // Validate month/year
    if (data.month < 1 || data.month > 12) {
      return NextResponse.json(
        ApiResponse.error('Month must be between 1 and 12'),
        { status: 400 }
      );
    }

    if (data.year < 2000 || data.year > 2100) {
      return NextResponse.json(
        ApiResponse.error('Year must be between 2000 and 2100'),
        { status: 400 }
      );
    }

    // Check if period is valid
    const periodFrom = new Date(data.periodFrom);
    const periodTo = new Date(data.periodTo);
    
    if (periodFrom >= periodTo) {
      return NextResponse.json(
        ApiResponse.error('periodFrom must be before periodTo'),
        { status: 400 }
      );
    }

    // Check if payroll already run for this period
    const existingPayrollCount = await Payroll.countDocuments({
      month: data.month,
      year: data.year,
    });

    if (existingPayrollCount > 0 && data.employeeIds?.length === 0) {
      // If running for all employees and some already have payroll
      return NextResponse.json(
        ApiResponse.error('Payroll already run for some employees in this period. Use force flag to recalculate.'),
        { status: 409 }
      );
    }

    // Get company (assuming single company for now)
    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('No active company found'),
        { status: 404 }
      );
    }

    // Get employees to process
    let employees;
    if (data.employeeIds && data.employeeIds.length > 0) {
      // Process specific employees
      employees = await Employee.find({
        employeeId: { $in: data.employeeIds },
        isActive: true,
      }).populate('user', 'name');
    } else {
      // Process all active employees
      employees = await Employee.find({
        company: company._id,
        isActive: true,
      }).populate('user', 'name');
    }

    if (employees.length === 0) {
      return NextResponse.json(
        ApiResponse.error('No active employees found to process'),
        { status: 404 }
      );
    }

    // Import payroll calculator
    const { PayrollCalculator } = await import('@/lib/payroll-calculator');

    const results = [];
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each employee
    for (const employee of employees) {
      try {
        // Check if payroll already exists for this employee and period
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          month: data.month,
          year: data.year,
        });

        if (existingPayroll && existingPayroll.isLocked) {
          results.push({
            employeeId: employee.employeeId,
            employeeName: employee.user.name,
            status: 'skipped',
            reason: 'Payroll is locked',
          });
          skippedCount++;
          continue;
        }

        if (existingPayroll && !data.force) {
          results.push({
            employeeId: employee.employeeId,
            employeeName: employee.user.name,
            status: 'skipped',
            reason: 'Payroll already exists (use force flag to recalculate)',
          });
          skippedCount++;
          continue;
        }

        // Calculate payroll
        const payrollData = await PayrollCalculator.calculatePayroll(
          employee._id.toString(),
          data.month,
          data.year,
          periodFrom,
          periodTo
        );

        // Create or update payroll record
        const payrollDataToSave = {
          employee: employee._id,
          month: data.month,
          year: data.year,
          periodFrom,
          periodTo,
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
        };

        if (existingPayroll) {
          // Update existing payroll
          Object.assign(existingPayroll, payrollDataToSave);
          await existingPayroll.save();
        } else {
          // Create new payroll
          await Payroll.create(payrollDataToSave);
        }

        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.user.name,
          status: 'success',
          netSalary: payrollData.netSalary,
        });
        successCount++;
      } catch (error: any) {
        results.push({
          employeeId: employee.employeeId,
          employeeName: employee.user.name,
          status: 'failed',
          error: error.message,
        });
        failedCount++;
      }
    }

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'calculate',
      entity: 'payroll',
      changes: {
        month: data.month,
        year: data.year,
        periodFrom: data.periodFrom,
        periodTo: data.periodTo,
        totalEmployees: employees.length,
        results: { successCount, failedCount, skippedCount },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll run completed', {
        summary: {
          total: employees.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        period: {
          month: data.month,
          year: data.year,
          from: periodFrom,
          to: periodTo,
        },
        results,
      })
    );
  } catch (error: any) {
    console.error('Run payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to run payroll', error.message),
      { status: 500 }
    );
  }
}