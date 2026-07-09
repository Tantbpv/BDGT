import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, verifyAccessToken } from '@repo/auth';
import { parseEnv } from '@repo/config';
import { logger } from '@repo/logger';
import { type NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { method } = request;
  const path = request.nextUrl.pathname;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    try {
      const env = parseEnv();
      await verifyAccessToken(accessToken, env.JWT_ACCESS_SECRET);
      logger.debug({ method, path }, 'access token valid');
      return NextResponse.next();
    } catch (err) {
      logger.warn(
        { method, path, err },
        'access token invalid or expired, falling through to refresh',
      );
    }
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    logger.warn({ method, path }, 'no tokens present, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  logger.debug({ method, path }, 'attempting silent token refresh');
  // Access token expired but refresh token present — attempt silent refresh
  const refreshUrl = new URL('/api/v1/auth/refresh', request.url);
  const refreshResponse = await fetch(refreshUrl, {
    method: 'POST',
    headers: { cookie: request.headers.get('cookie') ?? '' },
  });

  if (!refreshResponse.ok) {
    logger.warn(
      { method, path, status: refreshResponse.status },
      'token refresh failed, redirecting to login',
    );
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  logger.debug({ method, path }, 'token refresh succeeded, replaying request');
  // Redirect to the same URL — browser replays the request with the new token cookies set
  const response = NextResponse.redirect(request.url);
  refreshResponse.headers.getSetCookie().forEach((cookie) => {
    response.headers.append('set-cookie', cookie);
  });
  return response;
}

export const config = {
  // Run on every route except Next.js internals, static assets, auth API endpoints, and public auth pages.
  // Any new route added under app/(private) is automatically protected without changing this file.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/|login|register).*)'],
};
