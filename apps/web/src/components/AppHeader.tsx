import { Settings } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/transactions" className="text-sm font-semibold tracking-tight">
          BDGT
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
