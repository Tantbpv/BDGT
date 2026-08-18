import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LlmProvider } from '../llm.provider';
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmMessage,
  LlmTool,
  LlmToolCall,
} from '../types';

@Injectable()
export class AnthropicProvider extends LlmProvider {
  private readonly client: Anthropic;
  private readonly defaultModel: string;

  constructor(config: ConfigService) {
    super();
    this.client = new Anthropic({ apiKey: config.get<string>('ANTHROPIC_API_KEY') });
    this.defaultModel = config.get<string>('LLM_MODEL') ?? 'claude-sonnet-4-6';
  }

  protected async doComplete(req: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const systemMessages = req.messages.filter((m) => m.role === 'system');
    const system = systemMessages.map((m) => m.content).join('\n') || undefined;
    const messages = this.toAnthropicMessages(req.messages.filter((m) => m.role !== 'system'));
    const tools = req.tools ? this.toAnthropicTools(req.tools) : undefined;
    const toolChoice = req.tool_choice ? this.toAnthropicToolChoice(req.tool_choice) : undefined;

    const response: Anthropic.Message = await this.client.messages.create({
      model: req.model ?? this.defaultModel,
      max_tokens: req.max_tokens ?? 4096,
      ...(system && { system }),
      messages,
      ...(tools && { tools }),
      ...(toolChoice && { tool_choice: toolChoice }),
      stream: false,
    });

    return this.fromAnthropicResponse(response);
  }

  private toAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
    return messages.map((m): Anthropic.MessageParam => {
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.tool_call_id ?? '',
              content: m.content,
            },
          ],
        };
      }

      if (m.role === 'assistant') {
        return { role: 'assistant', content: m.content };
      }

      return { role: 'user', content: m.content };
    });
  }

  private toAnthropicTools(tools: LlmTool[]): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters as Anthropic.Tool['input_schema'],
    }));
  }

  private toAnthropicToolChoice(
    choice: 'auto' | 'none' | 'required',
  ): Anthropic.ToolChoiceAuto | Anthropic.ToolChoiceAny | Anthropic.ToolChoiceNone {
    if (choice === 'required') return { type: 'any' };
    if (choice === 'none') return { type: 'none' };
    return { type: 'auto' };
  }

  private fromAnthropicResponse(response: Anthropic.Message): LlmCompletionResponse {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');

    const toolCalls: LlmToolCall[] = toolUseBlocks.map((b) => ({
      id: b.id,
      type: 'function',
      function: {
        name: b.name,
        arguments: JSON.stringify(b.input),
      },
    }));

    let finishReason: LlmCompletionResponse['finish_reason'];
    if (response.stop_reason === 'tool_use') {
      finishReason = 'tool_calls';
    } else if (response.stop_reason === 'max_tokens') {
      finishReason = 'length';
    } else {
      finishReason = 'stop';
    }

    return {
      content: textBlock?.text ?? null,
      ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
      finish_reason: finishReason,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
}
