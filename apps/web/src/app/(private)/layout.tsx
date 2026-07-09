import { AppHeader } from '@/components/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center p-6">{children}</main>
    </div>
  );
}
