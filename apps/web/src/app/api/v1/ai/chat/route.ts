import type { ChatResponse } from '@repo/contracts/ai';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { aiServiceClient } from '@/shared/lib/ai-service-client';
import { getAuthUser } from '@/shared/lib/auth-helpers';

const FrontendChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  conversationId: z.string().cuid().optional(),
});

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ChatResponse> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const rawBody = await request.json().catch(() => null);
  const parsed = FrontendChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: parsed.error.flatten() } },
      { status: 400 },
    );
  }

  try {
    const result = await aiServiceClient.chat({
      userId: auth.payload.sub,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
    });
    return NextResponse.json({ data: result });
  } catch(e) {
    return NextResponse.json(
      { error: { code: 'AI_SERVICE_ERROR', message: `AI service error ${JSON.stringify(e)}` } },
      { status: 502 },
    );
  }
}
