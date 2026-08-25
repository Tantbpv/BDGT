import { Injectable } from '@nestjs/common';

import type { LlmTool } from '../../llm/types';
import { GetUserTransactionsTool } from './handlers/get-user-transactions.tool';
import { UpdateUserMemoryTool } from './handlers/update-user-memory.tool';
import type { ToolContext, ToolDefinition } from './tool.interface';

@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any>>();

  constructor(
    private readonly getTransactions: GetUserTransactionsTool,
    private readonly updateMemory: UpdateUserMemoryTool,
  ) {
    this.tools.set('get_user_transactions', this.getTransactions);
    this.tools.set('update_user_memory', this.updateMemory);
  }

  getSchemas(): LlmTool[] {
    return [...this.tools.values()].map((t) => t.schema);
  }

  async dispatch(name: string, argsJson: string, ctx: ToolContext): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argsJson) as Record<string, unknown>;
    } catch {
      return JSON.stringify({ error: 'Invalid tool arguments JSON' });
    }
    return tool.execute(args, ctx);
  }
}
