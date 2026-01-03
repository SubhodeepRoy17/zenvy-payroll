import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import SalaryComponent from '@/models/SalaryComponent';
import AuditLog from '@/models/AuditLog';
import { EmployeeCreateData, EmployeeResponse } from '@/types/employee';

// GET /api/employees - List all employees with filters
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role (only admin/hr can view all employees)
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const department = searchParams.get('department');
    const designation = searchParams.get('designation');
    const isActive = searchParams.get('isActive');
    const employeeId = searchParams.get('employeeId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'employeeId';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query
    const query: any = {};

    if (department && department !== 'all') query.department = department;
    if (designation) query.designation = designation;
    if (isActive !== null) query.isActive = isActive === 'true';
    if (employeeId) query.employeeId = { $regex: employeeId, $options: 'i' };

    // Search logic - SIMPLIFY for now
    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Employee.countDocuments(query);

    console.log('🔍 Employee query:', query);
    console.log('📊 Total employees found:', total);

    // Get employees with populated data
    const employees = await Employee.find(query)
      .populate({
        path: 'user',
        select: 'name email role avatar',
      })
      .populate({
        path: 'company',
        select: 'name',
      })
      .populate({
        path: 'salaryStructure',
        select: 'name',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean();

    console.log('📊 Employees after populate:', employees.length);

    // Format response
    const formattedEmployees: EmployeeResponse[] = employees.map(emp => ({
      id: emp._id.toString(),
      employeeId: emp.employeeId,
      user: emp.user ? {
        id: emp.user._id.toString(),
        name: emp.user.name || 'Unknown',
        email: emp.user.email || 'No email',
        role: emp.user.role || 'employee',
        avatar: emp.user.avatar,
      } : {
        id: '',
        name: 'User not found',
        email: 'No email',
        role: 'employee',
        avatar: undefined,
      },
      company: emp.company ? {
        id: emp.company._id.toString(),
        name: emp.company.name || 'Unknown Company',
      } : {
        id: '',
        name: 'Company not found',
      },
      department: emp.department,
      designation: emp.designation,
      employmentType: emp.employmentType,
      joiningDate: emp.joiningDate,
      confirmationDate: emp.confirmationDate,
      exitDate: emp.exitDate,
      workLocation: emp.workLocation,
      bankDetails: emp.bankDetails,
      panNumber: emp.panNumber,
      aadhaarNumber: emp.aadhaarNumber,
      uanNumber: emp.uanNumber,
      esiNumber: emp.esiNumber,
      salaryStructure: emp.salaryStructure ? {
        id: emp.salaryStructure._id.toString(),
        name: emp.salaryStructure.name || 'Unknown Structure',
      } : {
        id: '',
        name: 'Salary structure not found',
      },
      leaves: emp.leaves,
      isActive: emp.isActive,
      createdAt: emp.createdAt,
      updatedAt: emp.updatedAt,
    }));

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'employee',
      changes: { query, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Employees retrieved successfully', {
        employees: formattedEmployees,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve employees', error.message),
      { status: 500 }
    );
  }
}

// POST /api/employees - Create new employee
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role (only admin/hr can create employees)
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data: EmployeeCreateData = await request.json();

    // Validate required fields
    const requiredFields = [
      'userId', 'employeeId', 'companyId', 'department', 
      'designation', 'employmentType', 'joiningDate', 'workLocation',
      'bankDetails', 'panNumber', 'aadhaarNumber', 'uanNumber', 'salaryStructureId'
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof EmployeeCreateData]) {
        return NextResponse.json(
          ApiResponse.error(`${field} is required`),
          { status: 400 }
        );
      }
    }

    // Validate bank details
    const bankFields = ['accountNumber', 'accountHolderName', 'bankName', 'branch', 'ifscCode'];
    for (const field of bankFields) {
      if (!data.bankDetails[field as keyof typeof data.bankDetails]) {
        return NextResponse.json(
          ApiResponse.error(`Bank ${field} is required`),
          { status: 400 }
        );
      }
    }

    // Check if user exists
    const existingUser = await User.findById(data.userId);
    if (!existingUser) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Check if user already has an employee record
    const existingEmployee = await Employee.findOne({ user: data.userId });
    if (existingEmployee) {
      return NextResponse.json(
        ApiResponse.error('User already has an employee record'),
        { status: 409 }
      );
    }

    // Check if employee ID is unique
    const existingEmployeeId = await Employee.findOne({ employeeId: data.employeeId });
    if (existingEmployeeId) {
      return NextResponse.json(
        ApiResponse.error('Employee ID already exists'),
        { status: 409 }
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

    // Check if salary structure exists
    const salaryStructure = await SalaryComponent.findById(data.salaryStructureId);
    if (!salaryStructure) {
      return NextResponse.json(
        ApiResponse.error('Salary structure not found'),
        { status: 404 }
      );
    }

    // Check reporting manager if provided
    if (data.reportingManagerId) {
      const reportingManager = await Employee.findById(data.reportingManagerId);
      if (!reportingManager) {
        return NextResponse.json(
          ApiResponse.error('Reporting manager not found'),
          { status: 404 }
        );
      }
    }

    // Create employee
    const employee = await Employee.create({
      user: data.userId,
      employeeId: data.employeeId.toUpperCase(),
      company: data.companyId,
      department: data.department,
      designation: data.designation,
      reportingManager: data.reportingManagerId,
      employmentType: data.employmentType,
      joiningDate: data.joiningDate,
      workLocation: data.workLocation,
      bankDetails: {
        accountNumber: data.bankDetails.accountNumber,
        accountHolderName: data.bankDetails.accountHolderName,
        bankName: data.bankDetails.bankName,
        branch: data.bankDetails.branch,
        ifscCode: data.bankDetails.ifscCode.toUpperCase(),
      },
      panNumber: data.panNumber.toUpperCase(),
      aadhaarNumber: data.aadhaarNumber,
      uanNumber: data.uanNumber,
      esiNumber: data.esiNumber,
      salaryStructure: data.salaryStructureId,
      leaves: {
        earnedLeaves: 0,
        casualLeaves: 0,
        sickLeaves: 0,
      },
    });

    // Update user role to employee if not already
    if (existingUser.role !== 'employee') {
      existingUser.role = 'employee';
      await existingUser.save();
    }

    // Populate the created employee for response
    const populatedEmployee = await Employee.findById(employee._id)
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
      action: 'create',
      entity: 'employee',
      entityId: employee._id,
      changes: data,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Employee created successfully', {
        employee: {
          id: populatedEmployee._id.toString(),
          employeeId: populatedEmployee.employeeId,
          user: {
            id: populatedEmployee.user._id.toString(),
            name: populatedEmployee.user.name,
            email: populatedEmployee.user.email,
            role: populatedEmployee.user.role,
            avatar: populatedEmployee.user.avatar,
          },
          company: {
            id: populatedEmployee.company._id.toString(),
            name: populatedEmployee.company.name,
          },
          department: populatedEmployee.department,
          designation: populatedEmployee.designation,
          reportingManager: populatedEmployee.reportingManager ? {
            id: populatedEmployee.reportingManager._id.toString(),
            employeeId: populatedEmployee.reportingManager.employeeId,
            name: populatedEmployee.reportingManager.user.name,
          } : undefined,
          employmentType: populatedEmployee.employmentType,
          joiningDate: populatedEmployee.joiningDate,
          workLocation: populatedEmployee.workLocation,
          bankDetails: populatedEmployee.bankDetails,
          panNumber: populatedEmployee.panNumber,
          aadhaarNumber: populatedEmployee.aadhaarNumber,
          uanNumber: populatedEmployee.uanNumber,
          esiNumber: populatedEmployee.esiNumber,
          salaryStructure: {
            id: populatedEmployee.salaryStructure._id.toString(),
            name: populatedEmployee.salaryStructure.name,
          },
          leaves: populatedEmployee.leaves,
          isActive: populatedEmployee.isActive,
          createdAt: populatedEmployee.createdAt,
          updatedAt: populatedEmployee.updatedAt,
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to create employee', error.message),
      { status: 500 }
    );
  }
}