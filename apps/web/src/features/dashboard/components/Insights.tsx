import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Insights() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights</CardTitle>
        <CardDescription>Charts and spending breakdowns — coming soon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No insights available yet
        </div>
      </CardContent>
    </Card>
  );
}
