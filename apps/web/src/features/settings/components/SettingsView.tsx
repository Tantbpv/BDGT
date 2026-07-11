'use client';

import { AccountsSection } from './AccountsSection';
import { CategoriesSection } from './CategoriesSection';
import { ChangePasswordSection } from './ChangePasswordSection';
import { CurrencySection } from './CurrencySection';
import { SignOutSection } from './SignOutSection';

export function SettingsView() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <CurrencySection />
      <AccountsSection />
      <CategoriesSection />
      <ChangePasswordSection />
      <SignOutSection />
    </div>
  );
}
