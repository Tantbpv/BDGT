import type { Metadata } from 'next';

import { TransactionsView } from '@/features/transactions/components/TransactionsView';

export const metadata: Metadata = { title: 'Transactions — BDGT' };

export default function TransactionsPage() {
  return <TransactionsView />;
}
