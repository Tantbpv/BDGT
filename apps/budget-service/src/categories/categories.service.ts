import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Category, CreateCategory, UpdateCategory } from '@repo/contracts/categories';
import { PrismaService } from '@repo/nestjs-shared';

import { UserSettingService } from '../user-setting/user-setting.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userSettingService: UserSettingService,
  ) {}

  async findAll(userId: string): Promise<Category[]> {
    if (!userId) throw new UnauthorizedException();

    const accountId = await this.userSettingService.getActiveAccountId(userId);
    if (!accountId) throw new BadRequestException('No active account');

    const categories = await this.prisma.category.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    });

    return categories.map(this.toCategory);
  }

  async create(userId: string, dto: CreateCategory): Promise<Category> {
    if (!userId) throw new UnauthorizedException();

    const accountId = await this.userSettingService.getActiveAccountId(userId);
    if (!accountId) throw new BadRequestException('No active account');

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        color: dto.color ?? null,
        icon: dto.icon ?? null,
        accountId,
      },
    });

    return this.toCategory(category);
  }

  async findOne(userId: string, id: string): Promise<Category> {
    if (!userId) throw new UnauthorizedException();

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: category.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Category not found');

    return this.toCategory(category);
  }

  async update(userId: string, id: string, dto: UpdateCategory): Promise<Category> {
    if (!userId) throw new UnauthorizedException();

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: category.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });

    return this.toCategory(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!userId) throw new UnauthorizedException();

    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const membership = await this.prisma.userAccount.findFirst({
      where: { accountId: category.accountId, userId },
    });
    if (!membership) throw new NotFoundException('Category not found');

    await this.prisma.category.delete({ where: { id } });
  }

  private toCategory(c: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    accountId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Category {
    return {
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      accountId: c.accountId,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  }
}
