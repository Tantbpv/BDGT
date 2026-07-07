import { NextRequest, NextResponse } from 'next/server';
import { LoginRequestSchema, type AuthResponse } from '@repo/contracts/auth';
import type { ApiResponse, ApiError } from '@repo/contracts/common';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<AuthResponse> | ApiError>> {
  const body = await request.json().catch(() => null);

  const parsed = LoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parsed.error.format() } },
      { status: 400 },
    );
  }

  // TODO: verify credentials, issue access + refresh tokens
  return NextResponse.json(
    { error: { code: 'NOT_IMPLEMENTED', message: 'Not implemented' } },
    { status: 501 },
  );
}
