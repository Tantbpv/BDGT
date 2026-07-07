import { NextRequest, NextResponse } from 'next/server';
import { CreateMerchantSchema, type Merchant } from '@repo/contracts/merchants';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<ApiResponse<Merchant[]> | ApiError>> {
  // TODO: verify auth, fetch user's merchants
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Merchant> | ApiError>> {
  const body = await request.json().catch(() => null);
  const parsed = CreateMerchantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, create merchant
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
