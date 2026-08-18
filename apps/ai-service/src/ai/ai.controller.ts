import { BadRequestException, Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import type { AnalyzeTransactionsResponse } from '@repo/contracts/ai';
import { AnalyzeTransactionsRequestSchema } from '@repo/contracts/ai';
import type { ApiResponse } from '@repo/contracts/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  async analyze(@Body() body: unknown): Promise<ApiResponse<AnalyzeTransactionsResponse>> {
    const result = AnalyzeTransactionsRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return { data: await this.aiService.analyzeTransactions(result.data) };
  }
}
