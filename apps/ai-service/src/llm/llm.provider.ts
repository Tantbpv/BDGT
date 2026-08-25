import { Logger } from '@nestjs/common';

import type { LlmCompletionRequest, LlmCompletionResponse } from './types';

export const LLM_PROVIDER = 'LLM_PROVIDER';

export abstract class LlmProvider {
  private readonly logger = new Logger(LlmProvider.name);

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    this.logger.log(
      {
        model: req.model,
        messageCount: req.messages.length,
        tools: req.tools?.map((t) => t.function.name),
        messages: req.messages.filter((m) => m.role !== 'system'),
        tool_choice: req.tool_choice,
      },
      'LLM request',
    );

    const start = Date.now();
    const response = await this.doComplete(req);
    const duration = Date.now() - start;

    this.logger.log(
      {
        finish_reason: response.finish_reason,
        // usage: response.usage,
        toolCalls: response.tool_calls?.map((c) => c.function.name),
        content: response.content,
        duration,
      },
      `LLM response in ${duration}ms`,
    );

    return response;
  }

  protected abstract doComplete(req: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}
