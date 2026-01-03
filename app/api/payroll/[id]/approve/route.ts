import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import AuditLog from '@/models/AuditLog';

// PUT /api/payroll/[id]/approve - Approve payroll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only admin/hr can approve payroll
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;

    // Find payroll
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return NextResponse.json(
        ApiResponse.error('Payroll not found'),
        { status: 404 }
      );
    }

    // Check current status
    if (payroll.status === 'approved') {
      return NextResponse.json(
        ApiResponse.error('Payroll is already approved'),
        { status: 400 }
      );
    }

    if (payroll.status !== 'calculated') {
      return NextResponse.json(
        ApiResponse.error('Only calculated payroll can be approved'),
        { status: 400 }
      );
    }

    // Update payroll status
    payroll.status = 'approved';
    payroll.approvedBy = user._id;
    payroll.approvedAt = new Date();
    await payroll.save();

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'approve',
      entity: 'payroll',
      entityId: payroll._id,
      changes: { status: 'approved' },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll approved successfully', {
        payroll: {
          id: payroll._id.toString(),
          status: payroll.status,
          approvedBy: user.name,
          approvedAt: payroll.approvedAt,
        },
      })
    );
  } catch (error: any) {
    console.error('Approve payroll error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to approve payroll', error.message),
      { status: 500 }
    );
  }
}