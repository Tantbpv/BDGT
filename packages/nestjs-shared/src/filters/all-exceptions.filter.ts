import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';

// Catches everything that HttpExceptionFilter does not — unhandled errors, thrown strings, etc.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error({ err: exception }, 'Unhandled exception');

    response.status(500).json({ error: { statusCode: 500, message } });
  }
}
