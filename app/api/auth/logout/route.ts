import { NextRequest, NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/jwt';
import { ApiResponse } from '@/lib/api-response';

export async function POST() {
  const response = NextResponse.json(
    ApiResponse.success('Logout successful')
  );

  clearTokenCookie(response);
  response.cookies.delete('token');

  return response;
}