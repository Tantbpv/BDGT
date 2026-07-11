'use client';

import { useCategories } from '@/features/settings/hooks/useSettings';

import { useTransactions } from '../hooks/useTransactions';
import { AddTransactionForm } from './AddTransactionForm';
import { TransactionsList } from './TransactionsList';

export function TransactionsView() {
  const categories = useCategories();
  const transactions = useTransactions();

  const loading = categories.isPending || transactions.isPending;
  const errorMessage = (transactions.error ?? categories.error)?.message;

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (errorMessage) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {errorMessage}
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <AddTransactionForm categories={categories.data ?? []} />
      <TransactionsList transactions={transactions.data ?? []} />
    </div>
  );
}
