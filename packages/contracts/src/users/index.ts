import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const CurrencySchema = z.enum(['EUR', 'USD', 'UAH']);
export type Currency = z.infer<typeof CurrencySchema>;

export const UserSettingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  currency: CurrencySchema,
  activeAccountId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserSetting = z.infer<typeof UserSettingSchema>;

export const UpdateUserSettingSchema = z.object({
  currency: CurrencySchema.optional(),
  activeAccountId: z.string().nullable().optional(),
});

export type UpdateUserSetting = z.infer<typeof UpdateUserSettingSchema>;
