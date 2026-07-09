import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const userAccount = await prisma.userAccount.findUnique({
    where: { userId_accountId: { userId: auth.payload.sub, accountId: id } },
  });

  if (!userAccount) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Account not found' } },
      { status: 404 },
    );
  }

  const accountCount = await prisma.userAccount.count({
    where: { userId: auth.payload.sub },
  });

  if (accountCount <= 1) {
    return NextResponse.json(
      { error: { code: 'LAST_ACCOUNT', message: 'Cannot delete the last account' } },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAccount.delete({
      where: { userId_accountId: { userId: auth.payload.sub, accountId: id } },
    });

    const remainingUsers = await tx.userAccount.count({ where: { accountId: id } });
    if (remainingUsers === 0) {
      await tx.account.delete({ where: { id } });
    }

    const settings = await tx.userSetting.findUnique({ where: { userId: auth.payload.sub } });
    if (settings?.activeAccountId === id) {
      const next = await tx.userAccount.findFirst({ where: { userId: auth.payload.sub } });
      await tx.userSetting.update({
        where: { userId: auth.payload.sub },
        data: { activeAccountId: next?.accountId ?? null },
      });
    }
  });

  return NextResponse.json({ data: null });
}
