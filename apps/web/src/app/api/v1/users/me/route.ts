import type { ApiError,ApiResponse } from '@repo/contracts/common';
import { UpdateUserSchema, type User } from '@repo/contracts/users';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
): Promise<NextResponse<ApiResponse<User> | ApiError>> {
  // TODO: verify auth, return current user
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<User> | ApiError>> {
  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify auth, update current user
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
