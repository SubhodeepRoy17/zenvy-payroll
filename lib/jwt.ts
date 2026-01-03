import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '7d'

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable inside .env.local')
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}

export function setTokenCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: 'token',
    value: token,
    httpOnly: true,
    secure: false, // MUST BE false for localhost
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
    // NO DOMAIN for localhost - this is CRITICAL
  });
}

export function clearTokenCookie(res: NextResponse) {
  res.cookies.delete('token'); // Simple delete
}