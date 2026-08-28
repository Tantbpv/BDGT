import { ForgotPasswordRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { handleClientError } from '@/shared/lib/handle-client-error';
import { usersServiceClient } from '@/shared/lib/users-service-client';

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

  try {
    const result = await usersServiceClient.forgotPassword(parsed.data);

    if (result.token) {
      return NextResponse.json({ data: { resetToken: result.token } }, { status: 200 });
    }

    return NextResponse.json({ data: null }, { status: 200 });
  } catch (error) {
    return handleClientError(error);
  }
}
