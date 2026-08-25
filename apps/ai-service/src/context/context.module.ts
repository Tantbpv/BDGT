import { Module } from '@nestjs/common';

import { MessageModule } from '../message/message.module';
import { ContextService } from './context.service';

@Module({
  imports: [MessageModule],
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
