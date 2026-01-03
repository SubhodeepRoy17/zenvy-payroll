import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import SalaryComponent from '@/models/SalaryComponent';
import AuditLog from '@/models/AuditLog';

// GET /api/salary-components/[id] - Get salary component by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admin/hr can view salary components
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const componentId = params.id;

    // Find salary component
    const salaryComponent = await SalaryComponent.findById(componentId)
      .populate({
        path: 'company',
        select: 'name',
      });

    if (!salaryComponent) {
      return NextResponse.json(
        ApiResponse.error('Salary component not found'),
        { status: 404 }
      );
    }

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'salary-component',
      entityId: salaryComponent._id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary component retrieved successfully', {
        salaryComponent: {
          id: salaryComponent._id.toString(),
          name: salaryComponent.name,
          type: salaryComponent.type,
          category: salaryComponent.category,
          calculationType: salaryComponent.calculationType,
          value: salaryComponent.value,
          formula: salaryComponent.formula,
          percentageOf: salaryComponent.percentageOf,
          isTaxable: salaryComponent.isTaxable,
          isRecurring: salaryComponent.isRecurring,
          description: salaryComponent.description,
          company: {
            id: salaryComponent.company._id.toString(),
            name: salaryComponent.company.name,
          },
          isActive: salaryComponent.isActive,
          createdAt: salaryComponent.createdAt,
          updatedAt: salaryComponent.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Get salary component error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve salary component', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/salary-components/[id] - Update salary component
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admin/hr can update salary components
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const componentId = params.id;
    const data = await request.json();

    // Find salary component
    const salaryComponent = await SalaryComponent.findById(componentId);
    if (!salaryComponent) {
      return NextResponse.json(
        ApiResponse.error('Salary component not found'),
        { status: 404 }
      );
    }

    // Track changes for audit log
    const oldData = {
      name: salaryComponent.name,
      type: salaryComponent.type,
      category: salaryComponent.category,
      calculationType: salaryComponent.calculationType,
      value: salaryComponent.value,
      formula: salaryComponent.formula,
      percentageOf: salaryComponent.percentageOf,
      isTaxable: salaryComponent.isTaxable,
      isRecurring: salaryComponent.isRecurring,
      description: salaryComponent.description,
      isActive: salaryComponent.isActive,
    };

    // Update fields if provided
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.type !== undefined) {
      const validTypes = ['earning', 'deduction'];
      if (!validTypes.includes(data.type)) {
        return NextResponse.json(
          ApiResponse.error(`Type must be one of: ${validTypes.join(', ')}`),
          { status: 400 }
        );
      }
      updates.type = data.type;
    }
    if (data.category !== undefined) {
      const validCategories = ['basic', 'allowance', 'reimbursement', 'bonus', 'tax', 'provident-fund', 'esi', 'loan', 'other'];
      if (!validCategories.includes(data.category)) {
        return NextResponse.json(
          ApiResponse.error(`Category must be one of: ${validCategories.join(', ')}`),
          { status: 400 }
        );
      }
      updates.category = data.category;
    }
    if (data.calculationType !== undefined) {
      const validCalculationTypes = ['fixed', 'percentage', 'formula'];
      if (!validCalculationTypes.includes(data.calculationType)) {
        return NextResponse.json(
          ApiResponse.error(`Calculation type must be one of: ${validCalculationTypes.join(', ')}`),
          { status: 400 }
        );
      }
      updates.calculationType = data.calculationType;
    }
    if (data.value !== undefined) {
      if (data.value < 0) {
        return NextResponse.json(
          ApiResponse.error('Value cannot be negative'),
          { status: 400 }
        );
      }
      if (data.calculationType === 'percentage' && data.value > 100) {
        return NextResponse.json(
          ApiResponse.error('Percentage value cannot exceed 100'),
          { status: 400 }
        );
      }
      updates.value = data.value;
    }
    if (data.formula !== undefined) updates.formula = data.formula;
    if (data.percentageOf !== undefined) updates.percentageOf = data.percentageOf;
    if (data.isTaxable !== undefined) updates.isTaxable = data.isTaxable;
    if (data.isRecurring !== undefined) updates.isRecurring = data.isRecurring;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    // Check if new name already exists in the company
    if (data.name && data.name !== oldData.name) {
      const existingComponent = await SalaryComponent.findOne({
        name: data.name,
        company: salaryComponent.company,
        _id: { $ne: componentId },
      });

      if (existingComponent) {
        return NextResponse.json(
          ApiResponse.error('Salary component with this name already exists in this company'),
          { status: 409 }
        );
      }
    }

    // Apply updates
    Object.assign(salaryComponent, updates);
    await salaryComponent.save();

    // Get updated component with populated data
    const updatedComponent = await SalaryComponent.findById(salaryComponent._id)
      .populate({
        path: 'company',
        select: 'name',
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'update',
      entity: 'salary-component',
      entityId: salaryComponent._id,
      changes: {
        old: oldData,
        new: {
          name: salaryComponent.name,
          type: salaryComponent.type,
          category: salaryComponent.category,
          calculationType: salaryComponent.calculationType,
          value: salaryComponent.value,
          formula: salaryComponent.formula,
          percentageOf: salaryComponent.percentageOf,
          isTaxable: salaryComponent.isTaxable,
          isRecurring: salaryComponent.isRecurring,
          description: salaryComponent.description,
          isActive: salaryComponent.isActive,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary component updated successfully', {
        salaryComponent: {
          id: updatedComponent._id.toString(),
          name: updatedComponent.name,
          type: updatedComponent.type,
          category: updatedComponent.category,
          calculationType: updatedComponent.calculationType,
          value: updatedComponent.value,
          formula: updatedComponent.formula,
          percentageOf: updatedComponent.percentageOf,
          isTaxable: updatedComponent.isTaxable,
          isRecurring: updatedComponent.isRecurring,
          description: updatedComponent.description,
          company: {
            id: updatedComponent.company._id.toString(),
            name: updatedComponent.company.name,
          },
          isActive: updatedComponent.isActive,
          createdAt: updatedComponent.createdAt,
          updatedAt: updatedComponent.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Update salary component error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update salary component', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/salary-components/[id] - Delete salary component
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only admin can delete salary components
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const componentId = params.id;

    // Find salary component
    const salaryComponent = await SalaryComponent.findById(componentId);
    if (!salaryComponent) {
      return NextResponse.json(
        ApiResponse.error('Salary component not found'),
        { status: 404 }
      );
    }

    // Check if component is being used by any employee
    const Employee = (await import('@/models/Employee')).default;
    const employeesUsingComponent = await Employee.countDocuments({
      salaryStructure: componentId,
    });

    if (employeesUsingComponent > 0) {
      return NextResponse.json(
        ApiResponse.error(`Cannot delete salary component used by ${employeesUsingComponent} employee(s)`),
        { status: 400 }
      );
    }

    // Delete the component
    await SalaryComponent.findByIdAndDelete(componentId);

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'delete',
      entity: 'salary-component',
      entityId: salaryComponent._id,
      changes: { deleted: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Salary component deleted successfully')
    );
  } catch (error: any) {
    console.error('Delete salary component error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to delete salary component', error.message),
      { status: 500 }
    );
  }
}