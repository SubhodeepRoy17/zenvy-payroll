import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { CompanyUpdateData } from '@/types/company';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/companies/[id] - Get company by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication - admin/hr/employee can view company details
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;

    // Find company
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Create audit log for admin/hr
    if (user.role !== 'employee') {
      await AuditLog.create({
        user: user._id,
        action: 'read',
        entity: 'company',
        entityId: company._id,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      });
    }

    return NextResponse.json(
      ApiResponse.success('Company retrieved successfully', {
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
      })
    );
  } catch (error: any) {
    console.error('Get company error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve company', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update company (admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Only admin can update companies
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;
    const data: CompanyUpdateData = await request.json();

    // Find company
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Track changes for audit log
    const oldData = {
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
      settings: { ...company.settings.toObject() },
      isActive: company.isActive,
    };

    // Update fields if provided
    if (data.name !== undefined) company.name = data.name;
    if (data.address !== undefined) company.address = data.address;
    if (data.city !== undefined) company.city = data.city;
    if (data.state !== undefined) company.state = data.state;
    if (data.country !== undefined) company.country = data.country;
    if (data.postalCode !== undefined) company.postalCode = data.postalCode;
    if (data.phone !== undefined) company.phone = data.phone;
    if (data.email !== undefined) company.email = data.email.toLowerCase();
    if (data.website !== undefined) company.website = data.website;
    if (data.taxId !== undefined) company.taxId = data.taxId;
    if (data.currency !== undefined) company.currency = data.currency;
    if (data.fiscalYearStart !== undefined) company.fiscalYearStart = data.fiscalYearStart;
    if (data.fiscalYearEnd !== undefined) company.fiscalYearEnd = data.fiscalYearEnd;
    if (data.logo !== undefined) company.logo = data.logo;
    if (data.isActive !== undefined) company.isActive = data.isActive;

    // Update settings if provided
    if (data.settings) {
      if (data.settings.workingDaysPerWeek !== undefined) 
        company.settings.workingDaysPerWeek = data.settings.workingDaysPerWeek;
      if (data.settings.workingHoursPerDay !== undefined) 
        company.settings.workingHoursPerDay = data.settings.workingHoursPerDay;
      if (data.settings.overtimeRate !== undefined) 
        company.settings.overtimeRate = data.settings.overtimeRate;
      if (data.settings.leaveEncashmentRate !== undefined) 
        company.settings.leaveEncashmentRate = data.settings.leaveEncashmentRate;
      if (data.settings.taxDeductionPercentage !== undefined) 
        company.settings.taxDeductionPercentage = data.settings.taxDeductionPercentage;
      if (data.settings.pfDeductionPercentage !== undefined) 
        company.settings.pfDeductionPercentage = data.settings.pfDeductionPercentage;
      if (data.settings.esiDeductionPercentage !== undefined) 
        company.settings.esiDeductionPercentage = data.settings.esiDeductionPercentage;
      if (data.settings.probationPeriodMonths !== undefined) 
        company.settings.probationPeriodMonths = data.settings.probationPeriodMonths;
      if (data.settings.noticePeriodDays !== undefined) 
        company.settings.noticePeriodDays = data.settings.noticePeriodDays;
      if (data.settings.paymentDate !== undefined) 
        company.settings.paymentDate = data.settings.paymentDate;
      if (data.settings.currencySymbol !== undefined) 
        company.settings.currencySymbol = data.settings.currencySymbol;
    }

    // Validate fiscal year dates
    if (company.fiscalYearStart >= company.fiscalYearEnd) {
      return NextResponse.json(
        ApiResponse.error('Fiscal year start must be before fiscal year end'),
        { status: 400 }
      );
    }

    // Check for duplicate tax ID if changing
    if (data.taxId && data.taxId !== oldData.taxId) {
      const existingTaxId = await Company.findOne({ 
        taxId: data.taxId,
        _id: { $ne: company }
      });
      if (existingTaxId) {
        return NextResponse.json(
          ApiResponse.error('Another company with this tax ID already exists'),
          { status: 409 }
        );
      }
    }

    // Check for duplicate email if changing
    if (data.email && data.email !== oldData.email) {
      const existingEmail = await Company.findOne({ 
        email: data.email.toLowerCase(),
        _id: { $ne: company }
      });
      if (existingEmail) {
        return NextResponse.json(
          ApiResponse.error('Another company with this email already exists'),
          { status: 409 }
        );
      }
    }

    // Save changes
    await company.save();

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'update',
      entity: 'company',
      entityId: company._id,
      changes: {
        old: oldData,
        new: {
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
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Company updated successfully', {
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
      })
    );
  } catch (error: any) {
    console.error('Update company error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update company', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Deactivate company (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Only admin can delete companies
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;

    // Find company
    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('Company not found'),
        { status: 404 }
      );
    }

    // Check if company has active employees
    const Employee = (await import('@/models/Employee')).default;
    const activeEmployees = await Employee.countDocuments({
      company: company,
      isActive: true,
    });

    if (activeEmployees > 0) {
      return NextResponse.json(
        ApiResponse.error(`Cannot deactivate company with ${activeEmployees} active employees`),
        { status: 400 }
      );
    }

    // Soft delete - deactivate instead of hard delete
    company.isActive = false;
    await company.save();

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'delete',
      entity: 'company',
      entityId: company._id,
      changes: { deactivated: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Company deactivated successfully')
    );
  } catch (error: any) {
    console.error('Delete company error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to deactivate company', error.message),
      { status: 500 }
    );
  }
}