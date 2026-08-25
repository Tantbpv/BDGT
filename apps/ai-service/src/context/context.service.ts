import { Injectable } from '@nestjs/common';

import { CHAT_SYSTEM } from '../agent/prompts';
import type { LlmMessage } from '../llm/types';
import { MessageService } from '../message/message.service';

@Injectable()
export class ContextService {
  constructor(private readonly messageService: MessageService) {}

  async build(conversationId: string): Promise<LlmMessage[]> {
    const dbMessages = await this.messageService.findByConversationId(conversationId);

    const history: LlmMessage[] = dbMessages
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({
        role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }));

    return [{ role: 'system', content: CHAT_SYSTEM }, ...history];
  }
}
