import { ForgotPasswordRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { randomBytes } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<{ resetToken: string } | null> | ApiError>> {
  const body = await request.json().catch(() => null);

  const parsed = ForgotPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3_600_000);

    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    if (process.env['NODE_ENV'] === 'development') {
      return NextResponse.json({ data: { resetToken: token } }, { status: 200 });
    }
  }

  return NextResponse.json({ data: null }, { status: 200 });
}
