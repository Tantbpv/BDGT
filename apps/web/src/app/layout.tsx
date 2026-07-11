import './globals.css';

import type { Metadata } from 'next';
import { Geist } from 'next/font/google';

import { AppHeader } from '@/components/AppHeader';
import { cn } from '@/lib/utils';

import { Providers } from './providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'BDGT',
  description: 'Personal finance budgeting application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('dark font-sans', geist.variable)}>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
