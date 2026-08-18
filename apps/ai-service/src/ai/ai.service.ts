import { Inject, Injectable } from '@nestjs/common';
import type { AnalyzeTransactionsRequest, AnalyzeTransactionsResponse } from '@repo/contracts/ai';

import { LLM_PROVIDER, LlmProvider } from '../llm/llm.provider';

@Injectable()
export class AiService {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}
  async analyzeTransactions(request: AnalyzeTransactionsRequest): Promise<AnalyzeTransactionsResponse> {
    const transactionSummary = request.transactions
      .map((t) => `${t.type} ${t.amount} — ${t.description} (${t.date.slice(0, 10)})`)
      .join('\n')

    const response = await this.llm.complete({
      messages: [
        {
          role: 'system',
          content:
            'You are a personal finance assistant. Analyze the provided transactions and give a concise, actionable summary of spending patterns, notable items, and any recommendations.',
        },
        {
          role: 'user',
          content: `Analyze these ${request.transactions.length} transaction(s):\n\n${transactionSummary}`,
        },
      ],
      max_tokens: 1024,
    });

    return { analysis: response.content ?? 'No analysis available.' };
  }
}
