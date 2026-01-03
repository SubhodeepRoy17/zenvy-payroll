export interface SalarySlipResponse {
  id: string;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
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
  earnings: Array<{
    component: string;
    amount: number;
    isTaxable: boolean;
  }>;
  deductions: Array<{
    component: string;
    amount: number;
    isTaxable: boolean;
  }>;
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
    email: string;
  };
  approvedAt?: Date;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeSalarySlipsResponse {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    department: string;
    designation: string;
  };
  summary: {
    totalSlips: number;
    totalNetSalary: number;
    years: number[];
    months: string[];
  };
  salarySlips: Array<{
    id: string;
    month: number;
    year: number;
    periodFrom: Date;
    periodTo: Date;
    basicSalary: number;
    grossEarnings: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paymentDate?: Date;
    paymentMethod?: string;
    approvedBy?: {
      name: string;
    };
    approvedAt?: Date;
    isLocked: boolean;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface GenerateSalarySlipsData {
  month: number;
  year: number;
  employeeIds?: string[];
}

export interface GenerateSalarySlipsResponse {
  summary: {
    month: number;
    year: number;
    totalEmployees: number;
    totalNetSalary: number;
  };
  salarySlips: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    netSalary: number;
    status: string;
  }>;
}