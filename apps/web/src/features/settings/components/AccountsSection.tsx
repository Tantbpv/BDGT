'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Account } from '@/features/settings/types';
import { apiClient, ApiClientError } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'Accounts',
  empty: 'No accounts yet.',
  newAccountLabel: 'New account',
  newAccountPlaceholder: 'Account name',
  addIdle: 'Add',
  addPending: 'Adding…',
  selectErrorFallback: 'Failed to switch account',
  createErrorFallback: 'Failed to create account',
  deleteErrorFallback: 'Failed to delete account',
  deleteConfirm: 'Delete this account and all related transactions? This cannot be undone.',
} as const;

type Props = {
  initialAccounts: Account[];
  initialActiveAccountId: string | null;
};

export function AccountsSection({ initialAccounts, initialActiveAccountId }: Props) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(initialActiveAccountId);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleSelect = async (accountId: string) => {
    const prev = activeAccountId;
    setActiveAccountId(accountId);
    setSelectError(null);
    try {
      await apiClient.patch('/api/v1/users/me/settings', { activeAccountId: accountId });
    } catch (err) {
      setActiveAccountId(prev);
      setSelectError(err instanceof ApiClientError ? err.message : STRINGS.selectErrorFallback);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!window.confirm(STRINGS.deleteConfirm)) return;

    setDeletingId(accountId);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/v1/accounts/${accountId}`);
      const remaining = accounts.filter((a) => a.id !== accountId);
      setAccounts(remaining);
      if (activeAccountId === accountId) {
        setActiveAccountId(remaining[0]?.id ?? null);
      }
    } catch (err) {
      setDeleteError(err instanceof ApiClientError ? err.message : STRINGS.deleteErrorFallback);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setCreateError(null);
    try {
      const created = await apiClient.post<Account>('/api/v1/accounts', { name });
      setAccounts((prev) => [...prev, created]);
      setNewName('');
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : STRINGS.createErrorFallback);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {accounts.length === 0 && (
            <p className="text-muted-foreground text-sm">{STRINGS.empty}</p>
          )}
          {accounts.map((account) => (
            <div key={account.id} className="flex items-center gap-2">
              <label
                className={`flex flex-1 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                  activeAccountId === account.id ? 'border-primary bg-primary/5' : 'border-input'
                }`}
              >
                <input
                  type="radio"
                  name="activeAccount"
                  value={account.id}
                  checked={activeAccountId === account.id}
                  onChange={() => handleSelect(account.id)}
                  className="accent-primary"
                />
                {account.name}
              </label>
              <button
                type="button"
                onClick={() => handleDelete(account.id)}
                disabled={accounts.length <= 1 || deletingId === account.id}
                aria-label={`Delete ${account.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {selectError && (
          <p className="text-destructive text-sm" role="alert">
            {selectError}
          </p>
        )}
        {deleteError && (
          <p className="text-destructive text-sm" role="alert">
            {deleteError}
          </p>
        )}

        <form onSubmit={(e) => handleCreate(e)} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="new-account">{STRINGS.newAccountLabel}</Label>
            <Input
              id="new-account"
              placeholder={STRINGS.newAccountPlaceholder}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
            />
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
            {creating ? STRINGS.addPending : STRINGS.addIdle}
          </Button>
        </form>

        {createError && (
          <p className="text-destructive text-sm" role="alert">
            {createError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
