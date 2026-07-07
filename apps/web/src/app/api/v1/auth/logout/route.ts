import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@repo/auth';

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  const response = NextResponse.json({ data: null });
  response.cookies.delete(REFRESH_TOKEN_COOKIE);

  if (refreshToken) {
    // TODO: invalidate refresh token in the database
  }

  return response;
}
