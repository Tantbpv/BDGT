import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@repo/auth';
import { type AuthResponse, RegisterRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';

import { issueTokens } from '@/shared/lib/issue-tokens';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AuthResponse> | ApiError>> {
  const body = await request.json().catch(() => null);

  const parsed = RegisterRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parsed.error.format(),
        },
      },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json(
      { error: { code: 'EMAIL_TAKEN', message: 'Email already in use' } },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        name: parsed.data.name ?? null,
      },
    });
    const account = await tx.account.create({ data: { name: 'Default' } });
    await tx.userAccount.create({ data: { userId: newUser.id, accountId: account.id } });
    await tx.userSetting.create({
      data: { userId: newUser.id, currency: 'EUR', activeAccountId: account.id },
    });
    return newUser;
  });

  const { authResponse, accessToken, accessExpiresAt, refreshToken, refreshExpiresAt } = await issueTokens({
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
  });

  const isProduction = process.env['NODE_ENV'] === 'production';
  const response = NextResponse.json({ data: authResponse }, { status: 201 });
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
