'use client';

import { type LoginRequest, type RegisterRequest } from '@repo/contracts/auth';
import type { ApiResponse } from '@repo/contracts/common';
import type { User } from '@repo/contracts/users';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { AuthResponse } from '@/features/auth/types';
import { apiClient } from '@/shared/lib/api-client';
import { queryKeys } from '@/shared/lib/query-keys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: () => apiClient.get<ApiResponse<User>>('/api/v1/users/me'),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.post<AuthResponse>('/api/v1/auth/login', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
      router.refresh();
      router.push('/transactions');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterRequest) => apiClient.post<AuthResponse>('/api/v1/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
      router.refresh();
      router.push('/transactions');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete('/api/v1/auth/logout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
      router.refresh();
      router.push('/login');
    },
  });
}
