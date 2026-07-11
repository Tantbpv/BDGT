'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { CURRENCIES } from '../types';

const STRINGS = {
  title: 'User Settings',
  currencyLabel: 'Currency',
  saveIdle: 'Save changes',
  savePending: 'Saving…',
  saveDone: 'Saved!',
} as const;

export function CurrencySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [currency, setCurrency] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings?.currency) setCurrency(settings.currency);
  }, [settings?.currency]);

  const handleSave = async () => {
    setSaved(false);
    try {
      await updateSettings.mutateAsync({ currency: currency as 'EUR' | 'USD' | 'UAH' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // error shown via updateSettings.isError
    }
  };

  let buttonLabel: string = STRINGS.saveIdle;
  if (updateSettings.isPending) buttonLabel = STRINGS.savePending;
  else if (saved) buttonLabel = STRINGS.saveDone;

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
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:[color-scheme:dark]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {updateSettings.isError && (
          <p className="text-destructive text-sm" role="alert">
            {updateSettings.error.message}
          </p>
        )}

        <Button onClick={() => { void handleSave(); }} disabled={updateSettings.isPending} className="self-start">
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
