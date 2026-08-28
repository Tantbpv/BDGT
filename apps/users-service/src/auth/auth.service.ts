import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@repo/auth';
import type {
  AuthTokensResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '@repo/contracts/auth';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

import type { EnvConfig } from '../config/env.schema';
import { PrismaService } from '../database/prisma.service';

// Pre-hashed sentinel for constant-time comparison on user-not-found,
// preventing timing-based email enumeration.
const DUMMY_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewdBavEFBbEGelH.';

function parseExpiresIn(s: string): Date {
  const unit = s.at(-1);
  const value = parseInt(s.slice(0, -1), 10);
  let ms: number;
  if (unit === 'd') {
    ms = value * 86_400_000;
  } else if (unit === 'h') {
    ms = value * 3_600_000;
  } else if (unit === 'm') {
    ms = value * 60_000;
  } else {
    ms = value * 1_000;
  }
  return new Date(Date.now() + ms);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvConfig, true>,
  ) {}

  async login(dto: LoginRequest): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(dto.password, hashToCompare);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email, user.name ?? null);
  }

  async register(dto: RegisterRequest): Promise<AuthTokensResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: dto.email, passwordHash, name: dto.name ?? null },
      });
      const account = await tx.account.create({ data: { name: 'Default' } });
      await tx.userAccount.create({ data: { userId: newUser.id, accountId: account.id } });
      await tx.userSetting.create({
        data: { userId: newUser.id, currency: 'EUR', activeAccountId: account.id },
      });
      return newUser;
    });

    return this.issueTokens(user.id, user.email, user.name ?? null);
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    try {
      await verifyRefreshToken(refreshToken, this.config.get('JWT_REFRESH_SECRET'));
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const record = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!record) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.prisma.refreshToken.delete({ where: { id: record.id } });

    return this.issueTokens(user.id, user.email, user.name ?? null);
  }

  async changePassword(userId: string, dto: ChangePasswordRequest): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!passwordMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  }

  async forgotPassword(dto: ForgotPasswordRequest): Promise<{ token?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3_600_000);
      await this.prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

      if (this.config.get('NODE_ENV') === 'development') {
        return { token };
      }
    }

    return {};
  }

  async resetPassword(dto: ResetPasswordRequest): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    name: string | null,
  ): Promise<AuthTokensResponse> {
    const accessSecret = this.config.get('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
    const accessExpiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN');
    const refreshExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN');

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: userId, email }, accessSecret, accessExpiresIn),
      signRefreshToken({ sub: userId }, refreshSecret, refreshExpiresIn),
    ]);

    const accessExpiresAt = parseExpiresIn(accessExpiresIn);
    const refreshExpiresAt = parseExpiresIn(refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt: refreshExpiresAt },
    });

    return {
      user: { id: userId, email, name },
      accessToken,
      accessExpiresAt: accessExpiresAt.toISOString(),
      refreshToken,
      refreshExpiresAt: refreshExpiresAt.toISOString(),
    };
  }
}
