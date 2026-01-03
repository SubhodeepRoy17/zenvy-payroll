import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import AuditLog from '@/models/AuditLog';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: any = {};
    
    if (action && action !== 'all') query.action = action;
    if (entity && entity !== 'all') query.entity = entity;
    if (userId) query.user = userId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    if (search) {
      query.$or = [
        { 'changes.name': { $regex: search, $options: 'i' } },
        { 'changes.email': { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(query);

    // Get audit logs with user information
    const logs = await AuditLog.find(query)
      .populate({
        path: 'user',
        select: 'name email role',
      })
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean();

    // Format response
    const formattedLogs = logs.map(log => ({
      id: log._id.toString(),
      timestamp: log.timestamp,
      user: log.user ? {
        id: log.user._id.toString(),
        name: log.user.name,
        email: log.user.email,
        role: log.user.role,
      } : {
        id: '',
        name: 'Unknown User',
        email: '',
        role: 'unknown',
      },
      action: log.action,
      entity: log.entity,
      entityId: log.entityId?.toString(),
      changes: log.changes,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    return NextResponse.json(
      ApiResponse.success('Audit logs retrieved successfully', {
        logs: formattedLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to retrieve audit logs', error.message),
      { status: 500 }
    );
  }
}

// DELETE /api/admin/audit-logs - Clear old audit logs
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireRole(request, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    // Delete logs older than 90 days (keep for 3 months)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });

    // Log the cleanup action
    await AuditLog.create({
      user: user._id,
      action: 'delete',
      entity: 'audit-log',
      changes: {
        olderThan: ninetyDaysAgo,
        deletedCount: result.deletedCount,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success(`Cleared ${result.deletedCount} old audit logs`)
    );
  } catch (error: any) {
    console.error('Clear audit logs error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to clear audit logs', error.message),
      { status: 500 }
    );
  }
}