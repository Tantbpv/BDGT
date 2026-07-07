export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>BDGT</nav>
      <main>{children}</main>
    </div>
  );
}
