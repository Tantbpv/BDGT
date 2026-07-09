import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_HEADER,
  type AccessTokenPayload,
  BEARER_PREFIX,
  verifyAccessToken,
} from '@repo/auth';
import { parseEnv } from '@repo/config';
import type { ApiError } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

export type AuthResult =
  { ok: true; payload: AccessTokenPayload } | { ok: false; response: NextResponse<ApiError> };

export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  const cookieToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const authHeader = request.headers.get(ACCESS_TOKEN_HEADER);
  const headerToken = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length)
    : null;
  const token = cookieToken ?? headerToken;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' } },
        { status: 401 },
      ),
    };
  }

  try {
    const env = parseEnv();
    const payload = await verifyAccessToken(token, env.JWT_ACCESS_SECRET);
    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } },
        { status: 401 },
      ),
    };
  }
}

