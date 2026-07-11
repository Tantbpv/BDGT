export const queryKeys = {
  currentUser: () => ['currentUser'] as const,
  transactions: () => ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  categories: () => ['categories'] as const,
  accounts: () => ['accounts'] as const,
  settings: () => ['settings'] as const,
  stats: (params: { from: string; to: string }) => ['stats', params] as const,
};
