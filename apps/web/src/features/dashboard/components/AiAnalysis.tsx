'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyzeTransactions } from '@/features/transactions/hooks/useTransactions';

interface AiAnalysisProps {
  dateRange: { from?: string; to?: string };
}

export function AiAnalysis({ dateRange }: AiAnalysisProps) {
  const analyze = useAnalyzeTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Analysis</CardTitle>
        <CardDescription>Analyze your transactions with AI</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button variant="outline" onClick={() => analyze.mutate(dateRange)} disabled={analyze.isPending}>
          {analyze.isPending ? 'Analyzing…' : 'Analyze with AI'}
        </Button>
        {analyze.isError && (
          <p className="text-destructive text-sm" role="alert">
            {analyze.error.message}
          </p>
        )}
        {analyze.data && (
          <p className="text-sm whitespace-pre-wrap">{analyze.data.analysis}</p>
        )}
      </CardContent>
    </Card>
  );
}
