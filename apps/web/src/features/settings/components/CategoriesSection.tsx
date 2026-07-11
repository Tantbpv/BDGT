'use client';

import type { Category } from '@repo/contracts/categories';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, ApiClientError } from '@/shared/lib/api-client';

const STRINGS = {
  title: 'Categories',
  empty: 'No categories yet.',
  newCategoryLabel: 'New category',
  newCategoryPlaceholder: 'Category name',
  addIdle: 'Add',
  addPending: 'Adding…',
  createErrorFallback: 'Failed to create category',
  deleteErrorFallback: 'Failed to delete category',
  deleteConfirm: 'Delete this category? Transactions using it will have no category.',
} as const;

type Props = {
  initialCategories: Category[];
};

export function CategoriesSection({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm(STRINGS.deleteConfirm)) return;

    setDeletingId(categoryId);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/v1/categories/${categoryId}`);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    } catch (err) {
      setDeleteError(err instanceof ApiClientError ? err.message : STRINGS.deleteErrorFallback);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setCreateError(null);
    try {
      const created = await apiClient.post<Category>('/api/v1/categories', { name });
      setCategories((prev) => [...prev, created]);
      setNewName('');
    } catch (err) {
      setCreateError(err instanceof ApiClientError ? err.message : STRINGS.createErrorFallback);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{STRINGS.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {categories.length === 0 && (
            <p className="text-muted-foreground text-sm">{STRINGS.empty}</p>
          )}
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <span className="flex flex-1 items-center rounded-md border border-input px-3 py-2 text-sm">
                {category.name}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                disabled={deletingId === category.id}
                aria-label={`Delete ${category.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {deleteError && (
          <p className="text-destructive text-sm" role="alert">
            {deleteError}
          </p>
        )}

        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="new-category">{STRINGS.newCategoryLabel}</Label>
            <Input
              id="new-category"
              placeholder={STRINGS.newCategoryPlaceholder}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
            />
          </div>
          <Button type="submit" disabled={creating || !newName.trim()}>
            {creating ? STRINGS.addPending : STRINGS.addIdle}
          </Button>
        </form>

        {createError && (
          <p className="text-destructive text-sm" role="alert">
            {createError}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
