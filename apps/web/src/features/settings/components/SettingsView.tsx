'use client';

import { useEffect, useState } from 'react';

import type { Account, UserSetting } from '@/features/settings/types';
import { apiClient, ApiClientError } from '@/shared/lib/api-client';

import { AccountsSection } from './AccountsSection';
import { ChangePasswordSection } from './ChangePasswordSection';
import { CurrencySection } from './CurrencySection';
import { SignOutSection } from './SignOutSection';

export function SettingsView() {
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [loadedSettings, loadedAccounts] = await Promise.all([
          apiClient.get<UserSetting>('/api/v1/users/me/settings'),
          apiClient.get<Account[]>('/api/v1/accounts'),
        ]);
        setSettings(loadedSettings);
        setAccounts(loadedAccounts);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error}
      </p>
    );
  }

  if (!settings) return null;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <CurrencySection initialCurrency={settings.currency} />
      <AccountsSection
        initialAccounts={accounts}
        initialActiveAccountId={settings.activeAccountId}
      />
      <ChangePasswordSection />
      <SignOutSection />
    </div>
  );
}
