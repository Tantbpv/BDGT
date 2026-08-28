import { Module } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, ApiKeyGuard, LoggingInterceptor],
})
export class UserModule {}
