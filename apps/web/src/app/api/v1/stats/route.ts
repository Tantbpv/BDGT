import { BudgetClientError } from '@repo/budget-client';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type DashboardStats,DashboardStatsQuerySchema } from '@repo/contracts/statistics';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { budgetServiceClient } from '@/shared/lib/budget-service-client';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<DashboardStats> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const query = DashboardStatsQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: query.error.format() } },
      { status: 400 },
    );
  }

  try {
    const stats = await budgetServiceClient.getDashboardStats(auth.payload.sub, query.data);
    return NextResponse.json({ data: stats });
  } catch (err) {
    if (err instanceof BudgetClientError) {
      return NextResponse.json(
        { error: { code: 'BUDGET_SERVICE_ERROR', message: err.message } },
        { status: err.statusCode },
      );
    }
    throw err;
  }
}
