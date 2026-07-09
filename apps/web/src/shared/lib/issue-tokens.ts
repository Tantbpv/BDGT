import { signAccessToken, signRefreshToken } from '@repo/auth';
import { parseEnv } from '@repo/config';
import type { AuthResponse } from '@repo/contracts/auth';
import { prisma } from '@repo/database';

type IssueTokensInput = { userId: string; email: string; name: string | null };
type IssueTokensResult = {
  authResponse: AuthResponse;
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
};

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

export async function issueTokens(input: IssueTokensInput): Promise<IssueTokensResult> {
  const env = parseEnv();

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: input.userId, email: input.email }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN),
    signRefreshToken({ sub: input.userId }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN),
  ]);

  const accessExpiresAt = parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN);
  const refreshExpiresAt = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: input.userId, expiresAt: refreshExpiresAt },
  });

  return {
    authResponse: { user: { id: input.userId, email: input.email, name: input.name } },
    accessToken,
    accessExpiresAt,
    refreshToken,
    refreshExpiresAt,
  };
}
