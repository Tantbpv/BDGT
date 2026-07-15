'use client';

import { useCategories } from '@/features/settings/hooks/useSettings';

import { useInfiniteTransactions } from '../hooks/useTransactions';
import { AddTransactionForm } from './AddTransactionForm';
import { TransactionsList } from './TransactionsList';

export function TransactionsView() {
  const categories = useCategories();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error } =
    useInfiniteTransactions();

  const loading = categories.isPending || isPending;
  const errorMessage = (error ?? categories.error)?.message;

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

  const transactions = data?.pages.flat() ?? [];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <AddTransactionForm categories={categories.data ?? []} />
      <TransactionsList
        transactions={transactions}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
