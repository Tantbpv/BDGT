import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateUser, UpdateUserSetting, User, UserSetting } from '@repo/contracts/users';
import { PrismaService } from '@repo/nestjs-shared';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string): Promise<User> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async updateMe(userId: string, dto: UpdateUser): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });

    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getSettings(userId: string): Promise<UserSetting> {
    let settings = await this.prisma.userSetting.findUnique({ where: { userId } });

    if (!settings) {
      settings = await this.prisma.userSetting.create({
        data: { userId, currency: 'EUR' },
      });
    }

    return this.toUserSetting(settings);
  }

  async updateSettings(userId: string, dto: UpdateUserSetting): Promise<UserSetting> {
    const settings = await this.prisma.userSetting.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });

    return this.toUserSetting(settings);
  }

  private toUserSetting(s: {
    id: string;
    userId: string;
    currency: string;
    activeAccountId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserSetting {
    return {
      id: s.id,
      userId: s.userId,
      currency: s.currency as UserSetting['currency'],
      activeAccountId: s.activeAccountId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
