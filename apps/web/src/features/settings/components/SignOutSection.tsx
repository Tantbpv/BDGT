'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'Sign out',
  buttonIdle: 'Sign out',
  buttonPending: 'Signing out…',
} as const;

export function SignOutSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await apiClient.delete('/api/v1/auth/logout');
    } finally {
      router.push('/login');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => { void handleSignOut(); }}
          disabled={loading}
        >
          {loading ? STRINGS.buttonPending : STRINGS.buttonIdle}
        </Button>
      </CardContent>
    </Card>
  );
}
