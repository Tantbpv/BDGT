'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginRequest, LoginRequestSchema } from '@repo/contracts/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthResponse } from '@/features/auth/types';
import { ApiClientError, apiPost } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'Sign in to BDGT',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  submitIdle: 'Sign in',
  submitPending: 'Signing in…',
  errorFallback: 'Something went wrong. Please try again.',
  noAccountPrompt: "Don't have an account?",
  registerLink: 'Register',
} as const;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await apiPost<AuthResponse>('/api/v1/auth/login', data);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message);
      } else {
        setServerError(STRINGS.errorFallback);
      }
    }
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{STRINGS.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder={STRINGS.emailPlaceholder}
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{STRINGS.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-destructive text-sm" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? STRINGS.submitPending : STRINGS.submitIdle}
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            {STRINGS.noAccountPrompt}{' '}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              {STRINGS.registerLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
