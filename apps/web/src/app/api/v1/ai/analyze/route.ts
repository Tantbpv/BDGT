import type { Prisma } from '@prisma/client';
import type { AnalyzeTransactionsResponse } from '@repo/contracts/ai';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import type { Transaction } from '@repo/contracts/transactions';
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AnalyzeTransactionsResponse> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const settings = await prisma.userSetting.findUnique({ where: { userId: auth.payload.sub } });
  const accountId = settings?.activeAccountId;

  if (!accountId) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'No active account' } },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => ({})) as { from?: string; to?: string };

  const rows = await prisma.transaction.findMany({
    where: {
      accountId,
      ...(body.from || body.to
        ? { date: { ...(body.from && { gte: new Date(body.from) }), ...(body.to && { lte: new Date(body.to) }) } }
        : {}),
    },
    include: {
      categories: { select: { id: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'No transactions to analyze' } },
      { status: 400 },
    );
  }

  const aiServiceUrl = process.env['AI_SERVICE_URL'] ?? 'http://localhost:3001';
  const aiServiceKey = process.env['AI_SERVICE_KEY'] ?? '';

  const aiResponse = await fetch(`${aiServiceUrl}/api/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': aiServiceKey },
    body: JSON.stringify({ transactions: rows.map(toTransaction) }),
  });

  if (!aiResponse.ok) {
    const body = await aiResponse.json().catch(() => ({})) as ApiError;
    return NextResponse.json(
      { error: { code: 'AI_SERVICE_ERROR', message: body?.error?.message ?? 'AI service error' } },
      { status: 502 },
    );
  }

  const result = (await aiResponse.json()) as ApiResponse<AnalyzeTransactionsResponse>;
  return NextResponse.json({ data: result.data });
}
