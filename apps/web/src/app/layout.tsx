import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BDGT',
  description: 'Personal finance budgeting application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
