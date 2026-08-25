import { Module } from '@nestjs/common';

import { ContextModule } from '../context/context.module';
import { ConversationModule } from '../conversation/conversation.module';
import { LlmModule } from '../llm/llm.module';
import { MessageModule } from '../message/message.module';
import { ChatAgentService } from './chat-agent.service';
import { GetUserTransactionsTool } from './tools/handlers/get-user-transactions.tool';
import { UpdateUserMemoryTool } from './tools/handlers/update-user-memory.tool';
import { ToolRegistry } from './tools/tool.registry';

@Module({
  imports: [LlmModule, ConversationModule, ContextModule, MessageModule],
  providers: [ChatAgentService, ToolRegistry, GetUserTransactionsTool, UpdateUserMemoryTool],
  exports: [ChatAgentService],
})
export class AgentModule {}
