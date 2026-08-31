import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ApiResponse } from '@repo/contracts/common';
import type {
  CreateTransaction,
  Transaction,
  TransactionListQuery,
  UpdateTransaction,
} from '@repo/contracts/transactions';
import { PrismaService } from '@repo/nestjs-shared';

import { UserSettingService } from '../user-setting/user-setting.service';

type TransactionWithRelations = {
  id: string;
  amount: Prisma.Decimal;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: Date;
  accountId: string;
  categories: { id: string }[];
  createdById: string;
  createdBy: { name: string | null; email: string };
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userSettingService: UserSettingService,
  ) {}

  async findAll(userId: string, query: TransactionListQuery): Promise<ApiResponse<Transaction[]>> {
    if (!userId) throw new UnauthorizedException();

    const accountId = await this.userSettingService.getActiveAccountId(userId);
    if (!accountId) throw new BadRequestException('No active account');

    const { page, limit, type, categoryId, from, to } = query;

    const where = {
      accountId,
      ...(type && { type }),
      ...(categoryId && { categories: { some: { id: categoryId } } }),
      ...(from ?? to
        ? {
            date: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        categories: { select: { id: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: transactions.map(this.toTransaction) };
  }

  async create(userId: string, dto: CreateTransaction): Promise<Transaction> {
    if (!userId) throw new UnauthorizedException();

    const accountId = await this.userSettingService.getActiveAccountId(userId);
    if (!accountId) throw new BadRequestException('No active account');

    const categoryIds = dto.categoryIds ?? [];

    const transaction = await this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        type: dto.type,
        date: new Date(dto.date),
        accountId,
        createdById: userId,
        ...(categoryIds.length > 0 && {
          categories: { connect: categoryIds.map((id) => ({ id })) },
        }),
      },
      include: {
        categories: { select: { id: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return this.toTransaction(transaction);
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    if (!userId) throw new UnauthorizedException();

    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        categories: { select: { id: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: transaction.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Transaction not found');

    return this.toTransaction(transaction);
  }

  async update(userId: string, id: string, dto: UpdateTransaction): Promise<Transaction> {
    if (!userId) throw new UnauthorizedException();

    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: transaction.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Transaction not found');

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.categoryIds !== undefined && {
          categories: { set: dto.categoryIds.map((catId) => ({ id: catId })) },
        }),
      },
      include: {
        categories: { select: { id: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return this.toTransaction(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!userId) throw new UnauthorizedException();

    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: transaction.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Transaction not found');

    await this.prisma.transaction.delete({ where: { id } });
  }

  private toTransaction(t: TransactionWithRelations): Transaction {
    return {
      id: t.id,
      amount: t.amount.toString(),
      description: t.description,
      type: t.type,
      date: t.date.toISOString(),
      accountId: t.accountId,
      categoryIds: t.categories.map((c) => c.id),
      createdById: t.createdById,
      createdByName: t.createdBy.name ?? t.createdBy.email,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
