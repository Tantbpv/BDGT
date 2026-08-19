import { Inject, Injectable } from '@nestjs/common';
import type {
  AnalyzeTransactionsRequest,
  AnalyzeTransactionsResponse,
  ChatRequest,
  ChatResponse,
} from '@repo/contracts/ai';

import { LLM_PROVIDER, LlmProvider } from '../llm/llm.provider';
import { ANALYZE_TRANSACTIONS_SYSTEM, CHAT_SYSTEM } from '../llm/prompts';

@Injectable()
export class AiService {
  constructor(@Inject(LLM_PROVIDER) private readonly llm: LlmProvider) {}
  async analyzeTransactions(request: AnalyzeTransactionsRequest): Promise<AnalyzeTransactionsResponse> {
    const transactionSummary = request.transactions
      .map((t) => `${t.type} ${t.amount} — ${t.description} (${t.date.slice(0, 10)})`)
      .join('\n')

    const response = await this.llm.complete({
      messages: [
        { role: 'system', content: ANALYZE_TRANSACTIONS_SYSTEM },
        { role: 'user', content: `Analyze these ${request.transactions.length} transaction(s):\n\n${transactionSummary}` },
      ],
      max_tokens: 1024,
    });

    return { analysis: response.content ?? 'No analysis available.' };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const messages = [
      { role: 'system' as const, content: CHAT_SYSTEM },
      ...request.messages,
    ];
    const response = await this.llm.complete({ messages, max_tokens: 1024 });
    return { message: response.content ?? 'No response.' };
  }
}
