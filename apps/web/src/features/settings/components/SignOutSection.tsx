'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLogout } from '@/features/auth/hooks/useAuth';

const STRINGS = {
  title: 'Sign out',
  buttonIdle: 'Sign out',
  buttonPending: 'Signing out…',
} as const;

export function SignOutSection() {
  const logout = useLogout();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => { logout.mutate(); }}
          disabled={logout.isPending}
        >
          {logout.isPending ? STRINGS.buttonPending : STRINGS.buttonIdle}
        </Button>
      </CardContent>
    </Card>
  );
}
