import { BudgetClientError } from '@repo/budget-client';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { budgetServiceClient } from '@/shared/lib/budget-service-client';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await budgetServiceClient.deleteAccount(auth.payload.sub, id);
    return NextResponse.json({ data: null });
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
