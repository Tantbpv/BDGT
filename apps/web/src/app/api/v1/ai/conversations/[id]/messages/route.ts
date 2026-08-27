import type { ConversationHistoryResponse } from '@repo/contracts/ai';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { aiServiceClient } from '@/shared/lib/ai-service-client';
import { getAuthUser } from '@/shared/lib/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse<ApiResponse<ConversationHistoryResponse> | ApiError>> {
  const auth = await getAuthUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!z.string().cuid().safeParse(id).success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid conversation id' } },
      { status: 400 },
    );
  }

  try {
    const result = await aiServiceClient.getConversationHistory(id, auth.payload.sub);
    return NextResponse.json({ data: result });
  } catch (e) {
    return NextResponse.json(
      { error: { code: 'AI_SERVICE_ERROR', message: `AI service error: ${String(e)}` } },
      { status: 502 },
    );
  }
}
