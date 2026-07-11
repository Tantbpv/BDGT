'use client';

import { endOfMonth, startOfMonth } from '@repo/utils/date';
import { useState } from 'react';

import { useDashboardStats } from '../hooks/useDashboardStats';
import { DateRangeFilter } from './DateRangeFilter';
import { FinancialSummary } from './FinancialSummary';
import { Insights } from './Insights';

const defaultRange = {
  from: startOfMonth().toISOString(),
  to: endOfMonth().toISOString(),
};

export function DashboardView() {
  const [dateRange, setDateRange] = useState(defaultRange);
  const { data: stats, isPending, isError, error } = useDashboardStats(dateRange);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      {isError && (
        <p className="text-destructive text-sm" role="alert">
          {error.message}
        </p>
      )}
      <FinancialSummary stats={stats} isLoading={isPending} />
      <Insights />
    </div>
  );
}
