import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth } from '@/middleware/auth';
import SalaryComponent from '@/models/SalaryComponent';
import Company from '@/models/Company';

// GET /api/salary-components/company/[companyId] - Get salary components by company
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    const companyId = params.companyId;

    // Find company
    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Build query
    const query: any = { company: companyId };
    if (type) query.type = type;
    if (category) query.category = category;
    if (isActive !== null) query.isActive = isActive === 'true';

    // Get salary components
    const salaryComponents = await SalaryComponent.find(query)
      .sort({ name: 1 });

    // Group by type for easier frontend consumption
    const groupedComponents = {
      earnings: salaryComponents.filter(c => c.type === 'earning'),
      deductions: salaryComponents.filter(c => c.type === 'deduction'),
    };

    return NextResponse.json(
      ApiResponse.success('Salary components retrieved successfully', {
        company: {
          id: company._id.toString(),
          name: company.name,
        },
        salaryComponents,
        groupedComponents,
        totals: {
          earnings: groupedComponents.earnings.length,
          deductions: groupedComponents.deductions.length,
          total: salaryComponents.length,
        },
      })
    );
  } catch (error: any) {
    console.error('Get company salary components error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve salary components', error.message),
      { status: 500 }
    );
  }
}