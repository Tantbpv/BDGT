'use client';

import { formatDateTime } from '@repo/utils/date';
import { formatCurrency } from '@repo/utils/money';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { useDeleteTransaction, useTransaction } from '../hooks/useTransactions';

const STRINGS = {
  title: 'Transaction',
  cardTitle: 'Details',
  labelDescription: 'Description',
  labelAmount: 'Amount',
  labelDate: 'Date',
  labelType: 'Type',
  labelCreatedBy: 'Created by',
  typeIncome: 'Income',
  typeExpense: 'Expense',
  back: '← Back',
  deleteIdle: 'Delete',
  deleteConfirm: 'Are you sure?',
  deleteDeleting: 'Deleting…',
  deleteCancel: 'Cancel',
  loadingText: 'Loading…',
  errorFallback: 'Failed to load transaction',
  deleteErrorFallback: 'Failed to delete transaction',
} as const;

type DeleteState = 'idle' | 'confirming' | 'deleting';

const DELETE_LABELS: Record<DeleteState, string> = {
  idle: STRINGS.deleteIdle,
  confirming: STRINGS.deleteConfirm,
  deleting: STRINGS.deleteDeleting,
};

interface Props {
  id: string;
}

export function TransactionDetailView({ id }: Props) {
  const router = useRouter();
  const { data: transaction, isPending, isError, error } = useTransaction(id);
  const deleteTransaction = useDeleteTransaction();
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleDelete() {
    if (deleteState === 'idle') {
      setDeleteState('confirming');
      return;
    }
    if (deleteState === 'confirming') {
      setDeleteState('deleting');
      setDeleteError(null);
      deleteTransaction.mutate(id, {
        onSuccess: () => router.push('/transactions'),
        onError: (err) => {
          setDeleteError(err.message ?? STRINGS.deleteErrorFallback);
          setDeleteState('idle');
        },
      });
    }
  }

  const deleteLabel = DELETE_LABELS[deleteState];

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
          {STRINGS.back}
        </Link>
        <h1 className="text-2xl font-semibold">{STRINGS.title}</h1>
      </div>

      {isPending && <p className="text-muted-foreground text-sm">{STRINGS.loadingText}</p>}
      {isError && <p className="text-destructive text-sm" role="alert">{error.message}</p>}

      {transaction && (
        <Card>
          <CardHeader>
            <CardTitle>{STRINGS.cardTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{STRINGS.labelDescription}</span>
              <span className="font-medium">{transaction.description}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{STRINGS.labelAmount}</span>
              <span className={`font-medium ${transaction.type === 'INCOME' ? 'text-green-500' : 'text-destructive'}`}>
                {transaction.type === 'INCOME' ? '+' : '−'}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{STRINGS.labelDate}</span>
              <span className="font-medium">{formatDateTime(transaction.date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{STRINGS.labelType}</span>
              <span className="font-medium">
                {transaction.type === 'INCOME' ? STRINGS.typeIncome : STRINGS.typeExpense}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{STRINGS.labelCreatedBy}</span>
              <span className="font-medium">{transaction.createdByName}</span>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteState === 'deleting'}
                >
                  {deleteLabel}
                </Button>
                {deleteState === 'confirming' && (
                  <Button variant="outline" onClick={() => setDeleteState('idle')}>
                    {STRINGS.deleteCancel}
                  </Button>
                )}
              </div>
              {deleteError && (
                <p className="text-destructive text-sm" role="alert">{deleteError}</p>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
