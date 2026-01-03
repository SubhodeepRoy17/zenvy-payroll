export interface EmployeeCreateData {
  userId: string;
  employeeId: string;
  companyId: string;
  department: string;
  designation: string;
  reportingManagerId?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  joiningDate: Date;
  workLocation: string;
  bankDetails: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    branch: string;
    ifscCode: string;
  };
  panNumber: string;
  aadhaarNumber: string;
  uanNumber: string;
  esiNumber?: string;
  salaryStructureId: string;
}

export interface EmployeeUpdateData {
  department?: string;
  designation?: string;
  reportingManagerId?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'intern';
  confirmationDate?: Date;
  exitDate?: Date;
  workLocation?: string;
  bankDetails?: {
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    branch?: string;
    ifscCode?: string;
  };
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  esiNumber?: string;
  salaryStructureId?: string;
  isActive?: boolean;
}

export interface EmployeeResponse {
  id: string;
  employeeId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  company: {
    id: string;
    name: string;
  };
  department: string;
  designation: string;
  reportingManager?: {
    id: string;
    employeeId: string;
    name: string;
  };
  employmentType: string;
  joiningDate: Date;
  confirmationDate?: Date;
  exitDate?: Date;
  workLocation: string;
  bankDetails: {
    accountNumber: string;
    accountHolderName: string;
    bankName: string;
    branch: string;
    ifscCode: string;
  };
  panNumber: string;
  aadhaarNumber: string;
  uanNumber: string;
  esiNumber?: string;
  salaryStructure: {
    id: string;
    name: string;
  };
  leaves: {
    earnedLeaves: number;
    casualLeaves: number;
    sickLeaves: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Add these to your existing employee.ts file

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  department?: string;
  designation?: string;
  isActive?: boolean;
  employeeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedEmployeeResponse {
  employees: EmployeeResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}