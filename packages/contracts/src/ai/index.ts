import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  userId: z.string().cuid(),
  conversationId: z.string().cuid().optional(),
  message: z.string().min(1).max(10000),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  conversationId: z.string().cuid(),
  message: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const ConversationHistoryResponseSchema = z.object({
  messages: z.array(ChatMessageSchema),
});

export type ConversationHistoryResponse = z.infer<typeof ConversationHistoryResponseSchema>;
