'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Category } from '@repo/contracts/categories';
import { TransactionTypeSchema } from '@repo/contracts/transactions';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCreateTransaction } from '../hooks/useTransactions';

const FormSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 12.50)'),
  description: z.string().max(255).optional(),
  type: TransactionTypeSchema,
  categoryIds: z.array(z.string()),
});

type FormValues = z.infer<typeof FormSchema>;

const STRINGS = {
  title: 'Add Transaction',
  amountLabel: 'Amount',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'What was this for?',
  typeLabel: 'Type',
  categoryLabel: 'Category',
  moreOptions: 'More options',
  submitIdle: 'Add',
  submitPending: 'Adding…',
} as const;

function typeButtonClass(type: 'EXPENSE' | 'INCOME', selected: boolean): string {
  const base = 'cursor-pointer select-none rounded-full px-4 py-1.5 text-sm font-medium transition-colors';
  if (!selected) return `${base} border border-border text-muted-foreground hover:text-foreground`;
  if (type === 'EXPENSE') return `${base} bg-destructive text-destructive-foreground`;
  return `${base} bg-green-600 text-white`;
}

function deriveDescription(
  description: string | undefined,
  categoryIds: string[],
  categories: Category[],
): string {
  const categoryNames = categoryIds
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((name): name is string => name !== undefined)
    .join(', ');

  if (!description && !categoryNames) return 'Common';
  if (!description) return categoryNames;
  if (!categoryNames) return description;
  return `${description} (${categoryNames})`;
}

interface Props {
  categories: Category[];
}

export function AddTransactionForm({ categories }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createTransaction = useCreateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { type: 'EXPENSE', categoryIds: [] },
  });

  const selectedType = watch('type');
  const selectedCategoryIds = watch('categoryIds');

  function toggleCategory(id: string) {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((x) => x !== id)
      : [...selectedCategoryIds, id];
    setValue('categoryIds', next);
  }

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await createTransaction.mutateAsync({
        amount: data.amount,
        description: deriveDescription(data.description, data.categoryIds, categories),
        type: data.type,
        categoryIds: data.categoryIds,
        date: new Date().toISOString(),
      });
      reset({ amount: '', description: '', type: 'EXPENSE', categoryIds: [] });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to add transaction');
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
            <Label htmlFor="amount">{STRINGS.amountLabel}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-destructive text-sm">{errors.amount.message}</p>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>{STRINGS.categoryLabel}</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={
                      selectedCategoryIds.includes(c.id)
                        ? 'rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground transition-colors'
                        : 'rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Accordion label={STRINGS.moreOptions}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">{STRINGS.descriptionLabel}</Label>
              <Input
                id="description"
                type="text"
                placeholder={STRINGS.descriptionPlaceholder}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{STRINGS.typeLabel}</Label>
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map((t) => (
                  <label key={t} className={typeButtonClass(t, selectedType === t)}>
                    <input type="radio" className="sr-only" value={t} {...register('type')} />
                    {t === 'EXPENSE' ? 'Expense' : 'Income'}
                  </label>
                ))}
              </div>
            </div>
          </Accordion>

          {serverError && (
            <p className="text-destructive text-sm" role="alert">
              {serverError}
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
