import type { ApiError } from '@repo/contracts/common';
import { UserClientError } from '@repo/user-client';
import { NextResponse } from 'next/server';

export function handleClientError(error: unknown): NextResponse<ApiError> {
  if (error instanceof UserClientError) {
    return NextResponse.json(
      { error: { code: 'SERVICE_ERROR', message: error.message } },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 },
  );
}
