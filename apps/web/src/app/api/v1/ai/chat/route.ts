import type { ChatResponse } from '@repo/contracts/ai';
import { ChatRequestSchema } from '@repo/contracts/ai';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';

import { aiServiceClient } from '@/shared/lib/ai-service-client';
import { getAuthUser } from '@/shared/lib/auth-helpers';

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ChatResponse> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const rawBody = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  try {
    const result = await aiServiceClient.chat(parsed.data);
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_SERVICE_ERROR', message: 'AI service error' } },
      { status: 502 },
    );
  }
}
