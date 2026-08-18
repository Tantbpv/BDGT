import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import type { EnvConfig } from '../config/env.schema';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-api-key'];
    if (key !== this.config.get('AI_SERVICE_KEY')) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
