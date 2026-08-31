import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@repo/nestjs-shared';

import type { LlmTool } from '../../../llm/types';
import type { ToolContext, ToolDefinition } from '../tool.interface';

interface GetTransactionsArgs {
  limit?: number;
  type?: 'INCOME' | 'EXPENSE';
  from?: string;
  to?: string;
}

@Injectable()
export class GetUserTransactionsTool implements ToolDefinition<GetTransactionsArgs> {
  readonly schema: LlmTool = {
    type: 'function',
    function: {
      name: 'get_user_transactions',
      description:
        "Retrieve the authenticated user's transaction history. Use this before answering any question about their spending, income, or financial history.",
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Maximum number of transactions to return. Defaults to 50, max 100.',
          },
          type: {
            type: 'string',
            enum: ['INCOME', 'EXPENSE'],
            description: 'Filter by transaction type. Only set this when the user explicitly asks for income or expenses specifically. Omit for analysis, summaries, or any query that needs the full financial picture.',
          },
          from: {
            type: 'string',
            format: 'date',
            description: 'ISO 8601 date (YYYY-MM-DD). Return transactions on or after this date.',
          },
          to: {
            type: 'string',
            format: 'date',
            description: 'ISO 8601 date (YYYY-MM-DD). Return transactions on or before this date.',
          },
        },
        additionalProperties: false,
      },
    },
  };

  private readonly logger = new Logger(GetUserTransactionsTool.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: GetTransactionsArgs, ctx: ToolContext): Promise<string> {
    this.logger.debug({ args }, 'get_user_transactions called');
    try {
      const settings = await this.prisma.userSetting.findUnique({ where: { userId: ctx.userId } });
      if (!settings?.activeAccountId) {
        return JSON.stringify({ error: 'No active account configured for this user' });
      }

      const transactions = await this.prisma.transaction.findMany({
        where: {
          accountId: settings.activeAccountId,
          ...(args.type && { type: args.type }),
          ...(args.from ?? args.to
            ? {
                date: {
                  ...(args.from && { gte: new Date(args.from) }),
                  ...(args.to && { lte: new Date(`${args.to}T23:59:59.999Z`) }),
                },
              }
            : {}),
        },
        orderBy: { date: 'desc' },
        take: Math.min(Number(args.limit) || 50, 100),
        include: { categories: { select: { name: true } } },
      });

      const result = transactions.map((t) => ({
        id: t.id,
        amount: t.amount.toString(),
        description: t.description,
        type: t.type,
        date: t.date.toISOString().slice(0, 10),
        categories: t.categories.map((c) => c.name),
      }));

      return JSON.stringify({ transactions: result, count: result.length });
    } catch (err) {
      return JSON.stringify({ error: err instanceof Error ? err.message : 'Database error' });
    }
  }
}
