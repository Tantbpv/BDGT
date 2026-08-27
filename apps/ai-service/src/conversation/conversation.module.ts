import { Module } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { MessageModule } from '../message/message.module';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [MessageModule],
  controllers: [ConversationController],
  providers: [ConversationService, ApiKeyGuard, LoggingInterceptor],
  exports: [ConversationService],
})
export class ConversationModule {}
