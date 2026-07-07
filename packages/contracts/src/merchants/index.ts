import { z } from 'zod';

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  website: z.string().url().nullable(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Merchant = z.infer<typeof MerchantSchema>;

export const CreateMerchantSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url('Must be a valid URL').optional().nullable(),
});

export type CreateMerchant = z.infer<typeof CreateMerchantSchema>;

export const UpdateMerchantSchema = CreateMerchantSchema.partial();
export type UpdateMerchant = z.infer<typeof UpdateMerchantSchema>;
