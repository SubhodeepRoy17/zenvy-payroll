import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Employee from '@/models/Employee';
import User from '@/models/User';
import Company from '@/models/Company';
import SalaryComponent from '@/models/SalaryComponent';
import AuditLog from '@/models/AuditLog';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and role (only admin/hr can create employees)
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: creator } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      'name', 'email', 'employeeId', 'department', 'designation',
      'employmentType', 'joiningDate', 'workLocation'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          ApiResponse.error(`${field} is required`),
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        ApiResponse.error('User with this email already exists'),
        { status: 409 }
      );
    }

    // Check if employee ID is unique
    const existingEmployeeId = await Employee.findOne({ 
      employeeId: data.employeeId.toUpperCase() 
    });
    if (existingEmployeeId) {
      return NextResponse.json(
        ApiResponse.error('Employee ID already exists'),
        { status: 409 }
      );
    }

    // Get company (use the first company or default)
    const company = await Company.findOne({ isActive: true });
    if (!company) {
      return NextResponse.json(
        ApiResponse.error('No active company found'),
        { status: 404 }
      );
    }

    // Create user account for employee
    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password || 'Welcome@123', // You can generate or use provided password
      role: 'employee',
      department: data.department,
      position: data.designation,
      isActive: true,
    });

    // Prepare salary structure data
    const salaryStructureData = {
      basicSalary: data.basicSalary || 0, // Will be set separately when configuring payroll
      earnings: [], // Empty - to be configured later
      deductions: [], // Empty - to be configured later
      taxDeductions: [], // Empty - to be configured later
    };

    // Create employee record
    const employee = await Employee.create({
      user: newUser._id,
      employeeId: data.employeeId.toUpperCase(),
      company: company._id,
      department: data.department,
      designation: data.designation,
      employmentType: data.employmentType,
      joiningDate: new Date(data.joiningDate),
      workLocation: data.workLocation,
      basicSalary: 0, // Initialize as 0, will be set when configuring salary
      bankDetails: data.bankDetails || {
        accountNumber: '',
        accountHolderName: data.name,
        bankName: '',
        branch: '',
        ifscCode: '',
      },
      panNumber: data.panNumber || '',
      aadhaarNumber: data.aadhaarNumber || '',
      uanNumber: data.uanNumber || '',
      esiNumber: data.esiNumber || '',
      salaryStructure: salaryStructureData, // Store as embedded document instead of reference
      leaves: {
        earnedLeaves: 0,
        casualLeaves: 12, // Default 12 casual leaves per year
        sickLeaves: 6, // Default 6 sick leaves per year
      },
      isActive: true,
    });

    // Update user with employee reference
    newUser.employee = employee._id;
    await newUser.save();

    // Generate credentials
    let generatedPassword;
    if (!data.password) {
      // Generate a memorable password (first 4 letters of name + year + special char)
      const firstName = data.name.split(' ')[0];
      const currentYear = new Date().getFullYear();
      generatedPassword = `${firstName.substring(0, 4).toLowerCase()}${currentYear}@`;
      
      // Update user with generated password
      newUser.password = generatedPassword;
      await newUser.save();
    } else {
      generatedPassword = data.password;
    }

    // Create salary components as separate documents (optional, only if provided)
    if (data.salaryComponents && Array.isArray(data.salaryComponents)) {
      for (const component of data.salaryComponents) {
        await SalaryComponent.create({
          name: component.name,
          type: component.type || 'earning',
          category: component.category || 'basic',
          calculationType: component.calculationType || 'fixed',
          value: component.value || 0,
          percentageOf: component.percentageOf,
          employee: employee._id,
          company: company._id,
          isActive: true,
        });
      }
    }

    // Populate for response
    const populatedEmployee = await Employee.findById(employee._id)
      .populate({
        path: 'user',
        select: 'name email role',
      })
      .populate({
        path: 'company',
        select: 'name',
      })
      .populate({
        path: 'salaryComponents',
        select: 'name type value',
        match: { isActive: true },
      });

    // Create audit log
    await AuditLog.create({
      user: creator._id,
      action: 'create',
      entity: 'employee',
      entityId: employee._id,
      changes: { ...data, password: '*****' },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // Check if we should send email with credentials
    const sendEmail = data.sendEmail !== false; // Default to true

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
          },
          company: {
            id: populatedEmployee.company._id.toString(),
            name: populatedEmployee.company.name,
          },
          department: populatedEmployee.department,
          designation: populatedEmployee.designation,
          employmentType: populatedEmployee.employmentType,
          joiningDate: populatedEmployee.joiningDate,
          workLocation: populatedEmployee.workLocation,
          salaryStructure: populatedEmployee.salaryStructure || {},
          basicSalary: populatedEmployee.basicSalary || 0,
          credentials: {
            email: data.email,
            password: generatedPassword,
            message: 'Please save this password. Employee can login with these credentials.',
            sendEmail: sendEmail,
            // You could trigger an email service here if sendEmail is true
          },
        },
        nextSteps: [
          'Configure the employee\'s salary structure',
          'Set up bank account details',
          'Add additional documents (PAN, Aadhaar, etc.)',
          'Assign to projects or teams',
        ],
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create employee with user error:', error);
    
    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      // Extract the field that caused the duplicate
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      
      return NextResponse.json(
        ApiResponse.error(`${field} '${value}' already exists`),
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      ApiResponse.error('Failed to create employee', error.message),
      { status: 500 }
    );
  }
}