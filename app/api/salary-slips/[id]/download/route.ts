import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireAuth, requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import AuditLog from '@/models/AuditLog';
import { PDFGenerator } from '@/lib/pdf-generator';

// GET /api/salary-slips/[id]/download - Download salary slip PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const { id } = await params;

    // Find payroll (salary slip)
    const salarySlip = await Payroll.findById(id);
    if (!salarySlip) {
      return NextResponse.json(
        ApiResponse.error('Salary slip not found'),
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user._id });
      if (!userEmployee || userEmployee._id.toString() !== salarySlip.employee.toString()) {
        return NextResponse.json(
          ApiResponse.error('Access denied'),
          { status: 403 }
        );
      }
      
      // Employees can only download approved/paid salary slips
      if (!['approved', 'paid'].includes(salarySlip.status)) {
        return NextResponse.json(
          ApiResponse.error('Salary slip not available for download'),
          { status: 403 }
        );
      }
    }

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateSalarySlip(id);

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'salary-slip',
      entityId: salarySlip._id,
      changes: { downloaded: true },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // Create response with PDF
    const response = new NextResponse(new Uint8Array(pdfBuffer));
    response.headers.set('Content-Type', 'application/pdf');
    
    // Get employee name for filename
    const employee = await Employee.findById(salarySlip.employee)
      .populate('user', 'name');
    
    const fileName = `Salary_Slip_${employee?.user?.name || 'Employee'}_${salarySlip.month}_${salarySlip.year}.pdf`;
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return response;
  } catch (error: any) {
    console.error('Download salary slip error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to generate salary slip PDF', error.message),
      { status: 500 }
    );
  }
}