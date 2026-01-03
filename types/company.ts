export interface CompanyCreateData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  taxId: string;
  currency: string;
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  logo?: string;
  settings?: {
    workingDaysPerWeek?: number;
    workingHoursPerDay?: number;
    overtimeRate?: number;
    leaveEncashmentRate?: number;
    taxDeductionPercentage?: number;
    pfDeductionPercentage?: number;
    esiDeductionPercentage?: number;
    probationPeriodMonths?: number;
    noticePeriodDays?: number;
    paymentDate?: number;
    currencySymbol?: string;
  };
}

export interface CompanyUpdateData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  currency?: string;
  fiscalYearStart?: Date;
  fiscalYearEnd?: Date;
  logo?: string;
  settings?: {
    workingDaysPerWeek?: number;
    workingHoursPerDay?: number;
    overtimeRate?: number;
    leaveEncashmentRate?: number;
    taxDeductionPercentage?: number;
    pfDeductionPercentage?: number;
    esiDeductionPercentage?: number;
    probationPeriodMonths?: number;
    noticePeriodDays?: number;
    paymentDate?: number;
    currencySymbol?: string;
  };
  isActive?: boolean;
}

export interface CompanyResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website?: string;
  taxId: string;
  currency: string;
  fiscalYearStart: Date;
  fiscalYearEnd: Date;
  logo?: string;
  settings: {
    workingDaysPerWeek: number;
    workingHoursPerDay: number;
    overtimeRate: number;
    leaveEncashmentRate: number;
    taxDeductionPercentage: number;
    pfDeductionPercentage: number;
    esiDeductionPercentage: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}