import { AnalyzeTransactionsRequest, AnalyzeTransactionsResponse } from '@repo/contracts/ai';
import { ApiError, ApiResponse } from '@repo/contracts/common';
import { AIClientError } from './errors';
import { AIClientConfig } from './types';

export class AIClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: AIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
    };
  }

  async health(): Promise<{ service: string; status: string; timestamp: string }> {
    return this.request('/api/health', { method: 'GET' });
  }

  async analyzeTransactions(
    request: AnalyzeTransactionsRequest,
  ): Promise<AnalyzeTransactionsResponse> {
    const response = await this.request<ApiResponse<AnalyzeTransactionsResponse>>(
      '/api/ai/analyze',
      { method: 'POST', body: JSON.stringify(request) },
    );
    return response.data;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers, ...(init.headers as Record<string, string> | undefined) },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      throw new AIClientError(
        body?.error?.message ?? response.statusText,
        response.status,
        body?.error?.code ?? 'UNKNOWN',
      );
    }

    return response.json() as Promise<T>;
  }
}
