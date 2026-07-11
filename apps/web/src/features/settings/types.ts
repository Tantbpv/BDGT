export type { Account, CreateAccount } from '@repo/contracts/accounts';
export type { Currency,UpdateUserSetting, UserSetting } from '@repo/contracts/users';

export const CURRENCIES: { value: string; label: string }[] = [
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'UAH', label: 'Ukrainian Hryvnia (UAH)' },
];
