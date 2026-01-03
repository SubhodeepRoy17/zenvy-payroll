import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: adminUser } = authResult;
    await dbConnect();

    const { id } = await params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponse.success('User retrieved successfully', {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          lastLogin: user.lastLogin,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve user', error.message),
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: adminUser } = authResult;
    await dbConnect();

    const { id } = await params;
    const data = await request.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Track changes
    const oldData = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      isActive: user.isActive,
    };

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email.toLowerCase();
    if (data.role !== undefined) user.role = data.role;
    if (data.department !== undefined) user.department = data.department;
    if (data.position !== undefined) user.position = data.position;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();

    // Create audit log
    await AuditLog.create({
      user: adminUser._id,
      action: 'update',
      entity: 'user',
      entityId: user._id,
      changes: {
        old: oldData,
        new: {
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          isActive: user.isActive,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('User updated successfully', {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to update user', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deactivate user
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user: adminUser } = authResult;
    await dbConnect();

    const { id } = await params;
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        ApiResponse.error('User not found'),
        { status: 404 }
      );
    }

    // Check if user is last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return NextResponse.json(
          ApiResponse.error('Cannot deactivate the last admin user'),
          { status: 400 }
        );
      }
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    // Create audit log
    await AuditLog.create({
      user: adminUser._id,
      action: 'delete',
      entity: 'user',
      entityId: user._id,
      changes: { deactivated: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('User deactivated successfully')
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to deactivate user', error.message),
      { status: 500 }
    );
  }
}