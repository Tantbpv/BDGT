import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AnalyzeTransactionsResponse } from '@repo/contracts/ai';
import { AnalyzeTransactionsRequestSchema } from '@repo/contracts/ai';
import type { ApiResponse } from '@repo/contracts/common';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(ApiKeyGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  analyze(@Body() body: unknown): ApiResponse<AnalyzeTransactionsResponse> {
    const result = AnalyzeTransactionsRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return { data: this.aiService.analyzeTransactions(result.data) };
  }
}
