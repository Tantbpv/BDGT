import { formatCurrency } from '@repo/utils/money';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/features/dashboard/types';

interface StatCardProps {
  title: string;
  value: string;
  isLoading: boolean;
  colorClass?: string;
}

function StatCard({ title, value, isLoading, colorClass }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className={`text-2xl font-semibold tabular-nums ${colorClass ?? ''}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface FinancialSummaryProps {
  stats: DashboardStats | undefined;
  isLoading: boolean;
}

export function FinancialSummary({ stats, isLoading }: FinancialSummaryProps) {
  const balanceColor =
    !isLoading && stats && parseFloat(stats.balance) < 0 ? 'text-destructive' : 'text-green-500';

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard
        title="Income"
        value={formatCurrency(stats?.totalIncome ?? '0', 'EUR')}
        isLoading={isLoading}
        colorClass="text-green-500"
      />
      <StatCard
        title="Expenses"
        value={formatCurrency(stats?.totalExpenses ?? '0', 'EUR')}
        isLoading={isLoading}
        colorClass="text-destructive"
      />
      <StatCard
        title="Balance"
        value={formatCurrency(stats?.balance ?? '0', 'EUR')}
        isLoading={isLoading}
        colorClass={balanceColor}
      />
      <StatCard
        title="Transactions"
        value={String(stats?.transactionCount ?? '—')}
        isLoading={isLoading}
      />
    </div>
  );
}
