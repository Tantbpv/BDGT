import { type ChatRequest, type ChatResponse, type ConversationHistoryResponse } from '@repo/contracts/ai';
import { type ApiError, type ApiResponse } from '@repo/contracts/common';

import { AIClientError } from './errors';
import { type AIClientConfig } from './types';

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

  async getConversationHistory(conversationId: string, userId: string): Promise<ConversationHistoryResponse> {
    const response = await this.request<ApiResponse<ConversationHistoryResponse>>(
      `/api/conversations/${conversationId}/messages?userId=${encodeURIComponent(userId)}`,
      { method: 'GET' },
    );
    return response.data;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.request<ApiResponse<ChatResponse>>(
      '/api/chat',
      { method: 'POST', body: JSON.stringify(request) },
    );
    return response.data;
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.headers, ...(init.headers as Record<string, string> | undefined) },
    });
    console.log('[AIClient request]', response);
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
