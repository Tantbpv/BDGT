import { BudgetClientError } from '@repo/budget-client';
import { type Category, UpdateCategorySchema } from '@repo/contracts/categories';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { getAuthUser } from '@/shared/lib/auth-helpers';
import { budgetServiceClient } from '@/shared/lib/budget-service-client';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const category = await budgetServiceClient.getCategory(auth.payload.sub, id);
    return NextResponse.json({ data: category });
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

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<Category> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  try {
    const category = await budgetServiceClient.updateCategory(auth.payload.sub, id, parsed.data);
    return NextResponse.json({ data: category });
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<null> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await budgetServiceClient.deleteCategory(auth.payload.sub, id);
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
