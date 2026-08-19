'use client';

import { ArrowLeftRight, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCurrentUser } from '@/features/auth/hooks/useAuth';
import { ActiveAccountName } from '@/components/ActiveAccountName';

export function AppHeader() {
  const { data } = useCurrentUser();
  const pathname = usePathname();
  const isAuthenticated = data !== null && data !== undefined;

  const navClass = (href: string) =>
    `transition-colors px-4 py-1.5 ${pathname.startsWith(href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`;

  const strokeWidth = (href: string) => (pathname.startsWith(href) ? 2.5 : 2);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link
            href={isAuthenticated ? '/transactions' : '/login'}
            className="text-sm font-semibold tracking-tight"
          >
            BDGT
          </Link>
          {isAuthenticated && <ActiveAccountName />}
        </div>
        <nav className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <Link href="/transactions" aria-label="Transactions" className={navClass('/transactions')}>
                <ArrowLeftRight size={18} strokeWidth={strokeWidth('/transactions')} />
              </Link>
              <Link href="/dashboard" aria-label="Dashboard" className={navClass('/dashboard')}>
                <LayoutDashboard size={18} strokeWidth={strokeWidth('/dashboard')} />
              </Link>
              <Link href="/chat" aria-label="Chat" className={navClass('/chat')}>
                <MessageSquare size={18} strokeWidth={strokeWidth('/chat')} />
              </Link>
              <Link href="/settings" aria-label="Settings" className={navClass('/settings')}>
                <Settings size={18} strokeWidth={strokeWidth('/settings')} />
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
