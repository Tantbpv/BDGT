import { BudgetClientError } from '@repo/budget-client';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import {
  CreateTransactionSchema,
  type Transaction,
  TransactionListQuerySchema,
} from '@repo/contracts/transactions';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { budgetServiceClient } from '@/shared/lib/budget-service-client';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Transaction[]> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const query = TransactionListQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: query.error.format() } },
      { status: 400 },
    );
  }

  try {
    const result = await budgetServiceClient.getTransactions(auth.payload.sub, query.data);
    return NextResponse.json(result);
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
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = CreateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  try {
    const transaction = await budgetServiceClient.createTransaction(auth.payload.sub, parsed.data);
    return NextResponse.json({ data: transaction }, { status: 201 });
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
