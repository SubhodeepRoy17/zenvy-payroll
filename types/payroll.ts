export interface PayrollRunData {
  force: any;
  month: number;
  year: number;
  periodFrom: Date;
  periodTo: Date;
  employeeIds?: string[]; // If empty, process all active employees
}

export interface PayrollCalculateData {
  employeeId: string;
  month: number;
  year: number;
  periodFrom: Date;
  periodTo: Date;
}

export interface PayrollComponent {
  component: string;
  amount: number;
  isTaxable: boolean;
}

export interface PayrollResponse {
  id: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
  };
  month: number;
  year: number;
  periodFrom: Date;
  periodTo: Date;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  basicSalary: number;
  earnings: PayrollComponent[];
  deductions: PayrollComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  taxDeducted: number;
  pfContribution: number;
  esiContribution: number;
  status: string;
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollSummary {
  month: number;
  year: number;
  totalEmployees: number;
  totalNetSalary: number;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalTax: number;
  totalPF: number;
  totalESI: number;
  statusBreakdown: {
    draft: number;
    calculated: number;
    approved: number;
    paid: number;
    cancelled: number;
  };
}

export interface PayrollRunResponse {
  summary: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  period: {
    month: number;
    year: number;
    from: Date;
    to: Date;
  };
  results: Array<{
    employeeId: string;
    employeeName: string;
    status: 'success' | 'failed' | 'skipped';
    netSalary?: number;
    error?: string;
    reason?: string;
  }>;
}

export interface PayrollSummaryResponse {
  summary: PayrollSummary & {
    formatted: {
      totalNetSalary: string;
      totalGrossEarnings: string;
      totalDeductions: string;
      totalTax: string;
      totalPF: string;
      totalESI: string;
    };
  };
  company: {
    id: string;
    name: string;
    currency: string;
    currencySymbol: string;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
  };
}

export interface PayrollRunResult {
  employeeId: string;
  employeeName: string;
  status: 'success' | 'failed' | 'skipped';
  netSalary?: number;
  error?: string;
  reason?: string;
}

export interface PayrollBulkResponse {
  summary: {
    total: number;
    success: number;
    failed: number;
    skipped: number;
  };
  period: {
    month: number;
    year: number;
    from: Date;
    to: Date;
  };
  results: PayrollRunResult[];
}