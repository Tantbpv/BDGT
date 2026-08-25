import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ChatController } from './chat.controller';

@Module({
  imports: [AgentModule],
  controllers: [ChatController],
  providers: [ApiKeyGuard, LoggingInterceptor],
})
export class ChatModule {}
