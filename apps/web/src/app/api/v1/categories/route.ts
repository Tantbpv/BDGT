import { type Category, CreateCategorySchema } from '@repo/contracts/categories';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

function toCategory(c: {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: c.id,
    name: c.name,
    color: c.color,
    icon: c.icon,
    accountId: c.accountId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function getActiveAccountId(userId: string): Promise<string | null> {
  const settings = await prisma.userSetting.findUnique({ where: { userId } });
  return settings?.activeAccountId ?? null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Category[]> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const accountId = await getActiveAccountId(auth.payload.sub);
  if (!accountId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'No active account' } },
      { status: 400 },
    );
  }

  const categories = await prisma.category.findMany({
    where: { accountId },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ data: categories.map(toCategory) });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const accountId = await getActiveAccountId(auth.payload.sub);
  if (!accountId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'No active account' } },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateCategorySchema.safeParse(body);

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

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      accountId,
    },
  });

  return NextResponse.json({ data: toCategory(category) }, { status: 201 });
}
