import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { DashboardStats, DashboardStatsQuery } from '@repo/contracts/statistics';
import { PrismaService } from '@repo/nestjs-shared';

import { UserSettingService } from '../user-setting/user-setting.service';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userSettingService: UserSettingService,
  ) {}

  async getDashboardStats(userId: string, query: DashboardStatsQuery): Promise<DashboardStats> {
    if (!userId) throw new UnauthorizedException();

    const accountId = await this.userSettingService.getActiveAccountId(userId);
    if (!accountId) throw new BadRequestException('No active account');

    const { from, to } = query;
    const dateFilter =
      from ?? to
        ? {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          }
        : undefined;

    const where = { accountId, ...(dateFilter && { date: dateFilter }) };

    const [incomeResult, expenseResult, transactionCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const income = parseFloat((incomeResult._sum.amount ?? 0).toString());
    const expenses = parseFloat((expenseResult._sum.amount ?? 0).toString());
    const balance = (income - expenses).toFixed(2);

    return {
      totalIncome: income.toFixed(2),
      totalExpenses: expenses.toFixed(2),
      balance,
      transactionCount,
    };
  }
}
