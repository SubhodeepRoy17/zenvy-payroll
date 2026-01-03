import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/dbConnect';
import { ApiResponse } from '@/lib/api-response';
import { requireRole } from '@/middleware/auth';
import Payroll from '@/models/Payroll';
import Company from '@/models/Company';
import AuditLog from '@/models/AuditLog';
import { PDFGenerator } from '@/lib/pdf-generator';

// POST /api/salary-slips/bulk/download - Download multiple salary slips as ZIP
export async function POST(request: NextRequest) {
  try {
    // Only admin/hr can download bulk salary slips
    const authResult = await requireRole(request, ['admin', 'hr']);
    if (authResult instanceof NextResponse) return authResult;

    const { user } = authResult;
    await dbConnect();

    const data = await request.json();

    // Validate required fields
    if (!data.payrollIds || !Array.isArray(data.payrollIds) || data.payrollIds.length === 0) {
      return NextResponse.json(
        ApiResponse.error('Payroll IDs array is required'),
        { status: 400 }
      );
    }

    // Limit number of slips to prevent server overload
    if (data.payrollIds.length > 50) {
      return NextResponse.json(
        ApiResponse.error('Cannot download more than 50 salary slips at once'),
        { status: 400 }
      );
    }

    // Get company for filename
    const company = await Company.findOne({ isActive: true });
    const companyName = company?.name?.replace(/\s+/g, '_') || 'Company';

    // Generate combined PDF
    const pdfBuffer = await PDFGenerator.generateMultipleSalarySlips(data.payrollIds);

    // Create audit log
    await AuditLog.create({
      user: user._id,
      action: 'read',
      entity: 'salary-slip',
      changes: {
        bulkDownload: true,
        count: data.payrollIds.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
    });

    // Create response with PDF
    const response = new NextResponse(new Uint8Array(pdfBuffer));
    response.headers.set('Content-Type', 'application/pdf');
    
    const fileName = `${companyName}_Salary_Slips_${new Date().toISOString().split('T')[0]}.pdf`;
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);

    return response;
  } catch (error: any) {
    console.error('Bulk download salary slips error:', error);
    return NextResponse.json(
      ApiResponse.error('Failed to generate bulk salary slips', error.message),
      { status: 500 }
    );
  }
}