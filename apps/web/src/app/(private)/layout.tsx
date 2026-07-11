export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <main className="flex flex-1 flex-col items-center p-4">{children}</main>
    </div>
  );
}
