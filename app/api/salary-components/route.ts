import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import SalaryComponent from '@/models/SalaryComponent';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';

// GET /api/salary-components - List salary components
export async function GET(request: NextRequest) {
  try {
    // Only admin/hr can view salary components
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query
    const query: any = {};

    // Company filter
    if (companyId) {
      query.company = companyId;
    } else {
      // Default to first active company if not specified
      const company = await Company.findOne({ isActive: true });
      if (company) {
        query.company = company._id;
      }
    }

    if (type) query.type = type;
    if (category) query.category = category;
    if (isActive !== null) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await SalaryComponent.countDocuments(query);

    // Get salary components with company info
    const salaryComponents = await SalaryComponent.find(query)
      .populate({
        path: 'company',
        select: 'name',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Format response
    const formattedComponents = salaryComponents.map(component => ({
      id: component._id.toString(),
      name: component.name,
      type: component.type,
      category: component.category,
      calculationType: component.calculationType,
      value: component.value,
      formula: component.formula,
      percentageOf: component.percentageOf,
      isTaxable: component.isTaxable,
      isRecurring: component.isRecurring,
      description: component.description,
      company: {
        id: component.company._id.toString(),
        name: component.company.name,
      },
      isActive: component.isActive,
      createdAt: component.createdAt,
      updatedAt: component.updatedAt,
    }));

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'salary-component',
      changes: { query, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary components retrieved successfully', {
        salaryComponents: formattedComponents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get salary components error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve salary components', error.message),
      { status: 500 }
    );
  }
}

// POST /api/salary-components - Create salary component
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can create salary components
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'type', 'category', 'calculationType', 'value', 'companyId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          ApiResponse.error(`${field} is required`),
          { status: 400 }
        );
      }
    }

    // Validate type
    const validTypes = ['earning', 'deduction'];
    if (!validTypes.includes(data.type)) {
      return NextResponse.json(
        ApiResponse.error(`Type must be one of: ${validTypes.join(', ')}`),
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['basic', 'allowance', 'reimbursement', 'bonus', 'tax', 'provident-fund', 'esi', 'loan', 'other'];
    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        ApiResponse.error(`Category must be one of: ${validCategories.join(', ')}`),
        { status: 400 }
      );
    }

    // Validate calculation type
    const validCalculationTypes = ['fixed', 'percentage', 'formula'];
    if (!validCalculationTypes.includes(data.calculationType)) {
      return NextResponse.json(
        ApiResponse.error(`Calculation type must be one of: ${validCalculationTypes.join(', ')}`),
        { status: 400 }
      );
    }

    // Validate value
    if (data.value < 0) {
      return NextResponse.json(
        ApiResponse.error('Value cannot be negative'),
        { status: 400 }
      );
    }

    // Validate percentage calculation
    if (data.calculationType === 'percentage' && data.value > 100) {
      return NextResponse.json(
        ApiResponse.error('Percentage value cannot exceed 100'),
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await Company.findById(data.companyId);
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Check if component name already exists in the company
    const existingComponent = await SalaryComponent.findOne({
      name: data.name,
      company: data.companyId,
    });

    if (existingComponent) {
      return NextResponse.json(
        ApiResponse.error('Salary component with this name already exists in this company'),
        { status: 409 }
      );
    }

    // Create salary component
    const salaryComponent = await SalaryComponent.create({
      name: data.name,
      type: data.type,
      category: data.category,
      calculationType: data.calculationType,
      value: data.value,
      formula: data.formula,
      percentageOf: data.percentageOf,
      isTaxable: data.isTaxable !== undefined ? data.isTaxable : true,
      isRecurring: data.isRecurring !== undefined ? data.isRecurring : true,
      description: data.description,
      company: data.companyId,
    });

    // Get populated component
    const populatedComponent = await SalaryComponent.findById(salaryComponent._id)
      .populate({
        path: 'company',
        select: 'name',
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'salary-component',
      entityId: salaryComponent._id,
      changes: data,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary component created successfully', {
        salaryComponent: {
          id: populatedComponent._id.toString(),
          name: populatedComponent.name,
          type: populatedComponent.type,
          category: populatedComponent.category,
          calculationType: populatedComponent.calculationType,
          value: populatedComponent.value,
          formula: populatedComponent.formula,
          percentageOf: populatedComponent.percentageOf,
          isTaxable: populatedComponent.isTaxable,
          isRecurring: populatedComponent.isRecurring,
          description: populatedComponent.description,
          company: {
            id: populatedComponent.company._id.toString(),
            name: populatedComponent.company.name,
          },
          isActive: populatedComponent.isActive,
          createdAt: populatedComponent.createdAt,
          updatedAt: populatedComponent.updatedAt,
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create salary component error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to create salary component', error.message),
      { status: 500 }
    );
  }
}