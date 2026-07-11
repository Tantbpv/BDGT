'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type RegisterRequest, RegisterRequestSchema } from '@repo/contracts/auth';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegister } from '@/features/auth/hooks/useAuth';
import { ApiClientError } from '@/shared/lib/api-client';

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
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
  });

  const onSubmit = handleSubmit((data) => { registerMutation.mutate(data); });

  let serverError: string | null = null;
  if (registerMutation.error instanceof ApiClientError) {
    serverError = registerMutation.error.message;
  } else if (registerMutation.error !== null && registerMutation.error !== undefined) {
    serverError = STRINGS.errorFallback;
  }

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

          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? STRINGS.submitPending : STRINGS.submitIdle}
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
