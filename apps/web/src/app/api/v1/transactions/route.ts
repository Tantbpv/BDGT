import { NextRequest, NextResponse } from 'next/server';
import {
  CreateTransactionSchema,
  TransactionListQuerySchema,
  type Transaction,
} from '@repo/contracts/transactions';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Transaction[]> | ApiError>> {
  const { searchParams } = request.nextUrl;
  const query = TransactionListQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!query.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid query params', details: query.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, query transactions from DB
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
  const body = await request.json().catch(() => null);
  const parsed = CreateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, create transaction in DB
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
