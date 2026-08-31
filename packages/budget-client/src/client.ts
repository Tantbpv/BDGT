import type { Account, CreateAccount } from '@repo/contracts/accounts';
import type { Category, CreateCategory, UpdateCategory } from '@repo/contracts/categories';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import type { DashboardStats, DashboardStatsQuery } from '@repo/contracts/statistics';
import type {
  CreateTransaction,
  Transaction,
  TransactionListQuery,
  UpdateTransaction,
} from '@repo/contracts/transactions';

import { BudgetClientError } from './errors';
import type { BudgetClientConfig } from './types';

export class BudgetClient {
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  constructor(config: BudgetClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.serviceKey = config.serviceKey;
  }

  async getAccounts(userId: string): Promise<Account[]> {
    const response = await this.request<ApiResponse<Account[]>>('/api/accounts', { method: 'GET' }, userId);
    return response.data;
  }

  async createAccount(userId: string, body: CreateAccount): Promise<Account> {
    const response = await this.request<ApiResponse<Account>>(
      '/api/accounts',
      { method: 'POST', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    await this.request<ApiResponse<null>>(`/api/accounts/${accountId}`, { method: 'DELETE' }, userId);
  }

  async getTransactions(
    userId: string,
    query?: Partial<TransactionListQuery>,
  ): Promise<ApiResponse<Transaction[]>> {
    const params = query ? this.buildParams(query) : '';
    const path = params ? `/api/transactions?${params}` : '/api/transactions';
    return this.request<ApiResponse<Transaction[]>>(path, { method: 'GET' }, userId);
  }

  async createTransaction(userId: string, body: CreateTransaction): Promise<Transaction> {
    const response = await this.request<ApiResponse<Transaction>>(
      '/api/transactions',
      { method: 'POST', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async getTransaction(userId: string, id: string): Promise<Transaction> {
    const response = await this.request<ApiResponse<Transaction>>(
      `/api/transactions/${id}`,
      { method: 'GET' },
      userId,
    );
    return response.data;
  }

  async updateTransaction(userId: string, id: string, body: UpdateTransaction): Promise<Transaction> {
    const response = await this.request<ApiResponse<Transaction>>(
      `/api/transactions/${id}`,
      { method: 'PUT', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    await this.request<ApiResponse<null>>(`/api/transactions/${id}`, { method: 'DELETE' }, userId);
  }

  async getCategories(userId: string): Promise<Category[]> {
    const response = await this.request<ApiResponse<Category[]>>('/api/categories', { method: 'GET' }, userId);
    return response.data;
  }

  async createCategory(userId: string, body: CreateCategory): Promise<Category> {
    const response = await this.request<ApiResponse<Category>>(
      '/api/categories',
      { method: 'POST', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async getCategory(userId: string, id: string): Promise<Category> {
    const response = await this.request<ApiResponse<Category>>(
      `/api/categories/${id}`,
      { method: 'GET' },
      userId,
    );
    return response.data;
  }

  async updateCategory(userId: string, id: string, body: UpdateCategory): Promise<Category> {
    const response = await this.request<ApiResponse<Category>>(
      `/api/categories/${id}`,
      { method: 'PUT', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    await this.request<ApiResponse<null>>(`/api/categories/${id}`, { method: 'DELETE' }, userId);
  }

  async getDashboardStats(userId: string, query?: DashboardStatsQuery): Promise<DashboardStats> {
    const params = query ? this.buildParams(query) : '';
    const path = params ? `/api/statistics?${params}` : '/api/statistics';
    const response = await this.request<ApiResponse<DashboardStats>>(path, { method: 'GET' }, userId);
    return response.data;
  }

  private buildParams(query: Record<string, unknown>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }

  private async request<T>(path: string, init: RequestInit, userId?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.serviceKey,
    };
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      throw new BudgetClientError(
        body?.error?.message ?? response.statusText,
        response.status,
        body?.error?.code ?? 'UNKNOWN',
      );
    }

    return response.json() as Promise<T>;
  }
}
