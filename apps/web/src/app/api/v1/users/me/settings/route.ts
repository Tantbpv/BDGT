import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { UpdateUserSettingSchema, type UserSetting } from '@repo/contracts/users';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { handleClientError } from '@/shared/lib/handle-client-error';
import { usersServiceClient } from '@/shared/lib/users-service-client';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<UserSetting> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const settings = await usersServiceClient.getSettings(auth.payload.sub);
    return NextResponse.json({ data: settings });
  } catch (error) {
    return handleClientError(error);
  }
}

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<UserSetting> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSettingSchema.safeParse(body);

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

  try {
    const settings = await usersServiceClient.updateSettings(auth.payload.sub, parsed.data);
    return NextResponse.json({ data: settings });
  } catch (error) {
    return handleClientError(error);
  }
}
