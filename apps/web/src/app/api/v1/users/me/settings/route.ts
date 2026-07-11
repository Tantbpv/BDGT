import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { UpdateUserSettingSchema,type UserSetting } from '@repo/contracts/users';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

function toUserSetting(s: {
  id: string;
  userId: string;
  currency: string;
  activeAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UserSetting {
  return {
    id: s.id,
    userId: s.userId,
    currency: s.currency as UserSetting['currency'],
    activeAccountId: s.activeAccountId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<UserSetting> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  let settings = await prisma.userSetting.findUnique({
    where: { userId: auth.payload.sub },
  });

  if (!settings) {
    settings = await prisma.userSetting.create({
      data: { userId: auth.payload.sub, currency: 'EUR' },
    });
  }

  return NextResponse.json({ data: toUserSetting(settings) });
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

  const settings = await prisma.userSetting.upsert({
    where: { userId: auth.payload.sub },
    create: { userId: auth.payload.sub, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ data: toUserSetting(settings) });
}
