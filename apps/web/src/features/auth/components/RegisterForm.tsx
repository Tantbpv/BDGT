'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterRequest, RegisterRequestSchema } from '@repo/contracts/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthResponse } from '@/features/auth/types';
import { apiClient,ApiClientError } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'Create your account',
  nameLabel: 'Name',
  nameOptional: '(optional)',
  namePlaceholder: 'Your name',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  submitIdle: 'Create account',
  submitPending: 'Creating account…',
  errorFallback: 'Something went wrong. Please try again.',
  hasAccountPrompt: 'Already have an account?',
  signInLink: 'Sign in',
} as const;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              {STRINGS.nameLabel}{' '}
              <span className="text-muted-foreground">{STRINGS.nameOptional}</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={STRINGS.namePlaceholder}
              autoComplete="name"
              {...register('name')}
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{STRINGS.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              placeholder={STRINGS.emailPlaceholder}
              autoComplete="email"
              {...register('email')}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{STRINGS.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
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
            {STRINGS.hasAccountPrompt}{' '}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              {STRINGS.signInLink}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
