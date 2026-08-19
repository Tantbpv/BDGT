import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import type {
  AnalyzeTransactionsRequest,
  AnalyzeTransactionsResponse,
  ChatRequest,
  ChatResponse,
} from '@repo/contracts/ai';
import { AnalyzeTransactionsRequestSchema, ChatRequestSchema } from '@repo/contracts/ai';
import type { ApiResponse } from '@repo/contracts/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  async analyze(
    @Body(new ZodValidationPipe(AnalyzeTransactionsRequestSchema)) body: AnalyzeTransactionsRequest,
  ): Promise<ApiResponse<AnalyzeTransactionsResponse>> {
    return { data: await this.aiService.analyzeTransactions(body) };
  }

  @Post('chat')
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: ChatRequest,
  ): Promise<ApiResponse<ChatResponse>> {
    return { data: await this.aiService.chat(body) };
  }
}
