'use client';

import type { Transaction } from '@repo/contracts/transactions';
import { formatDate } from '@repo/utils/date';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STRINGS = {
  title: 'Transactions',
  empty: 'No transactions yet.',
  loadingMore: 'Loading more…',
} as const;

interface Props {
  transactions: Transaction[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

function formatAmount(amount: string): string {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TransactionsList({
  transactions,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const parentOffsetRef = useRef(0);

  useLayoutEffect(() => {
    parentOffsetRef.current = listRef.current?.offsetTop ?? 0;
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: transactions.length,
    estimateSize: () => 52,
    overscan: 5,
    scrollMargin: parentOffsetRef.current,
  });

  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{STRINGS.empty}</p>
        ) : (
          <>
            <ul
              ref={listRef}
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
              className="divide-y divide-border"
            >
              {virtualItems.map((virtualItem) => {
                const t = transactions[virtualItem.index];
                if (!t) return null;
                return (
                  <li
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                    }}
                  >
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
                );
              })}
            </ul>

            <div ref={sentinelRef} className="py-2 text-center">
              {isFetchingNextPage && (
                <p className="text-muted-foreground text-xs">{STRINGS.loadingMore}</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
