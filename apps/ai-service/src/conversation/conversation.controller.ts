import { Controller, ForbiddenException, Get, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import type { ChatMessage, ConversationHistoryResponse } from '@repo/contracts/ai';
import type { ApiResponse } from '@repo/contracts/common';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';
import { z } from 'zod';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { MessageService } from '../message/message.service';
import { ConversationService } from './conversation.service';

const GetHistoryQuerySchema = z.object({ userId: z.string().cuid() });
type GetHistoryQuery = z.infer<typeof GetHistoryQuerySchema>;

@Controller('conversations')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  @Get(':id/messages')
  async getMessages(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(GetHistoryQuerySchema)) query: GetHistoryQuery,
  ): Promise<ApiResponse<ConversationHistoryResponse>> {
    const conversation = await this.conversationService.findById(id);
    if (conversation.userId !== query.userId) throw new ForbiddenException();
    const dbMessages = await this.messageService.findByConversationId(id);
    const messages: ChatMessage[] = dbMessages
      .filter((m) => m.role === 'USER' || m.role === 'ASSISTANT')
      .map((m) => ({ role: m.role === 'USER' ? ('user' as const) : ('assistant' as const), content: m.content }));
    return { data: { messages } };
  }
}
