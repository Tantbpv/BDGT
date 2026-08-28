import { ChangePasswordRequestSchema } from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { handleClientError } from '@/shared/lib/handle-client-error';
import { usersServiceClient } from '@/shared/lib/users-service-client';

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

  try {
    await usersServiceClient.changePassword(authResult.payload.sub, parsed.data);
    return NextResponse.json({ data: null }, { status: 200 });
  } catch (error) {
    return handleClientError(error);
  }
}
