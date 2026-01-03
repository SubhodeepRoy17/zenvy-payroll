import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import SalaryComponent from '@/models/SalaryComponent';
import AuditLog from '@/models/AuditLog';
import { EmployeeUpdateData } from '@/types/employee';

// GET /api/employees/[id] - Get employee by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const { id: employeeId } = await params;

    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;

    // Find employee
    const employee = await Employee.findById(employeeId)
      .populate({
        path: 'user',
        select: 'name email role avatar',
      })
      .populate({
        path: 'company',
        select: 'name address city state country phone email',
      })
      .populate({
        path: 'reportingManager',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name email',
        },
      })
      .populate({
        path: 'salaryStructure',
        select: 'name type category calculationType value',
      });

    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    // Check permissions: 
    // - Admin/HR can view any employee
    // - Employee can only view their own record
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== employeeId) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
    }

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'employee',
      entityId: employee._id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // Format response
    const responseData = {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      user: {
        id: employee.user._id.toString(),
        name: employee.user.name,
        email: employee.user.email,
        role: employee.user.role,
        avatar: employee.user.avatar,
      },
      company: {
        id: employee.company._id.toString(),
        name: employee.company.name,
        address: employee.company.address,
        city: employee.company.city,
        state: employee.company.state,
        country: employee.company.country,
        phone: employee.company.phone,
        email: employee.company.email,
      },
      department: employee.department,
      designation: employee.designation,
      reportingManager: employee.reportingManager ? {
        id: employee.reportingManager._id.toString(),
        employeeId: employee.reportingManager.employeeId,
        name: employee.reportingManager.user.name,
        email: employee.reportingManager.user.email,
      } : undefined,
      employmentType: employee.employmentType,
      joiningDate: employee.joiningDate,
      confirmationDate: employee.confirmationDate,
      exitDate: employee.exitDate,
      workLocation: employee.workLocation,
      bankDetails: employee.bankDetails,
      panNumber: employee.panNumber,
      aadhaarNumber: employee.aadhaarNumber,
      uanNumber: employee.uanNumber,
      esiNumber: employee.esiNumber,
      salaryStructure: {
        id: employee.salaryStructure._id.toString(),
        name: employee.salaryStructure.name,
        type: employee.salaryStructure.type,
        category: employee.salaryStructure.category,
        calculationType: employee.salaryStructure.calculationType,
        value: employee.salaryStructure.value,
      },
      leaves: employee.leaves,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };

    return NextResponse.json(
      ApiResponse.success('Employee retrieved successfully', responseData)
    );
  } catch (error: any) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve employee', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and role (only admin/hr can update employees)
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id: employeeId } = await params;
    const data: EmployeeUpdateData = await request.json();

    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    // Track changes for audit log
    const oldData = {
      department: employee.department,
      designation: employee.designation,
      reportingManager: employee.reportingManager,
      employmentType: employee.employmentType,
      confirmationDate: employee.confirmationDate,
      exitDate: employee.exitDate,
      workLocation: employee.workLocation,
      bankDetails: employee.bankDetails,
      panNumber: employee.panNumber,
      aadhaarNumber: employee.aadhaarNumber,
      uanNumber: employee.uanNumber,
      esiNumber: employee.esiNumber,
      salaryStructure: employee.salaryStructure,
      isActive: employee.isActive,
    };

    // Update fields if provided
    if (data.department !== undefined) employee.department = data.department;
    if (data.designation !== undefined) employee.designation = data.designation;
    if (data.reportingManagerId !== undefined) {
      if (data.reportingManagerId) {
        const reportingManager = await Employee.findById(data.reportingManagerId);
        if (!reportingManager) {
          return NextResponse.json(
            ApiResponse.error('Reporting manager not found'),
            { status: 404 }
          );
        }
        employee.reportingManager = data.reportingManagerId;
      } else {
        employee.reportingManager = undefined;
      }
    }
    if (data.employmentType !== undefined) employee.employmentType = data.employmentType;
    if (data.confirmationDate !== undefined) employee.confirmationDate = data.confirmationDate;
    if (data.exitDate !== undefined) employee.exitDate = data.exitDate;
    if (data.workLocation !== undefined) employee.workLocation = data.workLocation;
    if (data.bankDetails !== undefined) {
      if (data.bankDetails.accountNumber) employee.bankDetails.accountNumber = data.bankDetails.accountNumber;
      if (data.bankDetails.accountHolderName) employee.bankDetails.accountHolderName = data.bankDetails.accountHolderName;
      if (data.bankDetails.bankName) employee.bankDetails.bankName = data.bankDetails.bankName;
      if (data.bankDetails.branch) employee.bankDetails.branch = data.bankDetails.branch;
      if (data.bankDetails.ifscCode) employee.bankDetails.ifscCode = data.bankDetails.ifscCode.toUpperCase();
    }
    if (data.panNumber !== undefined) employee.panNumber = data.panNumber.toUpperCase();
    if (data.aadhaarNumber !== undefined) employee.aadhaarNumber = data.aadhaarNumber;
    if (data.uanNumber !== undefined) employee.uanNumber = data.uanNumber;
    if (data.esiNumber !== undefined) employee.esiNumber = data.esiNumber;
    if (data.salaryStructureId !== undefined) {
      const salaryStructure = await SalaryComponent.findById(data.salaryStructureId);
      if (!salaryStructure) {
        return NextResponse.json(
          ApiResponse.error('Salary structure not found'),
          { status: 404 }
        );
      }
      employee.salaryStructure = data.salaryStructureId;
    }
    if (data.isActive !== undefined) employee.isActive = data.isActive;

    // Save changes
    await employee.save();

    // Get updated employee with populated data
    const updatedEmployee = await Employee.findById(employee._id)
      .populate({
        path: 'user',
        select: 'name email role avatar',
      })
      .populate({
        path: 'company',
        select: 'name',
      })
      .populate({
        path: 'reportingManager',
        select: 'employeeId',
        populate: {
          path: 'user',
          select: 'name',
        },
      })
      .populate({
        path: 'salaryStructure',
        select: 'name',
      });

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'update',
      entity: 'employee',
      entityId: employee._id,
      changes: {
        old: oldData,
        new: {
          department: employee.department,
          designation: employee.designation,
          reportingManager: employee.reportingManager,
          employmentType: employee.employmentType,
          confirmationDate: employee.confirmationDate,
          exitDate: employee.exitDate,
          workLocation: employee.workLocation,
          bankDetails: employee.bankDetails,
          panNumber: employee.panNumber,
          aadhaarNumber: employee.aadhaarNumber,
          uanNumber: employee.uanNumber,
          esiNumber: employee.esiNumber,
          salaryStructure: employee.salaryStructure,
          isActive: employee.isActive,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Employee updated successfully', {
        employee: {
          id: updatedEmployee._id.toString(),
          employeeId: updatedEmployee.employeeId,
          user: {
            id: updatedEmployee.user._id.toString(),
            name: updatedEmployee.user.name,
            email: updatedEmployee.user.email,
            role: updatedEmployee.user.role,
            avatar: updatedEmployee.user.avatar,
          },
          company: {
            id: updatedEmployee.company._id.toString(),
            name: updatedEmployee.company.name,
          },
          department: updatedEmployee.department,
          designation: updatedEmployee.designation,
          reportingManager: updatedEmployee.reportingManager ? {
            id: updatedEmployee.reportingManager._id.toString(),
            employeeId: updatedEmployee.reportingManager.employeeId,
            name: updatedEmployee.reportingManager.user.name,
          } : undefined,
          employmentType: updatedEmployee.employmentType,
          joiningDate: updatedEmployee.joiningDate,
          confirmationDate: updatedEmployee.confirmationDate,
          exitDate: updatedEmployee.exitDate,
          workLocation: updatedEmployee.workLocation,
          bankDetails: updatedEmployee.bankDetails,
          panNumber: updatedEmployee.panNumber,
          aadhaarNumber: updatedEmployee.aadhaarNumber,
          uanNumber: updatedEmployee.uanNumber,
          esiNumber: updatedEmployee.esiNumber,
          salaryStructure: {
            id: updatedEmployee.salaryStructure._id.toString(),
            name: updatedEmployee.salaryStructure.name,
          },
          leaves: updatedEmployee.leaves,
          isActive: updatedEmployee.isActive,
          createdAt: updatedEmployee.createdAt,
          updatedAt: updatedEmployee.updatedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update employee', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Deactivate employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and role (only admin can delete employees)
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id: employeeId } = await params;

    // Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        ApiResponse.error('Employee not found'),
        { status: 404 }
      );
    }

    // Soft delete - deactivate instead of hard delete
    employee.isActive = false;
    employee.exitDate = new Date();
    await employee.save();

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'delete',
      entity: 'employee',
      entityId: employee._id,
      changes: { deactivated: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Employee deactivated successfully')
    );
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to deactivate employee', error.message),
      { status: 500 }
    );
  }
}