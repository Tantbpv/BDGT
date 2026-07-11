import type { ApiError } from '@repo/contracts/common';

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    { code, status, details }: { code: string; status: number; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const REFRESH_PATH = '/api/v1/auth/refresh';
const USERS_ME_PATH = '/api/v1/users/me';

class ApiClient {
  private readonly baseHeaders = { 'Content-Type': 'application/json' };
  private readonly baseInit: RequestInit = { credentials: 'include' };

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = (await response.json()) as { data?: T } & ApiError;
    if (!response.ok) {
      throw new ApiClientError(data.error.message, {
        code: data.error.code,
        status: response.status,
        details: data.error.details,
      });
    }
    return data.data as T;
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const r = await fetch(REFRESH_PATH, { method: 'POST', credentials: 'include' });
      return r.ok;
    } catch {
      return false;
    }
  }

  private async fetchWithRetry(path: string, init: RequestInit): Promise<Response> {
    const response = await fetch(path, init);

    if (response.status !== 401 || path === REFRESH_PATH || path === USERS_ME_PATH) {
      return response;
    }

    const refreshed = await this.refreshTokens();
    if (!refreshed) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return response;
    }

    return fetch(path, init);
  }

  async get<T>(path: string): Promise<T> {
    return this.handleResponse<T>(
      await this.fetchWithRetry(path, { ...this.baseInit, headers: this.baseHeaders }),
    );
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.handleResponse<T>(
      await this.fetchWithRetry(path, {
        ...this.baseInit,
        method: 'POST',
        headers: this.baseHeaders,
        body: JSON.stringify(body),
      }),
    );
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.handleResponse<T>(
      await this.fetchWithRetry(path, {
        ...this.baseInit,
        method: 'PUT',
        headers: this.baseHeaders,
        body: JSON.stringify(body),
      }),
    );
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.handleResponse<T>(
      await this.fetchWithRetry(path, {
        ...this.baseInit,
        method: 'PATCH',
        headers: this.baseHeaders,
        body: JSON.stringify(body),
      }),
    );
  }

  async delete<T>(path: string): Promise<T> {
    return this.handleResponse<T>(
      await this.fetchWithRetry(path, {
        ...this.baseInit,
        method: 'DELETE',
        headers: this.baseHeaders,
      }),
    );
  }
}

export const apiClient = new ApiClient();
