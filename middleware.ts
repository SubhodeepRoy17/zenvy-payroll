export const runtime = 'nodejs'; // Add this line at the top

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Protected routes by role
const protectedRoutes: Record<string, string[]> = {
  '/dashboard': ['admin', 'hr'],
  '/employees': ['admin', 'hr'],
  '/payroll': ['admin', 'hr'],
  '/salary-slips': ['admin', 'hr'],
  '/employee-dashboard': ['employee'],
  '/employee-salary-slips': ['employee'],
  '/settings': ['admin', 'hr'],
  '/employee-settings': ['employee'],
};

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/', '/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Debug logging
  console.log(`🛡️ Middleware - Path: ${pathname}`);
  
  const token = request.cookies.get('token')?.value;
  console.log(`🛡️ Middleware - Token present: ${!!token}`);

  // Check if route is public
  if (publicRoutes.includes(pathname)) {
    console.log('🛡️ Middleware - Public route, allowing');
    return NextResponse.next();
  }

  // Check if route is protected
  const routeRoles = protectedRoutes[pathname];
  
  if (routeRoles) {
    console.log(`🛡️ Middleware - Protected route, required roles: ${routeRoles}`);
    
    if (!token) {
      console.log('🛡️ Middleware - No token, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify token
      console.log('🛡️ Middleware - Verifying token...');
      const decoded = verifyToken(token);
      console.log(`🛡️ Middleware - Token verified for: ${decoded.email}, role: ${decoded.role}`);
      
      // Check if user has required role
      if (!routeRoles.includes(decoded.role)) {
        console.log(`🛡️ Middleware - Role mismatch. User: ${decoded.role}, Required: ${routeRoles}`);
        const redirectPath = decoded.role === 'employee' ? '/employee-dashboard' : '/dashboard';
        const redirectUrl = new URL(redirectPath, request.url);
        return NextResponse.redirect(redirectUrl);
      }

      console.log('🛡️ Middleware - Access granted');
      
      // Add user info to headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-role', decoded.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error('🛡️ Middleware - Invalid token:', error);
      // Invalid token, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  console.log('🛡️ Middleware - Route not in protected list, allowing');
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};