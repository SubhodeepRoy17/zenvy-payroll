import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { CompanyCreateData, CompanyResponse } from '@/types/company';

// GET /api/companies - List all companies (admin only)
export async function GET(request: NextRequest) {
  try {
    // Only admin can list all companies
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    
    if (isActive !== null) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { taxId: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Company.countDocuments(query);

    // Get companies
    const companies = await Company.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Format response
    const formattedCompanies: CompanyResponse[] = companies.map(company => ({
      id: company._id.toString(),
      name: company.name,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postalCode,
      phone: company.phone,
      email: company.email,
      website: company.website,
      taxId: company.taxId,
      currency: company.currency,
      fiscalYearStart: company.fiscalYearStart,
      fiscalYearEnd: company.fiscalYearEnd,
      logo: company.logo,
      settings: company.settings,
      isActive: company.isActive,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }));

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'company',
      changes: { query, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Companies retrieved successfully', {
        companies: formattedCompanies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve companies', error.message),
      { status: 500 }
    );
  }
}

// POST /api/companies - Create new company (admin only)
export async function POST(request: NextRequest) {
  try {
    // Only admin can create companies
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data: CompanyCreateData = await request.json();

    // Validate required fields
    const requiredFields = [
      'name', 'address', 'city', 'state', 'country', 'postalCode',
      'phone', 'email', 'taxId', 'currency', 'fiscalYearStart', 'fiscalYearEnd'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof CompanyCreateData]) {
        return NextResponse.json(
          ApiResponse.error(`${field} is required`),
          { status: 400 }
        );
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        ApiResponse.error('Invalid email format'),
        { status: 400 }
      );
    }

    // Validate fiscal year dates
    if (data.fiscalYearStart >= data.fiscalYearEnd) {
      return NextResponse.json(
        ApiResponse.error('Fiscal year start must be before fiscal year end'),
        { status: 400 }
      );
    }

    // Check if company with same tax ID already exists
    const existingCompany = await Company.findOne({ taxId: data.taxId });
    if (existingCompany) {
      return NextResponse.json(
        ApiResponse.error('Company with this tax ID already exists'),
        { status: 409 }
      );
    }

    // Check if company with same email already exists
    const existingEmail = await Company.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        ApiResponse.error('Company with this email already exists'),
        { status: 409 }
      );
    }

    // Create company
    const company = await Company.create({
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      phone: data.phone,
      email: data.email.toLowerCase(),
      website: data.website,
      taxId: data.taxId,
      currency: data.currency,
      fiscalYearStart: data.fiscalYearStart,
      fiscalYearEnd: data.fiscalYearEnd,
      logo: data.logo,
      settings: {
        workingDaysPerWeek: data.settings?.workingDaysPerWeek || 6,
        workingHoursPerDay: data.settings?.workingHoursPerDay || 8,
        overtimeRate: data.settings?.overtimeRate || 1.5,
        leaveEncashmentRate: data.settings?.leaveEncashmentRate || 1,
        taxDeductionPercentage: data.settings?.taxDeductionPercentage || 10,
        pfDeductionPercentage: data.settings?.pfDeductionPercentage || 12,
        esiDeductionPercentage: data.settings?.esiDeductionPercentage || 0.75,
        probationPeriodMonths: data.settings?.probationPeriodMonths || 3,
        noticePeriodDays: data.settings?.noticePeriodDays || 30,
        paymentDate: data.settings?.paymentDate || 1,
        currencySymbol: data.settings?.currencySymbol || '₹',
      },
    });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'create',
      entity: 'company',
      entityId: company._id,
      changes: data,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Company created successfully', {
        company: {
          id: company._id.toString(),
          name: company.name,
          address: company.address,
          city: company.city,
          state: company.state,
          country: company.country,
          postalCode: company.postalCode,
          phone: company.phone,
          email: company.email,
          website: company.website,
          taxId: company.taxId,
          currency: company.currency,
          fiscalYearStart: company.fiscalYearStart,
          fiscalYearEnd: company.fiscalYearEnd,
          logo: company.logo,
          settings: company.settings,
          isActive: company.isActive,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to create company', error.message),
      { status: 500 }
    );
  }
}