import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Transaction — BDGT' };

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  void params;
  return (
    <div>
      <h1>Transaction Detail</h1>
    </div>
  );
}
