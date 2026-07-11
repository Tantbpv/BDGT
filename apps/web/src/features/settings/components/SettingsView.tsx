'use client';

import type { Category } from '@repo/contracts/categories';
import { useEffect, useState } from 'react';

import type { Account, UserSetting } from '@/features/settings/types';
import { apiClient, ApiClientError } from '@/shared/lib/api-client';

import { AccountsSection } from './AccountsSection';
import { CategoriesSection } from './CategoriesSection';
import { ChangePasswordSection } from './ChangePasswordSection';
import { CurrencySection } from './CurrencySection';
import { SignOutSection } from './SignOutSection';

export function SettingsView() {
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [loadedSettings, loadedAccounts, loadedCategories] = await Promise.all([
          apiClient.get<UserSetting>('/api/v1/users/me/settings'),
          apiClient.get<Account[]>('/api/v1/accounts'),
          apiClient.get<Category[]>('/api/v1/categories'),
        ]);
        setSettings(loadedSettings);
        setAccounts(loadedAccounts);
        setCategories(loadedCategories);
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
      <CategoriesSection initialCategories={categories} />
      <ChangePasswordSection />
      <SignOutSection />
    </div>
  );
}
