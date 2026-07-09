import { type Account, CreateAccountSchema } from '@repo/contracts/accounts';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

function toAccount(a: { id: string; name: string; createdAt: Date; updatedAt: Date }): Account {
  return {
    id: a.id,
    name: a.name,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Account[]> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const accounts = await prisma.account.findMany({
    where: { users: { some: { userId: auth.payload.sub } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ data: accounts.map(toAccount) });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Account> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = CreateAccountSchema.safeParse(body);

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

  const account = await prisma.$transaction(async (tx) => {
    const acc = await tx.account.create({ data: { name: parsed.data.name } });
    await tx.userAccount.create({ data: { userId: auth.payload.sub, accountId: acc.id } });
    return acc;
  });

  return NextResponse.json({ data: toAccount(account) }, { status: 201 });
}
