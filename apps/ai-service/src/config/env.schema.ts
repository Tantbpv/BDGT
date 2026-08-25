import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  DATABASE_URL: z.string().url(),
  AI_SERVICE_KEY: z.string().min(1),
  LLM_PROVIDER: z.enum(['anthropic', 'ollama']).default('ollama'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OLLAMA_HOST: z.string().url().default('http://localhost:666'),
  LLM_MODEL: z.string().optional(),
});

export const envSchema = baseSchema.refine(
  (env) => env.LLM_PROVIDER !== 'anthropic' || !!env.ANTHROPIC_API_KEY,
  { message: 'ANTHROPIC_API_KEY is required when LLM_PROVIDER is "anthropic"', path: ['ANTHROPIC_API_KEY'] },
);

export type EnvConfig = z.infer<typeof baseSchema>;
