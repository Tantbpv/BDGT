import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    accounts: 'src/accounts/index.ts',
    ai: 'src/ai/index.ts',
    auth: 'src/auth/index.ts',
    categories: 'src/categories/index.ts',
    common: 'src/common/index.ts',
    transactions: 'src/transactions/index.ts',
    users: 'src/users/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['zod'],
});
