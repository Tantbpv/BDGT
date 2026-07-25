'use client';

import { useAccounts, useSettings } from '@/features/settings/hooks/useSettings';

export function ActiveAccountName() {
  const { data: settings } = useSettings();
  const { data: accounts } = useAccounts();
  const activeAccount = accounts?.find((a) => a.id === settings?.activeAccountId);
  if (!activeAccount) return null;
  return <span className="text-xs text-muted-foreground">{activeAccount.name}</span>;
}
