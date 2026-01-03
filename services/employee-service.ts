import { ApiResponse } from '@/lib/api-response';
import { EmployeeResponse, EmployeeFilters, PaginatedEmployeeResponse } from '@/types/employee';

export interface EmployeeCreateFormData {
  name: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  joiningDate: string;
  workLocation: string;
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  bankDetails?: {
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    branch?: string;
    ifscCode?: string;
  };
}

export class EmployeeService {
  static async getEmployees(filters: EmployeeFilters = {}): Promise<ApiResponse<PaginatedEmployeeResponse>> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/employees?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch employees');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  static async getEmployeeById(id: string): Promise<ApiResponse<EmployeeResponse>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee:', error);
      throw error;
    }
  }

  static async createEmployee(data: EmployeeCreateFormData): Promise<ApiResponse<any>> {
    try {
        // Use the create-with-user endpoint instead
        const response = await fetch('/api/employees/create-with-user', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        });

        if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employee');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating employee:', error);
        throw error;
    }
    }

  static async updateEmployee(id: string, data: any): Promise<ApiResponse<EmployeeResponse>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  static async deactivateEmployee(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deactivate employee');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      throw error;
    }
  }

  static async getDashboardData(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/employees/dashboard', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  static async clockIn(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clock-in' }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error clocking in:', error);
      throw error;
    }
  }

  static async clockOut(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clock-out' }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error clocking out:', error);
      throw error;
    }
  }

  static async getTodayAttendance(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/attendance/today', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      throw error;
    }
  }
}

export type { EmployeeFilters };
