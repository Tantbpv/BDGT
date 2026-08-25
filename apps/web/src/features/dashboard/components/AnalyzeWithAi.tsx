'use client';

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyzeWithAiProps {
  dateRange: { from?: string; to?: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function AnalyzeWithAi({ dateRange }: AnalyzeWithAiProps) {
  const message =
    dateRange.from && dateRange.to
      ? `Analyze my transactions from ${formatDate(dateRange.from)} to ${formatDate(dateRange.to)}`
      : 'Analyze my recent transactions';

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
        <CardDescription>Chat with AI about your transactions for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href={`/chat?message=${encodeURIComponent(message)}`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Analyze with AI
        </Link>
      </CardContent>
    </Card>
  );
}
