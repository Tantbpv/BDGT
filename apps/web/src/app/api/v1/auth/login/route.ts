import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@repo/auth';
import { type AuthResponse, LoginRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { handleClientError } from '@/shared/lib/handle-client-error';
import { usersServiceClient } from '@/shared/lib/users-service-client';

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

  try {
    const result = await usersServiceClient.login(parsed.data);

    const isProduction = process.env['NODE_ENV'] === 'production';
    const response = NextResponse.json({ data: { user: result.user } }, { status: 200 });
    response.cookies.set(ACCESS_TOKEN_COOKIE, result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: new Date(result.accessExpiresAt),
      path: '/',
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: new Date(result.refreshExpiresAt),
      path: '/',
    });

    return response;
  } catch (error) {
    return handleClientError(error);
  }
}
