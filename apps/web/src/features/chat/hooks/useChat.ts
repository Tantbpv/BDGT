import type { ChatResponse } from '@repo/contracts/ai';
import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/shared/lib/api-client';

export interface SendMessageInput {
  message: string;
  conversationId?: string;
}

export function useSendMessage() {
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      apiClient.post<ChatResponse>('/api/v1/ai/chat', input),
  });
}
