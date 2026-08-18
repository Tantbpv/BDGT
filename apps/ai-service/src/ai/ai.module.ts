import { Module } from '@nestjs/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ApiKeyGuard],
})
export class AiModule {}
