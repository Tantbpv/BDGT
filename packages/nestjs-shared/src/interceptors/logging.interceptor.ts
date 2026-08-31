import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = req;
    const start = Date.now();

    this.logger.log({ method, url, body }, 'Incoming request');

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log({ method, url, duration }, `Request completed in ${duration}ms`);
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          const error = err instanceof Error ? err.message : String(err);
          this.logger.error({ method, url, duration, error }, `Request failed in ${duration}ms`);
        },
      }),
    );
  }
}
