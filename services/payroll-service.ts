// ./services/payroll-service.ts
import { ApiResponse } from '@/lib/api-response';
import { 
  PayrollResponse, 
  PayrollSummaryResponse, 
  PayrollRunResponse,
  PayrollRunData 
} from '@/types/payroll';

export interface PayrollFilters {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  status?: string;
  employeeId?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PayrollUpdateData {
  status?: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  remarks?: string;
  isLocked?: boolean;
}

export class PayrollService {
  static async getPayrolls(filters: PayrollFilters = {}): Promise<ApiResponse<{
    payrolls: PayrollResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/payroll?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payrolls');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      throw error;
    }
  }

  static async getPayrollById(id: string): Promise<ApiResponse<{ payroll: PayrollResponse }>> {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payroll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payroll:', error);
      throw error;
    }
  }

  static async createPayroll(data: { employeeId: string; month: number; year: number }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payroll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  }

  static async runPayroll(data: PayrollRunData): Promise<ApiResponse<PayrollRunResponse>> {
    try {
      const response = await fetch('/api/payroll/run', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run payroll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error running payroll:', error);
      throw error;
    }
  }

  static async approvePayroll(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/payroll/${id}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve payroll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving payroll:', error);
      throw error;
    }
  }

  static async markAsPaid(id: string, data: { paymentMethod: string; transactionId?: string; remarks?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/payroll/${id}/pay`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark payroll as paid');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      throw error;
    }
  }

  static async updatePayroll(id: string, data: PayrollUpdateData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payroll');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  }

  static async getPayrollSummary(month?: number, year?: number): Promise<ApiResponse<PayrollSummaryResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (month) queryParams.append('month', month.toString());
      if (year) queryParams.append('year', year.toString());

      const response = await fetch(`/api/payroll/summary?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payroll summary');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payroll summary:', error);
      throw error;
    }
  }
    static async getPayrollRuns(year?: number): Promise<ApiResponse<{
    runs: Array<{
        id: string;
        month: number;
        year: number;
        totalNetSalary: number;
        employeeCount: number;
        periodFrom: Date;
        periodTo: Date;
        status: string;
        processedAt: Date;
    }>;
    summary: {
        activeCount: number;
        completedCount: number;
        totalAmount: number;
        year: number;
    };
    }>> {
    try {
        const queryParams = new URLSearchParams();
        if (year) queryParams.append('year', year.toString());

        const response = await fetch(`/api/payroll/runs?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        });

        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payroll runs');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching payroll runs:', error);
        throw error;
    }
    }

  static async getEmployeePayrolls(employeeId: string, filters: { page?: number; limit?: number; year?: number; status?: string } = {}): Promise<ApiResponse<{
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
    salarySlips: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/payroll/employee/${employeeId}?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch employee payrolls');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee payrolls:', error);
      throw error;
    }
  }
}