import { z } from 'zod';

export const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  description: z.string().min(1).max(255),
  type: TransactionTypeSchema,
  date: z.string().datetime(),
  userId: z.string(),
  categoryId: z.string().nullable(),
  merchantId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const CreateTransactionSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  description: z.string().min(1).max(255),
  type: TransactionTypeSchema,
  date: z.string().datetime(),
  categoryId: z.string().optional().nullable(),
  merchantId: z.string().optional().nullable(),
});

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;

export const TransactionListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: TransactionTypeSchema.optional(),
  categoryId: z.string().optional(),
  merchantId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
