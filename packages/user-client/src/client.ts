import type {
  AuthTokensResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@repo/contracts/auth';
import type { ApiError, ApiResponse } from '@repo/contracts/common';
import type { UpdateUser, UpdateUserSetting, User, UserSetting } from '@repo/contracts/users';

import { UserClientError } from './errors';
import type { UserClientConfig } from './types';

export class UserClient {
  private readonly baseUrl: string;
  private readonly serviceKey: string;

  constructor(config: UserClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.serviceKey = config.serviceKey;
  }

  async login(body: LoginRequest): Promise<AuthTokensResponse> {
    const response = await this.request<ApiResponse<AuthTokensResponse>>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  }

  async register(body: RegisterRequest): Promise<AuthTokensResponse> {
    const response = await this.request<ApiResponse<AuthTokensResponse>>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.request<ApiResponse<null>>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const response = await this.request<ApiResponse<AuthTokensResponse>>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    return response.data;
  }

  async forgotPassword(body: ForgotPasswordRequest): Promise<{ token?: string }> {
    const response = await this.request<ApiResponse<{ token?: string }>>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data;
  }

  async resetPassword(body: ResetPasswordRequest): Promise<void> {
    await this.request<ApiResponse<null>>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async changePassword(userId: string, body: ChangePasswordRequest): Promise<void> {
    await this.request<ApiResponse<null>>(
      '/api/auth/change-password',
      { method: 'POST', body: JSON.stringify(body) },
      userId,
    );
  }

  async getMe(userId: string): Promise<User> {
    const response = await this.request<ApiResponse<User>>(
      '/api/users/me',
      { method: 'GET' },
      userId,
    );
    return response.data;
  }

  async updateMe(userId: string, body: UpdateUser): Promise<User> {
    const response = await this.request<ApiResponse<User>>(
      '/api/users/me',
      { method: 'PATCH', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
  }

  async getSettings(userId: string): Promise<UserSetting> {
    const response = await this.request<ApiResponse<UserSetting>>(
      '/api/users/me/settings',
      { method: 'GET' },
      userId,
    );
    return response.data;
  }

  async updateSettings(userId: string, body: UpdateUserSetting): Promise<UserSetting> {
    const response = await this.request<ApiResponse<UserSetting>>(
      '/api/users/me/settings',
      { method: 'PATCH', body: JSON.stringify(body) },
      userId,
    );
    return response.data;
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
      throw new UserClientError(
        body?.error?.message ?? response.statusText,
        response.status,
        body?.error?.code ?? 'UNKNOWN',
      );
    }

    return response.json() as Promise<T>;
  }
}
