import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, ApiError } from '@repo/contracts/common';
import type { AuthResponse } from '@repo/contracts/auth';
import { REFRESH_TOKEN_COOKIE } from '@repo/auth';

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

  // TODO: verify refresh token, rotate it, issue new access token
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
