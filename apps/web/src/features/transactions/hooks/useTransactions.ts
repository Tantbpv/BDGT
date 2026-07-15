import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateTransaction, Transaction } from '@/features/transactions/types';
import { apiClient } from '@/shared/lib/api-client';
import { queryKeys } from '@/shared/lib/query-keys';

const PAGE_SIZE = 20;

export function useInfiniteTransactions() {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions(),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      apiClient.get<Transaction[]>(`/api/v1/transactions?page=${pageParam}&limit=${PAGE_SIZE}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => apiClient.get<Transaction>(`/api/v1/transactions/${id}`),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransaction) =>
      apiClient.post<Transaction>('/api/v1/transactions', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/transactions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
    },
  });
}
