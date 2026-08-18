import { Injectable } from '@nestjs/common';
import { AnalyzeTransactionsRequest, AnalyzeTransactionsResponse } from '@repo/contracts/ai';

@Injectable()
export class AiService {
  analyzeTransactions(request: AnalyzeTransactionsRequest): AnalyzeTransactionsResponse {
    return {
      analysis: `Stub analysis for ${request.transactions.length} transaction(s).`,
    };
  }
}
