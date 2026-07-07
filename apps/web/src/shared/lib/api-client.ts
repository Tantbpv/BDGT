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

async function handleResponse<T>(response: Response): Promise<T> {
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

const baseHeaders = { 'Content-Type': 'application/json' };
const baseInit: RequestInit = { credentials: 'include' };

export async function apiGet<T>(path: string): Promise<T> {
  return handleResponse<T>(await fetch(path, { ...baseInit, headers: baseHeaders }));
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(
    await fetch(path, { ...baseInit, method: 'POST', headers: baseHeaders, body: JSON.stringify(body) }),
  );
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(
    await fetch(path, { ...baseInit, method: 'PUT', headers: baseHeaders, body: JSON.stringify(body) }),
  );
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return handleResponse<T>(
    await fetch(path, { ...baseInit, method: 'PATCH', headers: baseHeaders, body: JSON.stringify(body) }),
  );
}

export async function apiDelete<T>(path: string): Promise<T> {
  return handleResponse<T>(
    await fetch(path, { ...baseInit, method: 'DELETE', headers: baseHeaders }),
  );
}
