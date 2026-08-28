import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@repo/auth';
import type { AuthResponse } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { handleClientError } from '@/shared/lib/handle-client-error';
import { usersServiceClient } from '@/shared/lib/users-service-client';

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

  try {
    const result = await usersServiceClient.refresh(refreshToken);

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
