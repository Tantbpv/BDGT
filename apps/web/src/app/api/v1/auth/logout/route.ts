import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@repo/auth';
import { type NextRequest, NextResponse } from 'next/server';

import { usersServiceClient } from '@/shared/lib/users-service-client';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const response = NextResponse.json({ data: null });
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);

  if (refreshToken) {
    // Fire-and-forget: always clear cookies regardless of service availability
    await usersServiceClient.logout(refreshToken).catch(() => undefined);
  }

  return response;
}
