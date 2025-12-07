import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';

export const authRouter = router({
  // Register a new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        username: z
          .string()
          .min(3, 'Username must be at least 3 characters')
          .max(30, 'Username must be at most 30 characters')
          .regex(
            /^[a-zA-Z0-9_-]+$/,
            'Username can only contain letters, numbers, underscores, and hyphens'
          ),
        displayName: z.string().min(1).max(50).optional(),
        role: z.enum(['FAN', 'CREATOR']).default('FAN'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate password strength
      const passwordCheck = validatePasswordStrength(input.password);
      if (!passwordCheck.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordCheck.errors.join(', '),
        });
      }

      // Check if email already exists
      const existingEmail = await ctx.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });
      if (existingEmail) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An account with this email already exists',
        });
      }

      // Check if username already exists
      const existingUsername = await ctx.prisma.user.findUnique({
        where: { username: input.username.toLowerCase() },
      });
      if (existingUsername) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This username is already taken',
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(input.password);

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          username: input.username.toLowerCase(),
          displayName: input.displayName || input.username,
          passwordHash,
          role: input.role,
          status: 'PENDING_VERIFICATION',
          // Create related profiles
          fanProfile: {
            create: {},
          },
          wallet: {
            create: {},
          },
          notificationSettings: {
            create: {},
          },
          privacySettings: {
            create: {},
          },
          ...(input.role === 'CREATOR' && {
            creatorProfile: {
              create: {
                archetype: 'THE_ENIGMA',
              },
            },
          }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const accessToken = await signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshToken = await signRefreshToken({ userId: user.id });

      // Create session
      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          userAgent: ctx.req.headers['user-agent'],
          ipAddress: ctx.req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    }),

  // Login
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const validPassword = await verifyPassword(input.password, user.passwordHash);
      if (!validPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account has been suspended. Please contact support.',
        });
      }

      // Generate tokens
      const accessToken = await signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
      const refreshToken = await signRefreshToken({ userId: user.id });

      // Create session
      await ctx.prisma.session.create({
        data: {
          userId: user.id,
          token: accessToken,
          refreshToken,
          userAgent: ctx.req.headers['user-agent'],
          ipAddress: ctx.req.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Update last login
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
      };
    }),

  // Refresh token
  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payload = await verifyRefreshToken(input.refreshToken);
      if (!payload) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        });
      }

      const session = await ctx.prisma.session.findFirst({
        where: {
          userId: payload.userId,
          refreshToken: input.refreshToken,
          revokedAt: null,
        },
        include: { user: true },
      });

      if (!session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session not found or revoked',
        });
      }

      // Generate new tokens
      const accessToken = await signAccessToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      });
      const refreshToken = await signRefreshToken({ userId: session.user.id });

      // Update session
      await ctx.prisma.session.update({
        where: { id: session.id },
        data: {
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken,
        refreshToken,
      };
    }),

  // Logout
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    // Revoke current session
    const authHeader = ctx.req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await ctx.prisma.session.updateMany({
        where: {
          userId: ctx.user.id,
          token,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return { success: true };
  }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        creatorProfile: {
          include: {
            identityProtection: true,
            boundaryProfile: true,
          },
        },
        fanProfile: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  // List active sessions
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.prisma.session.findMany({
      where: {
        userId: ctx.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }),

  // Revoke a session
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.session.updateMany({
        where: {
          id: input.sessionId,
          userId: ctx.user.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return { success: true };
    }),
});
