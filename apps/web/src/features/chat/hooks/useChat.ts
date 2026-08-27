import type { ChatResponse, ConversationHistoryResponse } from '@repo/contracts/ai';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/lib/api-client';

export const CONVERSATION_ID_KEY = 'bdgt_conversation_id';

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

export function useConversationHistory(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ['conversationHistory', conversationId],
    queryFn: () =>
      apiClient.get<ConversationHistoryResponse>(
        `/api/v1/ai/conversations/${conversationId}/messages`,
      ),
    enabled: typeof conversationId === 'string',
    retry: false,
  });
}
