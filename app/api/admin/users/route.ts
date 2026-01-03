import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

// GET /api/admin/users - Get all users with filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    if (role && role !== 'all') query.role = role;
    if (isActive !== null) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);

    // Get users without password
    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Get employee data for users who are employees
    const Employee = (await import('@/models/Employee')).default;
    const usersWithEmployeeInfo = await Promise.all(
      users.map(async (user) => {
        const employee = await Employee.findOne({ user: user._id })
          .select('employeeId department designation')
          .populate('company', 'name');
        
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: employee?.department || user.department || '',
          position: employee?.designation || user.position || '',
          employeeId: employee?.employeeId || '',
          company: employee?.company ? {
            id: employee.company._id.toString(),
            name: employee.company.name,
          } : null,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          createdAt: user.createdAt,
        };
      })
    );

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'user',
      changes: { query, page, limit },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Users retrieved successfully', {
        users: usersWithEmployeeInfo,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve users', error.message),
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: adminUser } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'email', 'password', 'role'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          ApiResponse.error(`${field} is required`),
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        ApiResponse.error('User with this email already exists'),
        { status: 409 }
      );
    }

    // Create user
    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role,
      department: data.department || '',
      position: data.position || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    // Create audit log
    await AuditLog.create({
      user: adminUser._id,
      action: 'create',
      entity: 'user',
      entityId: newUser._id,
      changes: {
        ...data,
        password: '[HIDDEN]',
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // Return user without password
    const userResponse = await User.findById(newUser._id).select('-password');

    return NextResponse.json(
      ApiResponse.success('User created successfully', {
        user: {
          id: userResponse._id.toString(),
          name: userResponse.name,
          email: userResponse.email,
          role: userResponse.role,
          department: userResponse.department,
          position: userResponse.position,
          isActive: userResponse.isActive,
          createdAt: userResponse.createdAt,
        },
      }),
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to create user', error.message),
      { status: 500 }
    );
  }
}