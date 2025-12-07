import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { prisma, type User } from '@taboofanz/database';
import { verifyAccessToken } from './lib/jwt';

export interface Context {
  prisma: typeof prisma;
  user: User | null;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  let user: User | null = null;

  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyAccessToken(token);
      if (payload?.userId) {
        user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });
      }
    } catch {
      // Invalid token, user remains null
    }
  }

  return {
    prisma,
    user,
    req,
    res,
  };
}
