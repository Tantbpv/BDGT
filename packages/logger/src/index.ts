import pino, { type Logger, type LoggerOptions } from 'pino';

export type { Logger };

export function createLogger(
  options?: LoggerOptions & { service?: string },
): Logger {
  const { service, ...pinoOptions } = options ?? {};
  return pino({
    level: process.env['LOG_LEVEL'] ?? 'info',
    base: service ? { service } : undefined,
    ...pinoOptions,
  });
}

export const logger = createLogger();
