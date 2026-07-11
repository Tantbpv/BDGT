import type { Prisma } from '@prisma/client';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import {
  CreateTransactionSchema,
  type Transaction,
  TransactionListQuerySchema,
} from '@repo/contracts/transactions';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

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

async function getActiveAccountId(userId: string): Promise<string | null> {
  const settings = await prisma.userSetting.findUnique({ where: { userId } });
  return settings?.activeAccountId ?? null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Transaction[]> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const accountId = await getActiveAccountId(auth.payload.sub);
  if (!accountId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'No active account' } },
      { status: 400 },
    );
  }

  const { searchParams } = request.nextUrl;
  const query = TransactionListQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!query.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query params',
          details: query.error.format(),
        },
      },
      { status: 400 },
    );
  }

  const { page, limit, type, categoryId, from, to } = query.data;

  const where = {
    accountId,
    ...(type && { type }),
    ...(categoryId && { categories: { some: { id: categoryId } } }),
    ...(from || to
      ? {
          date: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    include: { categories: { select: { id: true } }, createdBy: { select: { name: true, email: true } } },
    orderBy: { date: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({ data: transactions.map(toTransaction) });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
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
  const parsed = CreateTransactionSchema.safeParse(body);

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

  const categoryIds = parsed.data.categoryIds ?? [];

  const transaction = await prisma.transaction.create({
    data: {
      amount: parsed.data.amount,
      description: parsed.data.description,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      accountId,
      createdById: auth.payload.sub,
      ...(categoryIds.length > 0 && {
        categories: { connect: categoryIds.map((id) => ({ id })) },
      }),
    },
    include: {
      categories: { select: { id: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ data: toTransaction(transaction) }, { status: 201 });
}
