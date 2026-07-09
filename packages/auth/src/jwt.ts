import type { TokenPayload } from '@repo/contracts/auth';
import { type JWTPayload, jwtVerify, SignJWT } from 'jose';

export type AccessTokenPayload = TokenPayload;
export type RefreshTokenPayload = { sub: string };

function toSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn = '15m',
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(toSecret(secret));
}

export async function verifyAccessToken(
  token: string,
  secret: string,
): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, toSecret(secret));
  return payload as unknown as AccessTokenPayload;
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
  secret: string,
  expiresIn = '7d',
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(toSecret(secret));
}

export async function verifyRefreshToken(
  token: string,
  secret: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, toSecret(secret));
  return payload as unknown as RefreshTokenPayload;
}
