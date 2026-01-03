import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';
import { verifyToken } from '@/lib/jwt';
import { ApiResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me endpoint called');
    console.log('🍪 Full cookie string:', request.cookies.toString());
    
    const token = request.cookies.get('token')?.value;
    console.log('🎫 Token from cookies:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('❌ No token found in cookies');
      return NextResponse.json(
        ApiResponse.error('Authentication required'),
        { status: 401 }
      );
    }

    try {
      console.log('🔐 Verifying token...');
      const decoded = verifyToken(token);
      console.log('✅ Token verified:', { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role 
      });
      
      console.log('🗄️ Connecting to database...');
      await dbConnect();
      
      console.log('👤 Finding user with ID:', decoded.userId);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('❌ User not found in database');
        return NextResponse.json(
          ApiResponse.error('User not found'),
          { status: 404 }
        );
      }

      console.log('✅ User found:', user.email);
      
      return NextResponse.json(
        ApiResponse.success('User retrieved successfully', {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            position: user.position,
            avatar: user.avatar,
            hireDate: user.hireDate,
            lastLogin: user.lastLogin,
          },
        })
      );
      
    } catch (error: any) {
      console.error('❌ Token verification failed:', error.message);
      return NextResponse.json(
        ApiResponse.error('Invalid token'),
        { status: 401 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Get user error:', error);
    return NextResponse.json(
      ApiResponse.error('Internal server error: ' + error.message),
      { status: 500 }
    );
  }
}