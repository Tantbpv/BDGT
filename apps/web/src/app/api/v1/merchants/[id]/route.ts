import { NextRequest, NextResponse } from 'next/server';
import { UpdateMerchantSchema, type Merchant } from '@repo/contracts/merchants';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Merchant> | ApiError>> {
  const { id } = await params;
  void id;
  // TODO: verify auth, fetch merchant by id
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Merchant> | ApiError>> {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateMerchantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  void id;
  // TODO: verify auth, update merchant
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
  void id;
  // TODO: verify auth, delete merchant
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
