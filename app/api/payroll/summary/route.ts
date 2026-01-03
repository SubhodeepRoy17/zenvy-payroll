import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Company from '@/models/Company';
import { PayrollSummary } from '@/types/payroll';

// GET /api/payroll/summary - Get payroll summary
export async function GET(request: NextRequest) {
  try {
    // Only admin/hr can view payroll summary
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const companyId = searchParams.get('companyId');

    // Find company
    let company;
    if (companyId) {
      company = await Company.findById(companyId);
    } else {
      // Get first active company
      company = await Company.findOne({ isActive: true });
    }

    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Get payroll records for the month
    const payrolls = await Payroll.find({
      month,
      year,
      status: { $in: ['calculated', 'approved', 'paid'] },
    })
      .populate({
        path: 'employee',
        match: { company: company._id },
      });

    // Filter out payrolls for employees not in the company
    const filteredPayrolls = payrolls.filter(p => p.employee);

    // Calculate summary
    const summary: PayrollSummary = {
      month,
      year,
      totalEmployees: filteredPayrolls.length,
      totalNetSalary: 0,
      totalGrossEarnings: 0,
      totalDeductions: 0,
      totalTax: 0,
      totalPF: 0,
      totalESI: 0,
      statusBreakdown: {
        draft: 0,
        calculated: 0,
        approved: 0,
        paid: 0,
        cancelled: 0,
      },
    };

    filteredPayrolls.forEach(payroll => {
      summary.totalNetSalary += payroll.netSalary;
      summary.totalGrossEarnings += payroll.grossEarnings;
      summary.totalDeductions += payroll.totalDeductions;
      summary.totalTax += payroll.taxDeducted;
      summary.totalPF += payroll.pfContribution;
      summary.totalESI += payroll.esiContribution;
      
      if (summary.statusBreakdown.hasOwnProperty(payroll.status)) {
        summary.statusBreakdown[payroll.status as keyof typeof summary.statusBreakdown]++;
      }
    });

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: company.currency || 'INR',
        minimumFractionDigits: 2,
      }).format(amount);
    };

    return NextResponse.json(
      ApiResponse.success('Payroll summary retrieved successfully', {
        summary: {
          ...summary,
          formatted: {
            totalNetSalary: formatCurrency(summary.totalNetSalary),
            totalGrossEarnings: formatCurrency(summary.totalGrossEarnings),
            totalDeductions: formatCurrency(summary.totalDeductions),
            totalTax: formatCurrency(summary.totalTax),
            totalPF: formatCurrency(summary.totalPF),
            totalESI: formatCurrency(summary.totalESI),
          },
        },
        company: {
          id: company._id.toString(),
          name: company.name,
          currency: company.currency,
          currencySymbol: company.settings.currencySymbol,
        },
        period: {
          month,
          year,
          monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
        },
      })
    );
  } catch (error: any) {
    console.error('Get payroll summary error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve payroll summary', error.message),
      { status: 500 }
    );
  }
}