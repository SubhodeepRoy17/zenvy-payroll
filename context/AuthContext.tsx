// ./context/AuthContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { AuthState, User } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: string
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  // 🔐 Check logged-in user using cookie
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      const data = await res.json();
      console.log('🔍 Check auth response:', data);

      if (data.success) {
        // Transform the user data to include employeeId, position, department
        const userData = transformUserData(data.data.user);
        
        setAuthState({
          user: userData,
          token: null,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.log('🔍 Not authenticated:', error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Helper function to transform user data with employee information
  const transformUserData = (user: any): User => {
    // If user already has employeeId, use it
    if (user.employeeId) {
      return {
        ...user,
        employeeId: user.employeeId,
        position: user.position || user.designation || 'Employee',
        department: user.department || 'Not specified',
      };
    }

    // If user has an employee object, extract data from it
    if (user.employee) {
      return {
        ...user,
        employeeId: user.employee.employeeId || user.employee.id || user.id,
        position: user.employee.designation || user.position || 'Employee',
        department: user.employee.department || user.department || 'Not specified',
      };
    }

    // Default values
    return {
      ...user,
      employeeId: user.id, // Fallback to user ID
      position: user.position || user.role || 'Employee',
      department: user.department || 'Not specified',
    };
  };

  // 🔑 Login - FIXED: Returns success status
  const login = async (email: string, password: string, role: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('🔐 Attempting login for:', { email, role });
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        credentials: 'include',
      });

      const data = await res.json();
      console.log('🔐 Login API response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Transform user data
      const userData = transformUserData(data.data.user);

      // Update auth state
      setAuthState({
        user: userData,
        token: null,
        isLoading: false,
        isAuthenticated: true,
      });

      console.log('✅ Login state updated');
      return data.success; // Return success status
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  };

  // 🚪 Logout
  const logout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  // 📝 Register
  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: string
  ) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          role,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      // Transform user data
      const userData = transformUserData(data.data.user);

      setAuthState({
        user: userData,
        token: null,
        isLoading: false,
        isAuthenticated: true,
      });

      return data.success;
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}