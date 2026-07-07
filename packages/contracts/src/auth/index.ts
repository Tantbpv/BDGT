import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100).optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const TokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export type AuthResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
