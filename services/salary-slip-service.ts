// ./services/salary-slip-service.ts
import { ApiResponse } from '@/lib/api-response';

export interface SalarySlipFilters {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  status?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface SalarySlipGenerateData {
  month: number;
  year: number;
  employeeIds?: string[];
}

export class SalarySlipService {
  static async getSalarySlips(filters: SalarySlipFilters = {}): Promise<ApiResponse<{
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

      const response = await fetch(`/api/salary-slips?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch salary slips');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching salary slips:', error);
      throw error;
    }
  }

  static async getSalarySlipById(id: string): Promise<ApiResponse<{ salarySlip: any }>> {
    try {
      const response = await fetch(`/api/salary-slips/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch salary slip');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching salary slip:', error);
      throw error;
    }
  }

  static async generateSalarySlips(data: SalarySlipGenerateData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/salary-slips', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate salary slips');
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating salary slips:', error);
      throw error;
    }
  }

  static async downloadSalarySlip(id: string): Promise<void> {
    try {
        console.log(`🔍 Downloading salary slip for ID: ${id}`);
        
        // First, let's try to get the salary slip details to see if it exists
        try {
        const slipResponse = await SalarySlipService.getSalarySlipById(id);
        console.log('✅ Salary slip found:', slipResponse.data?.salarySlip?.employee?.name);
        } catch (slipError) {
        console.log('⚠️ Salary slip not found via API, trying fallback...');
        }

        const response = await fetch(`/api/salary-slips/${id}/download`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/pdf',
        },
        });

        if (!response.ok) {
        // Check if it's a server error (500) or not found (404)
        if (response.status === 500) {
            throw new Error('PDF generation failed. Please check if the salary slip data is complete.');
        } else if (response.status === 404) {
            // Try the payroll download endpoint as fallback
            console.log('🔄 Trying payroll download endpoint...');
            const payrollResponse = await fetch(`/api/payroll/${id}/download`, {
            method: 'GET',
            credentials: 'include',
            });
            
            if (!payrollResponse.ok) {
            const error = await payrollResponse.json().catch(() => ({ message: 'Failed to download salary slip' }));
            throw new Error(error.message || 'Failed to download salary slip');
            }
            
            // Use payroll response
            const blob = await payrollResponse.blob();
            await this.saveFile(blob, `Salary_Slip_${id}.pdf`);
            return;
        }
        
        const error = await response.json().catch(() => ({ message: 'Failed to download salary slip' }));
        throw new Error(error.message || 'Failed to download salary slip');
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`📄 Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/pdf')) {
        // Create blob and download
        const blob = await response.blob();
        await this.saveFile(blob, `Salary_Slip_${id}.pdf`);
        console.log('✅ PDF downloaded successfully');
        } else {
        // Might be JSON error response
        const error = await response.json();
        throw new Error(error.message || 'Failed to download salary slip');
        }
    } catch (error: any) {
        console.error('❌ Error downloading salary slip:', error);
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Failed to download salary slip';
        
        if (errorMessage.includes('Invalid arguments passed to jsPDF.text')) {
        errorMessage = 'Salary slip data is incomplete. Please ensure all employee and payroll information is filled.';
        } else if (errorMessage.includes('PDF generation failed')) {
        errorMessage = 'Failed to generate PDF. Please check the salary slip data.';
        }
        
        throw new Error(errorMessage);
    }
    }

    private static async saveFile(blob: Blob, defaultFilename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    }

  static async getEmployeeSalarySlips(employeeId: string, filters: { page?: number; limit?: number; year?: number; status?: string } = {}): Promise<ApiResponse<{
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

      const response = await fetch(`/api/salary-slips/employee/${employeeId}?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch employee salary slips');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee salary slips:', error);
      throw error;
    }
  }
}