'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordRequestSchema } from '@repo/contracts/auth';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, apiClient } from '@/shared/lib/api-client';

const FormSchema = ChangePasswordRequestSchema.extend({
  confirmNewPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

type FormValues = z.infer<typeof FormSchema>;

const STRINGS = {
  title: 'Change Password',
  currentPasswordLabel: 'Current password',
  newPasswordLabel: 'New password',
  confirmPasswordLabel: 'Confirm new password',
  submitIdle: 'Change password',
  submitPending: 'Changing…',
  successMessage: 'Password changed successfully',
  errorFallback: 'Failed to change password',
} as const;

export function ChangePasswordSection() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setSuccess(false);
    try {
      await apiClient.post('/api/v1/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : STRINGS.errorFallback);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentPassword">{STRINGS.currentPasswordLabel}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p className="text-destructive text-sm">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newPassword">{STRINGS.newPasswordLabel}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p className="text-destructive text-sm">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmNewPassword">{STRINGS.confirmPasswordLabel}</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmNewPassword')}
            />
            {errors.confirmNewPassword && (
              <p className="text-destructive text-sm">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-destructive text-sm" role="alert">
              {serverError}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-500" role="status">
              {STRINGS.successMessage}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? STRINGS.submitPending : STRINGS.submitIdle}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
