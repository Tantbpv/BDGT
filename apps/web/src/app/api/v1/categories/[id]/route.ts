import { type Category, UpdateCategorySchema } from '@repo/contracts/categories';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { prisma } from '@repo/database';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';

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
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Category not found' } },
      { status: 404 },
    );
  }

  const membership = await prisma.userAccount.findFirst({
    where: { accountId: category.accountId, userId: auth.payload.sub },
  });
  if (!membership) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Category not found' } },
      { status: 404 },
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ data: null });
}
