import { Injectable } from '@nestjs/common';
import type { Message } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createUserMessage(conversationId: string, content: string): Promise<Message> {
    return this.prisma.message.create({
      data: { conversationId, role: 'USER', content },
    });
  }

  async createAssistantMessage(
    conversationId: string,
    content: string,
    tokenCount?: number,
  ): Promise<Message> {
    return this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content,
        ...(tokenCount !== undefined && { tokenCount }),
      },
    });
  }
}
