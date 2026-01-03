import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';

export async function requireAuth(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  console.log('🔐 requireAuth - Token present:', !!token);
  console.log('🔐 requireAuth - Cookie string:', request.cookies.toString());

  if (!token) {
    console.log('❌ requireAuth - No token found');
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    // Verify token
    console.log('🔐 requireAuth - Verifying token...');
    const decoded = verifyToken(token);
    console.log('✅ requireAuth - Token verified:', { 
      userId: decoded.userId, 
      email: decoded.email, 
      role: decoded.role 
    });
    
    // Connect to database
    console.log('🔐 requireAuth - Connecting to database...');
    await dbConnect();
    
    // Find user
    console.log('🔐 requireAuth - Finding user with ID:', decoded.userId);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ requireAuth - User not found in database');
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ requireAuth - User found:', user.email);
    return { user, decoded };
  } catch (error: any) {
    console.error('❌ requireAuth - Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { decoded } = authResult;
  
  if (!allowedRoles.includes(decoded.role)) {
    return NextResponse.json(
      { success: false, message: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return authResult;
}