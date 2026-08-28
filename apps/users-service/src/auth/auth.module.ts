import { Module } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ApiKeyGuard, LoggingInterceptor],
})
export class AuthModule {}
