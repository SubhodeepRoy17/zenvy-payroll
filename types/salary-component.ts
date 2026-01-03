export interface SalaryComponentCreateData {
  name: string;
  type: 'earning' | 'deduction';
  category: 'basic' | 'allowance' | 'reimbursement' | 'bonus' | 'tax' | 'provident-fund' | 'esi' | 'loan' | 'other';
  calculationType: 'fixed' | 'percentage' | 'formula';
  value: number;
  formula?: string;
  percentageOf?: string;
  isTaxable?: boolean;
  isRecurring?: boolean;
  description?: string;
  companyId: string;
}

export interface SalaryComponentUpdateData {
  name?: string;
  type?: 'earning' | 'deduction';
  category?: 'basic' | 'allowance' | 'reimbursement' | 'bonus' | 'tax' | 'provident-fund' | 'esi' | 'loan' | 'other';
  calculationType?: 'fixed' | 'percentage' | 'formula';
  value?: number;
  formula?: string;
  percentageOf?: string;
  isTaxable?: boolean;
  isRecurring?: boolean;
  description?: string;
  isActive?: boolean;
}

export interface SalaryComponentResponse {
  id: string;
  name: string;
  type: string;
  category: string;
  calculationType: string;
  value: number;
  formula?: string;
  percentageOf?: string;
  isTaxable: boolean;
  isRecurring: boolean;
  description?: string;
  company: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaryComponentsByCompanyResponse {
  company: {
    id: string;
    name: string;
  };
  salaryComponents: SalaryComponentResponse[];
  groupedComponents: {
    earnings: SalaryComponentResponse[];
    deductions: SalaryComponentResponse[];
  };
  totals: {
    earnings: number;
    deductions: number;
    total: number;
  };
}