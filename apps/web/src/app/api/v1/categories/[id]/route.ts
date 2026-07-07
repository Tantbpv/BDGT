import { NextRequest, NextResponse } from 'next/server';
import { UpdateCategorySchema, type Category } from '@repo/contracts/categories';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const { id } = await params;
  void id;
  // TODO: verify auth, fetch category by id
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  void id;
  // TODO: verify auth, update category
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
  // TODO: verify auth, delete category
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
