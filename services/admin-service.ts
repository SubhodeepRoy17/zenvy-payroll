import { ApiResponse } from '@/lib/api-response';

export interface SystemStats {
  companies: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
    byRole: {
      admin: number;
      hr: number;
      employee: number;
    };
  };
  employees: {
    total: number;
    active: number;
    byType: {
      fullTime: number;
      partTime: number;
      contract: number;
      intern: number;
    };
  };
  attendance: {
    today: number;
    monthlyAverage: number;
  };
  payroll: {
    total: number;
    pending: number;
    completed: number;
  };
  system: {
    health: {
      database: string;
      api: string;
      storage: string;
      uptime: string;
      lastBackup: Date;
    };
    recentLogins: number;
    activeSessions: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr' | 'employee';
  department?: string;
  position?: string;
  isActive?: boolean;
}

export class AdminService {
  static async getSystemStats(): Promise<ApiResponse<{ stats: SystemStats }>> {
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  }

  static async getUsers(filters: UserFilters = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async createUser(data: CreateUserData): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateUser(id: string, data: Partial<CreateUserData>): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async getAuditLogs(filters: any = {}): Promise<ApiResponse<any>> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  static async getUserById(id: string): Promise<ApiResponse<any>> {
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        });

        if (!response.ok) {
        throw new Error('Failed to fetch user');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
    }

  static async clearAuditLogs(): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear audit logs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing audit logs:', error);
      throw error;
    }
  }
}