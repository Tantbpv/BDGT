import { Module } from '@nestjs/common';
import { LoggingInterceptor } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ApiKeyGuard, LoggingInterceptor],
})
export class AuthModule {}
