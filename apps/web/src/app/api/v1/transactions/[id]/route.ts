import type { Prisma } from '@prisma/client';
import type { ApiError,ApiResponse } from '@repo/contracts/common';
import { type Transaction,UpdateTransactionSchema } from '@repo/contracts/transactions';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

function toTransaction(t: {
  id: string;
  amount: Prisma.Decimal;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  accountId: string;
  categories: { id: string }[];
  createdById: string;
  createdBy: { name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
}): Transaction {
  return {
    id: t.id,
    amount: t.amount.toString(),
    description: t.description,
    type: t.type,
    date: t.date.toISOString(),
    accountId: t.accountId,
    categoryIds: t.categories.map((c) => c.id),
    createdById: t.createdById,
    createdByName: t.createdBy.name ?? t.createdBy.email,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { categories: { select: { id: true } }, createdBy: { select: { name: true, email: true } } },
  });
  if (!transaction) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
      { status: 404 },
    );
  }

  const membership = await prisma.userAccount.findFirst({
    where: { accountId: transaction.accountId, userId: auth.payload.sub },
  });
  if (!membership) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: toTransaction(transaction) });
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, update transaction
  void id;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id } });
  if (!transaction) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
      { status: 404 },
    );
  }

  const membership = await prisma.userAccount.findFirst({
    where: { accountId: transaction.accountId, userId: auth.payload.sub },
  });
  if (!membership) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
      { status: 404 },
    );
  }

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ data: null });
}
