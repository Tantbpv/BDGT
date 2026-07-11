import { useQuery } from '@tanstack/react-query';

import type { DashboardStats } from '@/features/dashboard/types';
import { apiClient } from '@/shared/lib/api-client';
import { queryKeys } from '@/shared/lib/query-keys';

interface Params {
  from: string;
  to: string;
}

export function useDashboardStats(params: Params) {
  const search = new URLSearchParams({ from: params.from, to: params.to }).toString();
  return useQuery({
    queryKey: queryKeys.stats(params),
    queryFn: () => apiClient.get<DashboardStats>(`/api/v1/stats?${search}`),
  });
}
