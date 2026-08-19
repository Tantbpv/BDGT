import { useMutation } from '@tanstack/react-query';
import type { ChatMessage, ChatResponse } from '@repo/contracts/ai';

import { apiClient } from '@/shared/lib/api-client';

export function useSendMessage() {
  return useMutation({
    mutationFn: (messages: ChatMessage[]) =>
      apiClient.post<ChatResponse>('/api/v1/ai/chat', { messages }),
  });
}
