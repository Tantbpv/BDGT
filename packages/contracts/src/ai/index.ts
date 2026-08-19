import { z } from 'zod';

import { TransactionSchema } from '../transactions/index.js';

export const AnalyzeTransactionsRequestSchema = z.object({
  transactions: z.array(TransactionSchema).min(1),
});

export type AnalyzeTransactionsRequest = z.infer<typeof AnalyzeTransactionsRequestSchema>;

export const AnalyzeTransactionsResponseSchema = z.object({
  analysis: z.string(),
});

export type AnalyzeTransactionsResponse = z.infer<typeof AnalyzeTransactionsResponseSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  message: z.string(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
