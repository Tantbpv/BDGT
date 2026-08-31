import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { Account, CreateAccount } from '@repo/contracts/accounts';
import { PrismaService } from '@repo/nestjs-shared';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<Account[]> {
    if (!userId) throw new UnauthorizedException();
    const accounts = await this.prisma.account.findMany({
      where: { users: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
    });
    return accounts.map(this.toAccount);
  }

  async create(userId: string, dto: CreateAccount): Promise<Account> {
    if (!userId) throw new UnauthorizedException();
    const account = await this.prisma.$transaction(async (tx) => {
      const acc = await tx.account.create({ data: { name: dto.name } });
      await tx.userAccount.create({ data: { userId, accountId: acc.id } });
      return acc;
    });
    return this.toAccount(account);
  }

  async remove(userId: string, accountId: string): Promise<void> {
    if (!userId) throw new UnauthorizedException();

    const userAccount = await this.prisma.userAccount.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!userAccount) {
      throw new NotFoundException('Account not found');
    }

    const accountCount = await this.prisma.userAccount.count({ where: { userId } });
    if (accountCount <= 1) {
      throw new BadRequestException('Cannot delete the last account');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAccount.delete({
        where: { userId_accountId: { userId, accountId } },
      });

      const remainingUsers = await tx.userAccount.count({ where: { accountId } });
      if (remainingUsers === 0) {
        await tx.account.delete({ where: { id: accountId } });
      }

      const settings = await tx.userSetting.findUnique({ where: { userId } });
      if (settings?.activeAccountId === accountId) {
        const next = await tx.userAccount.findFirst({ where: { userId } });
        await tx.userSetting.update({
          where: { userId },
          data: { activeAccountId: next?.accountId ?? null },
        });
      }
    });
  }

  private toAccount(a: { id: string; name: string; createdAt: Date; updatedAt: Date }): Account {
    return {
      id: a.id,
      name: a.name,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
