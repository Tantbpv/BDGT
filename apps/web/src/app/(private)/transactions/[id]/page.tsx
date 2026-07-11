import type { Metadata } from 'next';

import { TransactionDetailView } from '@/features/transactions/components/TransactionDetailView';

export const metadata: Metadata = { title: 'Transaction — BDGT' };

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TransactionDetailView id={id} />;
}
