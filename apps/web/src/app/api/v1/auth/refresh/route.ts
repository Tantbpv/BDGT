import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, verifyRefreshToken } from '@repo/auth';
import { parseEnv } from '@repo/config';
import type { AuthResponse } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { issueTokens } from '@/shared/lib/issue-tokens';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AuthResponse> | ApiError>> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'No refresh token' } },
      { status: 401 },
    );
  }

  const env = parseEnv();

  try {
    await verifyRefreshToken(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } },
      { status: 401 },
    );
  }

  const record = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!record) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Refresh token not found' } },
      { status: 401 },
    );
  }

  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Refresh token expired' } },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'User not found' } },
      { status: 401 },
    );
  }

  // Rotate: delete old token, then issue a new pair
  await prisma.refreshToken.delete({ where: { id: record.id } });

  const {
    authResponse,
    accessToken,
    accessExpiresAt,
    refreshToken: newRefreshToken,
    refreshExpiresAt,
  } = await issueTokens({ userId: user.id, email: user.email, name: user.name ?? null });

  const isProduction = process.env['NODE_ENV'] === 'production';
  const response = NextResponse.json({ data: authResponse }, { status: 200 });
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: accessExpiresAt,
    path: '/',
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires: refreshExpiresAt,
    path: '/',
  });

  return response;
}
