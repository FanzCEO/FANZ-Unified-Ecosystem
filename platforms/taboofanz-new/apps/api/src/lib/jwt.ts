import * as jose from 'jose';

const JWT_ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'taboofanz-access-secret-change-me'
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'taboofanz-refresh-secret-change-me'
);

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('taboofanz')
    .setAudience('taboofanz-app')
    .sign(JWT_ACCESS_SECRET);
}

export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('taboofanz')
    .setAudience('taboofanz-refresh')
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_ACCESS_SECRET, {
      issuer: 'taboofanz',
      audience: 'taboofanz-app',
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_REFRESH_SECRET, {
      issuer: 'taboofanz',
      audience: 'taboofanz-refresh',
    });
    return payload as unknown as { userId: string };
  } catch {
    return null;
  }
}
