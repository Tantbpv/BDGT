export const queryKeys = {
  transactions: () => ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  categories: () => ['categories'] as const,
  accounts: () => ['accounts'] as const,
  settings: () => ['settings'] as const,
};
