import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import type { LlmTool } from '../../../llm/types';
import type { ToolContext, ToolDefinition } from '../tool.interface';

interface UpdateMemoryArgs {
  type: 'FACT' | 'PREFERENCE' | 'GOAL' | 'PROJECT_CONTEXT' | 'INSTRUCTION';
  content: string;
  importance?: number;
}

@Injectable()
export class UpdateUserMemoryTool implements ToolDefinition<UpdateMemoryArgs> {
  readonly schema: LlmTool = {
    type: 'function',
    function: {
      name: 'update_user_memory',
      description:
        'Persist an important fact, preference, or goal the user has stated so it can be recalled in future conversations.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['FACT', 'PREFERENCE', 'GOAL', 'PROJECT_CONTEXT', 'INSTRUCTION'],
            description: 'The category of memory to store.',
          },
          content: {
            type: 'string',
            description: 'The memory content to persist. Be concise and factual.',
            maxLength: 2000,
          },
          importance: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Importance score from 0 (low) to 1 (high). Defaults to 0.5.',
          },
        },
        required: ['type', 'content'],
        additionalProperties: false,
      },
    },
  };

  private readonly logger = new Logger(UpdateUserMemoryTool.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(args: UpdateMemoryArgs, ctx: ToolContext): Promise<string> {
    this.logger.debug({ args }, 'update_user_memory called');
    try {
      const memory = await this.prisma.userMemory.create({
        data: {
          userId: ctx.userId,
          type: args.type,
          content: args.content,
          importance: Number(args.importance ?? 0.5),
          confidence: 1.0,
          status: 'ACTIVE',
        },
      });
      return JSON.stringify({ success: true, memoryId: memory.id });
    } catch (err) {
      this.logger.error({ err }, 'update_user_memory failed');
      return JSON.stringify({ success: false, error: 'Failed to save memory' });
    }
  }
}
