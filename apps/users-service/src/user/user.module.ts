import { Module } from '@nestjs/common';
import { LoggingInterceptor } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, ApiKeyGuard, LoggingInterceptor],
})
export class UserModule {}
