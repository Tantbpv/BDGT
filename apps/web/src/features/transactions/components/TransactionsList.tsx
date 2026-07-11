'use client';

import type { Transaction } from '@repo/contracts/transactions';
import { formatDate } from '@repo/utils/date';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STRINGS = {
  title: 'Transactions',
  empty: 'No transactions yet.',
} as const;

interface Props {
  transactions: Transaction[];
}

function formatAmount(amount: string): string {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TransactionsList({ transactions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{STRINGS.empty}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/transactions/${t.id}`}
                  className="flex items-center justify-between py-3 transition-opacity hover:opacity-80"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{t.description}</span>
                    <span className="text-muted-foreground text-xs">{formatDate(t.date)}</span>
                  </div>
                  <span
                    className={`tabular-nums text-sm font-medium ${
                      t.type === 'INCOME' ? 'text-green-500' : 'text-destructive'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : '−'}
                    {formatAmount(t.amount)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
