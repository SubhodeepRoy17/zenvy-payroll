import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';
import { generateToken, setTokenCookie } from '@/lib/jwt';
import { ApiResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login API called');
    
    await dbConnect();
    
    const { email, password, role } = await request.json();
    console.log('📧 Login attempt for:', { email, role });

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        ApiResponse.error('Please provide email, password and role'),
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return NextResponse.json(
        ApiResponse.error('Invalid credentials'),
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        ApiResponse.error('Account is deactivated'),
        { status: 401 }
      );
    }

    // Check role
    console.log('🎭 Role check - User role:', user.role, 'Requested role:', role);
    if (user.role !== role) {
      return NextResponse.json(
        ApiResponse.error(`Please login as ${user.role}`),
        { status: 401 }
      );
    }

    // Check password
    console.log('🔑 Checking password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        ApiResponse.error('Invalid credentials'),
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    console.log('🎫 Token generated');

    // Prepare response
    const response = NextResponse.json(
      ApiResponse.success('Login successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          position: user.position,
          avatar: user.avatar,
        },
        token,
      })
    );

    // Set token cookie - Use the function from jwt.ts
    console.log('🍪 Setting cookie...');
    setTokenCookie(response, token);
    
    // DEBUG: Log the cookie that was set
    console.log('✅ Cookie set with headers:', response.headers.get('set-cookie'));
    
    console.log('✅ Login successful for:', user.email);
    return response;
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      ApiResponse.error('Internal server error: ' + error.message),
      { status: 500 }
    );
  }
}