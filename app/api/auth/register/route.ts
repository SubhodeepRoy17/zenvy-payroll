import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import { dbConnect } from '@/lib/dbConnect';
import { generateToken, setTokenCookie } from '@/lib/jwt';
import { ApiResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const { name, email, password, confirmPassword, role = 'employee' } = await request.json();

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        ApiResponse.error('Please fill all fields'),
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        ApiResponse.error('Passwords do not match'),
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        ApiResponse.error('Password must be at least 6 characters'),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        ApiResponse.error('User already exists'),
        { status: 409 }
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const response = NextResponse.json(
      ApiResponse.success('Registration successful', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      })
    );

    // Set token cookie
    setTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      ApiResponse.error('Internal server error'),
      { status: 500 }
    );
  }
}