import { Controller, Get, Headers, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import type { ApiResponse } from '@repo/contracts/common';
import {
  type DashboardStats,
  type DashboardStatsQuery,
  DashboardStatsQuerySchema,
} from '@repo/contracts/statistics';
import { LoggingInterceptor , ZodValidationPipe } from '@repo/nestjs-shared';

import { ApiKeyGuard } from '../guards/api-key.guard';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(ApiKeyGuard)
@UseInterceptors(LoggingInterceptor)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  async getDashboardStats(
    @Headers('x-user-id') userId: string,
    @Query(new ZodValidationPipe(DashboardStatsQuerySchema)) query: DashboardStatsQuery,
  ): Promise<ApiResponse<DashboardStats>> {
    const stats = await this.statisticsService.getDashboardStats(userId, query);
    return { data: stats };
  }
}
