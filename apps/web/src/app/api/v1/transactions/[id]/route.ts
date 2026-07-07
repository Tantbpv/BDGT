import type { ApiError,ApiResponse } from '@repo/contracts/common';
import { type Transaction,UpdateTransactionSchema } from '@repo/contracts/transactions';
import { type NextRequest, NextResponse } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Transaction> | ApiError>> {
  const { id } = await params;

  // TODO: verify auth, fetch transaction by id
  void id;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
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
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const { id } = await params;

  // TODO: verify auth, delete transaction
  void id;
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
