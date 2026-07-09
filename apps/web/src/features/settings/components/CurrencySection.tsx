'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CURRENCIES } from '@/features/settings/types';
import { apiClient, ApiClientError } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'User Settings',
  currencyLabel: 'Currency',
  saveIdle: 'Save changes',
  savePending: 'Saving…',
  saveDone: 'Saved!',
  errorFallback: 'Failed to save settings',
} as const;

export function CurrencySection({ initialCurrency }: { initialCurrency: string }) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient.patch('/api/v1/users/me/settings', { currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : STRINGS.errorFallback);
    } finally {
      setSaving(false);
    }
  };

  const buttonLabel = saving ? STRINGS.savePending : saved ? STRINGS.saveDone : STRINGS.saveIdle;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currency">{STRINGS.currencyLabel}</Label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <Button onClick={() => void handleSave()} disabled={saving} className="self-start">
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
