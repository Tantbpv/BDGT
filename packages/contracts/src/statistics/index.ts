import { z } from 'zod';

export const DashboardStatsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type DashboardStatsQuery = z.infer<typeof DashboardStatsQuerySchema>;

export const DashboardStatsSchema = z.object({
  totalIncome: z.string(),
  totalExpenses: z.string(),
  balance: z.string(),
  transactionCount: z.number().int().nonnegative(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;
