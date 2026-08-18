import { Module } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LlmModule } from '../llm/llm.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@Module({
  imports: [LlmModule],
  controllers: [AiController],
  providers: [AiService, ApiKeyGuard, LoggingInterceptor],
})
export class AiModule {}
