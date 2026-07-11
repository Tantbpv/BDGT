'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCategories, useCreateCategory, useDeleteCategory } from '../hooks/useSettings';

const STRINGS = {
  title: 'Categories',
  empty: 'No categories yet.',
  newCategoryLabel: 'New category',
  newCategoryPlaceholder: 'Category name',
  addIdle: 'Add',
  addPending: 'Adding…',
  deleteConfirm: 'Delete this category? Transactions using it will have no category.',
} as const;

export function CategoriesSection() {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [newName, setNewName] = useState('');

  const handleDelete = (categoryId: string) => {
    if (!window.confirm(STRINGS.deleteConfirm)) return;
    deleteCategory.mutate(categoryId);
  };

  const handleCreate: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate({ name }, {
      onSuccess: () => setNewName(''),
    });
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
                disabled={deleteCategory.isPending && deleteCategory.variables === category.id}
                aria-label={`Delete ${category.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {deleteCategory.isError && (
          <p className="text-destructive text-sm" role="alert">
            {deleteCategory.error.message}
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
              disabled={createCategory.isPending}
            />
          </div>
          <Button type="submit" disabled={createCategory.isPending || !newName.trim()}>
            {createCategory.isPending ? STRINGS.addPending : STRINGS.addIdle}
          </Button>
        </form>

        {createCategory.isError && (
          <p className="text-destructive text-sm" role="alert">
            {createCategory.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
