'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useSettings,
  useUpdateSettings,
} from '../hooks/useSettings';

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

export function AccountsSection() {
  const { data: accounts = [] } = useAccounts();
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const [newName, setNewName] = useState('');

  const activeAccountId = settings?.activeAccountId ?? null;

  const handleSelect = (accountId: string) => {
    updateSettings.mutate({ activeAccountId: accountId });
  };

  const handleDelete = (accountId: string) => {
    if (!window.confirm(STRINGS.deleteConfirm)) return;
    deleteAccount.mutate(accountId);
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createAccount.mutate({ name }, {
      onSuccess: () => setNewName(''),
    });
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
                disabled={accounts.length <= 1 || (deleteAccount.isPending && deleteAccount.variables === account.id)}
                aria-label={`Delete ${account.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {updateSettings.isError && (
          <p className="text-destructive text-sm" role="alert">
            {updateSettings.error.message}
          </p>
        )}
        {deleteAccount.isError && (
          <p className="text-destructive text-sm" role="alert">
            {deleteAccount.error.message}
          </p>
        )}

        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="new-account">{STRINGS.newAccountLabel}</Label>
            <Input
              id="new-account"
              placeholder={STRINGS.newAccountPlaceholder}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={createAccount.isPending}
            />
          </div>
          <Button type="submit" disabled={createAccount.isPending || !newName.trim()}>
            {createAccount.isPending ? STRINGS.addPending : STRINGS.addIdle}
          </Button>
        </form>

        {createAccount.isError && (
          <p className="text-destructive text-sm" role="alert">
            {createAccount.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
