// app/api/payroll/runs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Aggregate payrolls by month/year
    const monthlyData = await Payroll.aggregate([
      {
        $match: {
          year: year,
          status: { $in: ['calculated', 'approved', 'paid'] }
        }
      },
      {
        $group: {
          _id: {
            month: '$month',
            year: '$year'
          },
          totalNetSalary: { $sum: '$netSalary' },
          employeeCount: { $sum: 1 },
          periodFrom: { $first: '$periodFrom' },
          periodTo: { $first: '$periodTo' },
          statuses: { $push: '$status' },
          processedAt: { $max: '$createdAt' }
        }
      },
      {
        $sort: {
          '_id.year': -1,
          '_id.month': -1
        }
      }
    ]);

    // Format the response
    const runs = monthlyData.map(item => {
      const { month, year } = item._id;
      
      // Determine overall status
      let overallStatus = 'pending';
      if (item.statuses.every((s: string) => s === 'paid')) {
        overallStatus = 'completed';
      } else if (item.statuses.some((s: string) => s === 'approved')) {
        overallStatus = 'processing';
      } else if (item.statuses.some((s: string) => s === 'calculated')) {
        overallStatus = 'calculated';
      }

      return {
        id: `${month}-${year}`,
        month,
        year,
        totalNetSalary: item.totalNetSalary,
        employeeCount: item.employeeCount,
        periodFrom: item.periodFrom,
        periodTo: item.periodTo,
        status: overallStatus,
        processedAt: item.processedAt
      };
    });

    // Get current date for active cycles
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const activeCount = runs.filter(run => 
      run.year === currentYear && run.month === currentMonth
    ).length;
    
    const completedCount = runs.filter(run => 
      run.status === 'completed'
    ).length;

    const totalAmount = runs.reduce((sum, run) => sum + run.totalNetSalary, 0);

    return NextResponse.json(
      ApiResponse.success('Payroll runs retrieved successfully', {
        runs,
        summary: {
          activeCount,
          completedCount,
          totalAmount,
          year
        }
      })
    );
  } catch (error: any) {
    console.error('Get payroll runs error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve payroll runs', error.message),
      { status: 500 }
    );
  }
}