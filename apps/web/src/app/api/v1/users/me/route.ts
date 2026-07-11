import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { UpdateUserSchema, type User } from '@repo/contracts/users';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<User> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const row = await prisma.user.findUnique({
    where: { id: auth.payload.sub },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });

  if (!row) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 },
    );
  }

  const user: User = {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
  return NextResponse.json({ data: user });
}

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<User> | ApiError>> {
  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);

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

  // TODO: verify auth, update current user
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
