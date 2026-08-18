'use client';

import { startOfMonth } from '@repo/utils/date';
import { useState } from 'react';

import { useSettings } from '@/features/settings/hooks/useSettings';

import { useDashboardStats } from '../hooks/useDashboardStats';
import { AiAnalysis } from './AiAnalysis';
import { DateRangeFilter } from './DateRangeFilter';
import { FinancialSummary } from './FinancialSummary';
import { Insights } from './Insights';

const now = new Date();
const defaultRange = {
  from: startOfMonth().toISOString(),
  to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString(),
};

export function DashboardView() {
  const [dateRange, setDateRange] = useState(defaultRange);
  const { data: stats, isPending, isError, error } = useDashboardStats(dateRange);
  const { data: settings } = useSettings();
  const currency = settings?.currency;
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      {isError && (
        <p className="text-destructive text-sm" role="alert">
          {error.message}
        </p>
      )}
      <FinancialSummary stats={stats} isLoading={isPending} currency={currency} />
      <Insights />
      <AiAnalysis dateRange={dateRange} />
    </div>
  );
}
