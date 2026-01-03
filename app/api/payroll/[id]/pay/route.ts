import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import AuditLog from '@/models/AuditLog';

// PUT /api/payroll/[id]/pay - Mark payroll as paid
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only admin/hr can mark payroll as paid
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;
    const data = await request.json();

    // Find payroll
    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return NextResponse.json(
        ApiResponse.error('Payroll not found'),
        { status: 404 }
      );
    }

    // Check current status
    if (payroll.status === 'paid') {
      return NextResponse.json(
        ApiResponse.error('Payroll is already marked as paid'),
        { status: 400 }
      );
    }

    if (payroll.status !== 'approved') {
      return NextResponse.json(
        ApiResponse.error('Only approved payroll can be marked as paid'),
        { status: 400 }
      );
    }

    // Validate payment details
    if (!data.paymentMethod) {
      return NextResponse.json(
        ApiResponse.error('Payment method is required'),
        { status: 400 }
      );
    }

    // Update payroll
    payroll.status = 'paid';
    payroll.paymentDate = new Date();
    payroll.paymentMethod = data.paymentMethod;
    payroll.transactionId = data.transactionId;
    payroll.remarks = data.remarks;
    await payroll.save();

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'pay',
      entity: 'payroll',
      entityId: payroll._id,
      changes: {
        status: 'paid',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        paymentDate: payroll.paymentDate,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      ApiResponse.success('Payroll marked as paid successfully', {
        payroll: {
          id: payroll._id.toString(),
          status: payroll.status,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod,
          transactionId: payroll.transactionId,
        },
      })
    );
  } catch (error: any) {
    console.error('Mark payroll as paid error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to mark payroll as paid', error.message),
      { status: 500 }
    );
  }
}