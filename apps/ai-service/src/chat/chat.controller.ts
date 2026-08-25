import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import type { ChatRequest, ChatResponse } from '@repo/contracts/ai';
import { ChatRequestSchema } from '@repo/contracts/ai';
import type { ApiResponse } from '@repo/contracts/common';

import { ChatAgentService } from '../agent/chat-agent.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@Controller('chat')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class ChatController {
  constructor(private readonly chatAgent: ChatAgentService) {}

  @Post()
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
  ): Promise<ApiResponse<ChatResponse>> {
    return {
      data: await this.chatAgent.run({
        userId: body.userId,
        conversationId: body.conversationId,
        message: body.message,
      }),
    };
  }
}
