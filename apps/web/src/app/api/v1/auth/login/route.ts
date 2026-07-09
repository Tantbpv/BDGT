import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@repo/auth';
import { type AuthResponse, LoginRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';

import { issueTokens } from '@/shared/lib/issue-tokens';

// Pre-hashed sentinel used for constant-time comparison when the user is not found,
// preventing timing-based email enumeration.
const DUMMY_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBavEFBbEGelH.';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AuthResponse> | ApiError>> {
  const body = await request.json().catch(() => null);

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(parsed.data.password, hashToCompare);

  if (!user || !passwordMatch) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
      { status: 401 },
    );
  }

  const { authResponse, accessToken, accessExpiresAt, refreshToken, refreshExpiresAt } = await issueTokens({
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
  });

  const isProduction = process.env['NODE_ENV'] === 'production';
  const response = NextResponse.json({ data: authResponse }, { status: 200 });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: accessExpiresAt,
    path: '/',
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: refreshExpiresAt,
    path: '/',
  });

  return response;
}
