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
