import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Message, Tool } from 'ollama';
import { Ollama } from 'ollama';

import type { EnvConfig } from '../../config/env.schema';
import { LlmProvider } from '../llm.provider';
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmMessage,
  LlmTool,
  LlmToolCall,
} from '../types';

@Injectable()
export class OllamaProvider extends LlmProvider {
  private readonly client: Ollama;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService<EnvConfig, true>) {
    super();
    this.client = new Ollama({ host: config.get('OLLAMA_HOST') });
    this.defaultModel = config.get('LLM_MODEL') ?? 'llama3.2';
  }

  protected async doComplete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const response = await this.client.chat({
      model: req.model ?? this.defaultModel,
      messages: this.toOllamaMessages(req.messages),
      ...(req.tools && { tools: this.toOllamaTools(req.tools) }),
      options: {
        ...(req.temperature !== undefined && { temperature: req.temperature }),
        ...(req.max_tokens !== undefined && { num_predict: req.max_tokens }),
      },
    });

    return this.fromOllamaResponse(response);
  }

  private toOllamaMessages(messages: LlmMessage[]): Message[] {
    return messages.map((m): Message => {
      if (m.role === 'assistant' && m.tool_calls?.length) {
        return {
          role: m.role,
          content: m.content ?? '',
          tool_calls: m.tool_calls.map((tc) => ({
            function: {
              name: tc.function.name,
              arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
            },
          })),
        };
      }
      return { role: m.role, content: m.content ?? '' };
    });
  }

  private toOllamaTools(tools: LlmTool[]): Tool[] {
    return tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      },
    }));
  }

  private fromOllamaResponse(
    response: Awaited<ReturnType<Ollama['chat']>>,
  ): LlmCompletionResponse {
    const toolCalls: LlmToolCall[] =
      response.message.tool_calls?.map((tc) => ({
        id: `call_${tc.function.name}_${Date.now()}`,
        type: 'function' as const,
        function: {
          name: tc.function.name,
          arguments: JSON.stringify(tc.function.arguments),
        },
      })) ?? [];

    let finishReason: LlmCompletionResponse['finish_reason'];
    if (response.done_reason === 'tool_calls' || toolCalls.length > 0) {
      finishReason = 'tool_calls';
    } else if (response.done_reason === 'length') {
      finishReason = 'length';
    } else {
      finishReason = 'stop';
    }

    return {
      content: response.message.content || null,
      ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
      finish_reason: finishReason,
      usage: {
        prompt_tokens: response.prompt_eval_count ?? 0,
        completion_tokens: response.eval_count ?? 0,
        total_tokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
      },
    };
  }
}
