import { Injectable, NotFoundException } from '@nestjs/common';
import type { Conversation } from '@prisma/client';
import { PrismaService } from '@repo/nestjs-shared';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new NotFoundException(`Conversation ${id} not found`);
    return conversation;
  }

  async create(userId: string): Promise<Conversation> {
    return this.prisma.conversation.create({ data: { userId } });
  }
}
