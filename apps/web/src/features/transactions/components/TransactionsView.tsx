'use client';

import type { Category } from '@repo/contracts/categories';
import type { Transaction } from '@repo/contracts/transactions';
import { useEffect, useState } from 'react';

import { apiClient,ApiClientError } from '@/shared/lib/api-client';

import { AddTransactionForm } from './AddTransactionForm';
import { TransactionsList } from './TransactionsList';

export function TransactionsView() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reloadTransactions() {
    try {
      const data = await apiClient.get<Transaction[]>('/api/v1/transactions');
      setTransactions(data);
    } catch {
      // silently ignore refresh errors
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [cats, txs] = await Promise.all([
          apiClient.get<Category[]>('/api/v1/categories'),
          apiClient.get<Transaction[]>('/api/v1/transactions'),
        ]);
        setCategories(cats);
        setTransactions(txs);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      <AddTransactionForm categories={categories} onSuccess={reloadTransactions} />
      <TransactionsList transactions={transactions} />
    </div>
  );
}
