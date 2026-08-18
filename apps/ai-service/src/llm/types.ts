export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface LlmToolFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmTool {
  type: 'function';
  function: LlmToolFunction;
}

export interface LlmToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface LlmCompletionRequest {
  messages: LlmMessage[];
  tools?: LlmTool[];
  tool_choice?: 'auto' | 'none' | 'required';
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LlmCompletionResponse {
  content: string | null;
  tool_calls?: LlmToolCall[];
  finish_reason: 'stop' | 'tool_calls' | 'length';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
