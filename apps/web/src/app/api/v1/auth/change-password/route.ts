import { ChangePasswordRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import bcrypt from 'bcryptjs';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const authResult = await getAuthUser(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const body = await request.json().catch(() => null);

  const parsed = ChangePasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: authResult.payload.sub } });
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'User not found' } },
      { status: 404 },
    );
  }

  const passwordMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!passwordMatch) {
    return NextResponse.json(
      { error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect' } },
      { status: 400 },
    );
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return NextResponse.json({ data: null }, { status: 200 });
}
