import { Module } from '@nestjs/common';
import { LoggingInterceptor } from '@repo/nestjs-shared';

import { AgentModule } from '../agent/agent.module';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ChatController } from './chat.controller';

@Module({
  imports: [AgentModule],
  controllers: [ChatController],
  providers: [ApiKeyGuard, LoggingInterceptor],
})
export class ChatModule {}
