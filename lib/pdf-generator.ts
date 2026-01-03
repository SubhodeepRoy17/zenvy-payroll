import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Payroll from '@/models/Payroll';
import Employee from '@/models/Employee';
import Company from '@/models/Company';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface SalarySlipData {
  employee: {
    name: string;
    employeeId: string;
    department: string;
    designation: string;
    bankAccount: string;
    bankName: string;
    ifscCode: string;
    panNumber: string;
    uanNumber: string;
  };
  company: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
    logo?: string;
  };
  payroll: {
    month: number;
    year: number;
    periodFrom: Date;
    periodTo: Date;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    basicSalary: number;
    earnings: Array<{ component: string; amount: number; isTaxable: boolean }>;
    deductions: Array<{ component: string; amount: number; isTaxable: boolean }>;
    grossEarnings: number;
    totalDeductions: number;
    netSalary: number;
    taxDeducted: number;
    pfContribution: number;
    esiContribution: number;
    status: string;
    paymentDate?: Date;
    paymentMethod?: string;
  };
  settings: {
    currency: string;
    currencySymbol: string;
  };
}

export class PDFGenerator {
  static async generateSalarySlip(payrollId: string): Promise<Buffer> {
    try {
      // Fetch data
      const payroll = await Payroll.findById(payrollId)
        .populate({
          path: 'employee',
          populate: {
            path: 'user',
            select: 'name',
          },
        })
        .populate({
          path: 'approvedBy',
          select: 'name',
        });

      if (!payroll) {
        throw new Error('Payroll not found');
      }

      const employee = await Employee.findById(payroll.employee._id)
        .populate('company');

      if (!employee) {
        throw new Error('Employee not found');
      }

      const company = await Company.findById(employee.company);

      // Prepare data
      const data: SalarySlipData = {
        employee: {
          name: employee.user.name,
          employeeId: employee.employeeId,
          department: employee.department,
          designation: employee.designation,
          bankAccount: employee.bankDetails.accountNumber,
          bankName: employee.bankDetails.bankName,
          ifscCode: employee.bankDetails.ifscCode,
          panNumber: employee.panNumber,
          uanNumber: employee.uanNumber,
        },
        company: {
          name: company?.name || '',
          address: company?.address || '',
          city: company?.city || '',
          state: company?.state || '',
          country: company?.country || '',
          postalCode: company?.postalCode || '',
          phone: company?.phone || '',
          email: company?.email || '',
          logo: company?.logo,
        },
        payroll: {
          month: payroll.month,
          year: payroll.year,
          periodFrom: payroll.periodFrom,
          periodTo: payroll.periodTo,
          totalWorkingDays: payroll.totalWorkingDays,
          presentDays: payroll.presentDays,
          absentDays: payroll.absentDays,
          leaveDays: payroll.leaveDays,
          basicSalary: payroll.basicSalary,
          earnings: payroll.earnings,
          deductions: payroll.deductions,
          grossEarnings: payroll.grossEarnings,
          totalDeductions: payroll.totalDeductions,
          netSalary: payroll.netSalary,
          taxDeducted: payroll.taxDeducted,
          pfContribution: payroll.pfContribution,
          esiContribution: payroll.esiContribution,
          status: payroll.status,
          paymentDate: payroll.paymentDate,
          paymentMethod: payroll.paymentMethod,
        },
        settings: {
          currency: company?.currency || 'INR',
          currencySymbol: company?.settings?.currencySymbol || '₹',
        },
      };

      // Generate PDF
      const pdf = this.createPDF(data);
      return Buffer.from(pdf.output('arraybuffer'));
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  // lib/pdf-generator.ts - Updated createPDF method
    private static createPDF(data: SalarySlipData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to safely format currency
    const formatCurrency = (amount: number) => {
        if (typeof amount !== 'number' || isNaN(amount)) {
        return `${data.settings.currencySymbol} 0.00`;
        }
        return `${data.settings.currencySymbol} ${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        })}`;
    };

    // Helper function to get month name
    const getMonthName = (month: number) => {
        if (!month || month < 1 || month > 12) return 'Invalid Month';
        return new Date(data.payroll.year, month - 1, 1).toLocaleString('default', { month: 'long' });
    };

    // Helper function to safely format text
    const safeText = (text: any, defaultValue: string = ''): string => {
        if (text === null || text === undefined) return defaultValue;
        return String(text).trim() || defaultValue;
    };

    // Helper function to safely format date
    const safeDate = (date: any): Date => {
        if (!date) return new Date();
        if (date instanceof Date) return date;
        try {
        return new Date(date);
        } catch {
        return new Date();
        }
    };

    // Header - Company Info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(data.company.name, 'Company Name'), margin, margin);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = margin + 8;
    
    const companyAddress = [
        safeText(data.company.address, 'Address not specified'),
        `${safeText(data.company.city, 'City')}, ${safeText(data.company.state, 'State')} - ${safeText(data.company.postalCode, 'Postal Code')}`,
        safeText(data.company.country, 'Country'),
        `Phone: ${safeText(data.company.phone, 'N/A')} | Email: ${safeText(data.company.email, 'N/A')}`,
    ];

    companyAddress.forEach(line => {
        if (line && line.trim()) {
        doc.text(line, margin, yPos);
        yPos += 5;
        }
    });

    // Title
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SALARY SLIP', pageWidth / 2, yPos, { align: 'center' });

    // Period
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const monthName = getMonthName(data.payroll.month);
    const periodText = `For the month of ${monthName} ${safeText(data.payroll.year)}`;
    doc.text(periodText, pageWidth / 2, yPos, { align: 'center' });

    // Employee Details
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Details', margin, yPos);

    yPos += 7;
    const employeeDetails = [
        [`Name:`, safeText(data.employee.name, 'Not specified')],
        [`Employee ID:`, safeText(data.employee.employeeId, 'N/A')],
        [`Department:`, safeText(data.employee.department, 'Not specified')],
        [`Designation:`, safeText(data.employee.designation, 'Employee')],
        [`Bank Account:`, `${safeText(data.employee.bankAccount, 'N/A')} (${safeText(data.employee.bankName, 'Bank not specified')})`],
        [`IFSC Code:`, safeText(data.employee.ifscCode, 'N/A')],
        [`PAN:`, safeText(data.employee.panNumber, 'N/A')],
        [`UAN:`, safeText(data.employee.uanNumber, 'N/A')],
    ];

    doc.setFont('helvetica', 'normal');
    employeeDetails.forEach(([label, value]) => {
        doc.text(safeText(label), margin, yPos);
        doc.text(safeText(value), margin + 40, yPos);
        yPos += 6;
    });

    // Attendance Summary
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Summary', margin, yPos);

    yPos += 7;
    const attendanceDetails = [
        ['Total Working Days:', safeText(data.payroll.totalWorkingDays)],
        ['Present Days:', safeText(data.payroll.presentDays)],
        ['Absent Days:', safeText(data.payroll.absentDays)],
        ['Leave Days:', safeText(data.payroll.leaveDays)],
    ];

    doc.setFont('helvetica', 'normal');
    attendanceDetails.forEach(([label, value]) => {
        doc.text(safeText(label), margin, yPos);
        doc.text(safeText(value), margin + 50, yPos);
        yPos += 6;
    });

    // Salary Breakdown Table - Earnings
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Earnings', margin, yPos);

    // Safely prepare earnings data
    const earningsTableData: string[][] = [];
    
    // Add Basic Salary as first row
    earningsTableData.push([
        'Basic Salary', 
        formatCurrency(Number(data.payroll.basicSalary) || 0)
    ]);
    
    // Add other earnings
    if (Array.isArray(data.payroll.earnings)) {
        data.payroll.earnings.forEach(earning => {
        if (earning && earning.component && typeof earning.amount === 'number') {
            earningsTableData.push([
            safeText(earning.component),
            formatCurrency(earning.amount)
            ]);
        }
        });
    }
    
    // Add Gross Earnings as last row
    earningsTableData.push([
        'Total Earnings', 
        formatCurrency(Number(data.payroll.grossEarnings) || 0)
    ]);

    if (earningsTableData.length > 0) {
        (doc as any).autoTable({
        startY: yPos + 5,
        head: [['Description', 'Amount']],
        body: earningsTableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        columnStyles: {
            0: { cellWidth: contentWidth * 0.7 },
            1: { cellWidth: contentWidth * 0.3, halign: 'right' },
        },
        });
    }

    // Get autoTable end position or set default
    const earningsEndY = (doc as any).lastAutoTable?.finalY || yPos + 5 + (earningsTableData.length * 10);

    // Salary Breakdown Table - Deductions
    yPos = earningsEndY + 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Deductions', margin, yPos);

    const deductionsTableData: string[][] = [];
    
    // Add deductions
    if (Array.isArray(data.payroll.deductions)) {
        data.payroll.deductions.forEach(deduction => {
        if (deduction && deduction.component && typeof deduction.amount === 'number') {
            deductionsTableData.push([
            safeText(deduction.component),
            formatCurrency(deduction.amount)
            ]);
        }
        });
    }

    // Add total deductions row
    deductionsTableData.push([
        'Total Deductions', 
        formatCurrency(Number(data.payroll.totalDeductions) || 0)
    ]);

    if (deductionsTableData.length > 0) {
        (doc as any).autoTable({
        startY: yPos + 5,
        head: [['Description', 'Amount']],
        body: deductionsTableData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        columnStyles: {
            0: { cellWidth: contentWidth * 0.7 },
            1: { cellWidth: contentWidth * 0.3, halign: 'right' },
        },
        });
    }

    const deductionsEndY = (doc as any).lastAutoTable?.finalY || yPos + 5 + (deductionsTableData.length * 10);

    // Net Salary
    yPos = deductionsEndY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NET SALARY PAYABLE:', margin, yPos);
    doc.text(formatCurrency(Number(data.payroll.netSalary) || 0), pageWidth - margin, yPos, { align: 'right' });

    // Payment Details
    if (data.payroll.paymentDate) {
        yPos += 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Details', margin, yPos);

        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const paymentDate = safeDate(data.payroll.paymentDate);
        const paymentDetails = [
        ['Payment Status:', safeText(data.payroll.status?.toUpperCase(), 'PENDING')],
        ['Payment Date:', paymentDate.toLocaleDateString('en-IN')],
        ['Payment Method:', safeText(data.payroll.paymentMethod, 'N/A')],
        ];

        paymentDetails.forEach(([label, value]) => {
        doc.text(safeText(label), margin, yPos);
        doc.text(safeText(value), margin + 40, yPos);
        yPos += 6;
        });
    }

    // Footer
    const footerY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated document and does not require a signature.', 
        pageWidth / 2, footerY, { align: 'center' });
    
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 
        pageWidth / 2, footerY + 5, { align: 'center' });

    return doc;
    }

  static async generateMultipleSalarySlips(payrollIds: string[]): Promise<Buffer> {
    const { PDFDocument } = await import('pdf-lib');
    const pdfs: Buffer[] = [];
    
    for (let i = 0; i < payrollIds.length; i++) {
      const slipData = await PDFGenerator.generateSalarySlip(payrollIds[i]);
      pdfs.push(Buffer.from(slipData));
    }
    
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfBuffer of pdfs) {
      const pdf = await PDFDocument.load(pdfBuffer);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    
    return Buffer.from(await mergedPdf.save());
  }
}