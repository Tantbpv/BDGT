import { NextRequest, NextResponse } from 'next/server';
import { CreateCategorySchema, type Category } from '@repo/contracts/categories';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<ApiResponse<Category[]> | ApiError>> {
  // TODO: verify auth, fetch user's categories
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const body = await request.json().catch(() => null);
  const parsed = CreateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, create category
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
