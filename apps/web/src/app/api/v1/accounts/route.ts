import { BudgetClientError } from '@repo/budget-client';
import { type Account,CreateAccountSchema } from '@repo/contracts/accounts';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { budgetServiceClient } from '@/shared/lib/budget-service-client';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Account[]> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  try {
    const accounts = await budgetServiceClient.getAccounts(auth.payload.sub);
    return NextResponse.json({ data: accounts });
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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Account> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = CreateAccountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  try {
    const account = await budgetServiceClient.createAccount(auth.payload.sub, parsed.data);
    return NextResponse.json({ data: account }, { status: 201 });
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
