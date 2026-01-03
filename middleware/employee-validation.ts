import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-response';

export function validateEmployeeCreate(data: any): NextResponse | null {
  // Required fields validation
  const requiredFields = [
    'userId', 'employeeId', 'companyId', 'department', 
    'designation', 'employmentType', 'joiningDate', 'workLocation',
    'bankDetails', 'panNumber', 'aadhaarNumber', 'uanNumber', 'salaryStructureId'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      return NextResponse.json(
        ApiResponse.error(`${field} is required`),
        { status: 400 }
      );
    }
  }

  // Bank details validation
  if (!data.bankDetails || typeof data.bankDetails !== 'object') {
    return NextResponse.json(
      ApiResponse.error('Bank details are required'),
      { status: 400 }
    );
  }

  const bankFields = ['accountNumber', 'accountHolderName', 'bankName', 'branch', 'ifscCode'];
  for (const field of bankFields) {
    if (!data.bankDetails[field]) {
      return NextResponse.json(
        ApiResponse.error(`Bank ${field} is required`),
        { status: 400 }
      );
    }
  }

  // PAN validation (10 character alphanumeric)
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(data.panNumber.toUpperCase())) {
    return NextResponse.json(
      ApiResponse.error('Invalid PAN number format'),
      { status: 400 }
    );
  }

  // Aadhaar validation (12 digits)
  const aadhaarRegex = /^\d{12}$/;
  if (!aadhaarRegex.test(data.aadhaarNumber)) {
    return NextResponse.json(
      ApiResponse.error('Invalid Aadhaar number (must be 12 digits)'),
      { status: 400 }
    );
  }

  // IFSC validation (11 characters)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(data.bankDetails.ifscCode.toUpperCase())) {
    return NextResponse.json(
      ApiResponse.error('Invalid IFSC code format'),
      { status: 400 }
    );
  }

  // Employee ID validation
  if (data.employeeId.length < 3 || data.employeeId.length > 20) {
    return NextResponse.json(
      ApiResponse.error('Employee ID must be between 3 and 20 characters'),
      { status: 400 }
    );
  }

  return null;
}