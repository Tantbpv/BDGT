import { z } from 'zod';

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateAccount = z.infer<typeof CreateAccountSchema>;
