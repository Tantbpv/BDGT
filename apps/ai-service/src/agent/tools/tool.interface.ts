import type { LlmTool } from '../../llm/types';

export interface ToolContext {
  userId: string;
}

export interface ToolDefinition<TArgs = any> {
  schema: LlmTool;
  execute(args: TArgs, ctx: ToolContext): Promise<string>;
}
