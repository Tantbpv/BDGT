import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value import required for emitDecoratorMetadata
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export function createApiKeyGuard(configKey: string): Type<CanActivate> {
  @Injectable()
  class ApiKeyGuardImpl implements CanActivate {
    constructor(private readonly config: ConfigService) {}

    canActivate(ctx: ExecutionContext): boolean {
      const key = ctx.switchToHttp().getRequest<Request>().headers['x-api-key'];
      if (key !== this.config.get(configKey)) {
        throw new UnauthorizedException('Invalid or missing API key');
      }
      return true;
    }
  }
  return ApiKeyGuardImpl;
}
