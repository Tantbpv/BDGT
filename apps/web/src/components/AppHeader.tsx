'use client';

import { ArrowLeftRight, LayoutDashboard, Settings } from 'lucide-react';
import Link from 'next/link';

import { useCurrentUser } from '@/features/auth/hooks/useAuth';

export function AppHeader() {
  const { data } = useCurrentUser();
  const isAuthenticated = data !== null && data !== undefined;
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
        <Link
          href={isAuthenticated ? '/transactions' : '/login'}
          className="text-sm font-semibold tracking-tight"
        >
          BDGT
        </Link>
        <nav className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <Link
                href="/transactions"
                aria-label="Transactions"
                className="text-muted-foreground transition-colors hover:text-foreground px-4 py-1.5"
              >
                <ArrowLeftRight size={18} />
              </Link>
              <Link
                href="/dashboard"
                aria-label="Dashboard"
                className="text-muted-foreground transition-colors hover:text-foreground px-4 py-1.5"
              >
                <LayoutDashboard size={18} />
              </Link>
              <Link
                href="/settings"
                aria-label="Settings"
                className="text-muted-foreground transition-colors hover:text-foreground px-4 py-1.5"
              >
                <Settings size={18} />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground px-4 py-1.5"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground px-4 py-1.5"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
