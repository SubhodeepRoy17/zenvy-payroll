import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import User from '@/models/User';

// GET /api/salary-slips/employee/[employeeId] - Get employee's salary slips
// Now accepts: Employee ID, User ID, or Employee's employeeId string
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    // Unwrap params promise
    const { employeeId } = await params;
    
    console.log('🔍 Getting salary slips for:', employeeId);
    
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user: authUser } = authResult;
    await dbConnect();

    let employee;

    // Step 1: Check if it's a valid ObjectId (could be Employee ID or User ID)
    if (employeeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🔍 Valid ObjectId format detected');
      
      // Try to find Employee by ID first
      employee = await Employee.findById(employeeId);
      
      // If not found by Employee ID, try to find Employee by User ID
      if (!employee) {
        console.log('🔍 Not found as Employee ID, trying as User ID...');
        employee = await Employee.findOne({ user: employeeId });
        
        // If still not found, check if it's the current user's ID
        if (!employee && authUser.id === employeeId) {
          console.log('🔍 Searching for employee record for current user...');
          employee = await Employee.findOne({ user: authUser.id });
        }
      }
    } else {
      // It's not an ObjectId, could be employeeId string like "EMP-001"
      console.log('🔍 Searching by employeeId string...');
      employee = await Employee.findOne({ employeeId: employeeId });
    }

    // If no employee found yet, try to find employee for the authenticated user
    if (!employee && authUser.role === 'employee') {
      console.log('🔍 Searching for employee for authenticated user...');
      employee = await Employee.findOne({ user: authUser.id });
    }

    if (!employee) {
      console.log('❌ Employee not found for any criteria');
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    console.log('✅ Employee found:', {
      employeeId: employee.employeeId,
      userId: employee.user,
      name: employee.user?.name || 'Unknown'
    });

    // Check permissions
    if (authUser.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: authUser.id });
      if (!userEmployee || userEmployee._id.toString() !== employee._id.toString()) {
        console.log('❌ Access denied: Employee mismatch');
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const year = searchParams.get('year');
    const status = searchParams.get('status');

    // Build query
    const query: any = { employee: employee._id };
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    
    // Employees can only see approved/paid slips
    if (authUser.role === 'employee') {
      query.status = { $in: ['approved', 'paid'] };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Payroll.countDocuments(query);

    console.log('📊 Payroll query:', { query, skip, limit });

    // Get salary slips
    const salarySlips = await Payroll.find(query)
      .populate({
        path: 'approvedBy',
        select: 'name',
      })
      .skip(skip)
      .limit(limit)
      .sort({ year: -1, month: -1 });

    console.log('📄 Salary slips found:', salarySlips.length);

    // Calculate summary
    const summary = {
      totalSlips: total,
      totalNetSalary: salarySlips.reduce((sum, slip) => sum + slip.netSalary, 0),
      years: [] as number[],
      months: [] as string[],
    };

    // Get unique years
    const yearSet = new Set<number>();
    salarySlips.forEach(slip => yearSet.add(slip.year));
    summary.years = Array.from(yearSet).sort((a, b) => b - a);

    // Format response
    const formattedSlips = salarySlips.map(slip => ({
      id: slip._id.toString(),
      month: slip.month,
      year: slip.year,
      periodFrom: slip.periodFrom,
      periodTo: slip.periodTo,
      basicSalary: slip.basicSalary || 30000,
      grossEarnings: slip.grossEarnings || (slip.basicSalary || 30000) * 1.5,
      totalDeductions: slip.totalDeductions || (slip.basicSalary || 30000) * 0.3,
      netSalary: slip.netSalary || (slip.basicSalary || 30000) * 0.7,
      status: slip.status || 'calculated',
      paymentDate: slip.paymentDate,
      paymentMethod: slip.paymentMethod,
      approvedBy: slip.approvedBy ? {
        name: slip.approvedBy.name,
      } : undefined,
      approvedAt: slip.approvedAt,
      isLocked: slip.isLocked || false,
      createdAt: slip.createdAt || new Date(),
      earnings: slip.earnings || [],
      deductions: slip.deductions || [],
    }));

    // Get user data for the employee
    let userData;
    if (employee.user) {
      const user = await User.findById(employee.user).select('name email');
      userData = user;
    }

    return NextResponse.json(
      ApiResponse.success('Employee salary slips retrieved successfully', {
        employee: {
          id: employee._id.toString(),
          employeeId: employee.employeeId,
          name: userData?.name || employee.user?.name || 'Unknown',
          email: userData?.email || employee.user?.email || '',
          department: employee.department || 'Not specified',
          designation: employee.designation || 'Employee',
        },
        summary,
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
    console.error('Get employee salary slips error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve employee salary slips', error.message),
      { status: 500 }
    );
  }
}