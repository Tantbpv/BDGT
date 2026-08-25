import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { ContextService } from '../context/context.service';
import { ConversationService } from '../conversation/conversation.service';
import type { LlmProvider } from '../llm/llm.provider';
import { LLM_PROVIDER } from '../llm/llm.provider';
import type { LlmMessage } from '../llm/types';
import { MessageService } from '../message/message.service';
import type { ToolContext } from './tools/tool.interface';
import { ToolRegistry } from './tools/tool.registry';

const MAX_TURNS = 6;

export interface ChatAgentInput {
  userId: string;
  conversationId?: string;
  message: string;
}

export interface ChatAgentOutput {
  conversationId: string;
  message: string;
}

@Injectable()
export class ChatAgentService {
  // eslint-disable-next-line max-params
  constructor(
    @InjectPinoLogger(ChatAgentService.name) private readonly logger: PinoLogger,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly contextService: ContextService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  async run(input: ChatAgentInput): Promise<ChatAgentOutput> {
    this.logger.info(
      { userId: input.userId, conversationId: input.conversationId ?? 'new', messagePreview: input.message.slice(0, 80) },
      'run() called',
    );

    const conv = input.conversationId
      ? await this.conversationService.findById(input.conversationId)
      : await this.conversationService.create(input.userId);

    this.logger.info({ conversationId: conv.id }, 'Conversation resolved');

    await this.messageService.createUserMessage(conv.id, input.message);

    const messages: LlmMessage[] = await this.contextService.build(conv.id);
    this.logger.debug({ count: messages.length }, 'Context built');

    const ctx: ToolContext = { userId: input.userId };

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      this.logger.debug(
        { turn: turn + 1, messages: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })) },
        `Turn ${turn + 1}/${MAX_TURNS} — LLM input`,
      );

      const res = await this.llm.complete({
        messages,
        tools: this.toolRegistry.getSchemas(),
        tool_choice: 'auto',
        max_tokens: 4096,
      });

      this.logger.debug(
        { turn: turn + 1, finish_reason: res.finish_reason, tokens: res.usage?.completion_tokens, content: res.content },
        `Turn ${turn + 1} — LLM output`,
      );

      if (res.finish_reason === 'stop' || res.finish_reason === 'length') {
        const text = res.content ?? '';
        await this.messageService.createAssistantMessage(
          conv.id,
          text,
          res.usage?.completion_tokens,
        );
        this.logger.info(
          { conversationId: conv.id, turns: turn + 1, responseLength: text.length },
          'Loop complete',
        );
        return { conversationId: conv.id, message: text };
      }

      if (res.finish_reason === 'tool_calls' && res.tool_calls?.length) {
        this.logger.debug({ turn: turn + 1, count: res.tool_calls.length }, 'Tool calls requested');

        messages.push({
          role: 'assistant',
          content: res.content ?? null,
          tool_calls: res.tool_calls,
        });

        for (const toolCall of res.tool_calls) {
          this.logger.debug({ tool: toolCall.function.name, args: toolCall.function.arguments }, 'Tool call');
          const result = await this.toolRegistry.dispatch(
            toolCall.function.name,
            toolCall.function.arguments,
            ctx,
          );
          this.logger.debug({ tool: toolCall.function.name, result: result.slice(0, 200) }, 'Tool result');
          messages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
          });
        }
      }
    }

    this.logger.warn({ conversationId: conv.id, maxTurns: MAX_TURNS }, 'Agent loop exceeded maximum turns');
    throw new ServiceUnavailableException('Agent loop exceeded maximum turns');
  }
}
