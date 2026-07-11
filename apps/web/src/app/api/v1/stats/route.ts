import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import type { DashboardStats } from '@/features/dashboard/types';
import { getAuthUser } from '@/shared/lib/auth-helpers';

const StatsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

async function getActiveAccountId(userId: string): Promise<string | null> {
  const settings = await prisma.userSetting.findUnique({ where: { userId } });
  return settings?.activeAccountId ?? null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<DashboardStats> | ApiError>> {
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
  const query = StatsQuerySchema.safeParse(Object.fromEntries(searchParams));

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

  const { from, to } = query.data;
  const dateFilter =
    from ?? to
      ? {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        }
      : undefined;

  const where = { accountId, ...(dateFilter && { date: dateFilter }) };

  const [incomeResult, expenseResult, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...where, type: 'INCOME' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...where, type: 'EXPENSE' }, _sum: { amount: true } }),
    prisma.transaction.count({ where }),
  ]);

  const income = parseFloat((incomeResult._sum.amount ?? 0).toString());
  const expenses = parseFloat((expenseResult._sum.amount ?? 0).toString());
  const balance = (income - expenses).toFixed(2);

  return NextResponse.json({
    data: {
      totalIncome: income.toFixed(2),
      totalExpenses: expenses.toFixed(2),
      balance,
      transactionCount,
    } satisfies DashboardStats,
  });
}
