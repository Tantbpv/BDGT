import { Injectable } from '@nestjs/common';
import { PrismaService } from '@repo/nestjs-shared';

@Injectable()
export class UserSettingService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveAccountId(userId: string): Promise<string | null> {
    const settings = await this.prisma.userSetting.findUnique({ where: { userId } });
    return settings?.activeAccountId ?? null;
  }
}
