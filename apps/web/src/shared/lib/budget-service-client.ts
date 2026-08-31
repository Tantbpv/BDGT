import { BudgetClient } from '@repo/budget-client';

export const budgetServiceClient = new BudgetClient({
  baseUrl: process.env['BUDGET_SERVICE_URL'] ?? 'http://localhost:3003',
  serviceKey: process.env['BUDGET_SERVICE_KEY'] ?? '',
});
