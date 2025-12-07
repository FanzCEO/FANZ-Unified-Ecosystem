import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const userRouter = router({
  // Get public profile by username
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { username: input.username.toLowerCase() },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bannerUrl: true,
          bio: true,
          role: true,
          createdAt: true,
          creatorProfile: {
            select: {
              archetype: true,
              customArchetypeName: true,
              tagline: true,
              subscriberCount: true,
              contentCount: true,
              isVerified: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
      });

      if (!user || user.role === 'ADMIN' || user.role === 'MODERATOR') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(50).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
        bannerUrl: z.string().url().optional(),
        locale: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          bannerUrl: true,
          locale: true,
          timezone: true,
        },
      });

      return user;
    }),

  // Update notification settings
  updateNotificationSettings: protectedProcedure
    .input(
      z.object({
        emailNewSubscriber: z.boolean().optional(),
        emailNewTip: z.boolean().optional(),
        emailNewMessage: z.boolean().optional(),
        emailPayouts: z.boolean().optional(),
        emailMarketing: z.boolean().optional(),
        emailSecurityAlerts: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        pushNewSubscriber: z.boolean().optional(),
        pushNewTip: z.boolean().optional(),
        pushNewMessage: z.boolean().optional(),
        pushLiveAlerts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.notificationSettings.upsert({
        where: { userId: ctx.user.id },
        update: input,
        create: {
          userId: ctx.user.id,
          ...input,
        },
      });

      return settings;
    }),

  // Update privacy settings
  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        showOnlineStatus: z.boolean().optional(),
        showLastSeen: z.boolean().optional(),
        showSubscriptionList: z.boolean().optional(),
        showLikedContent: z.boolean().optional(),
        allowSearchEngines: z.boolean().optional(),
        requireMfaForPayouts: z.boolean().optional(),
        requireMfaForLogin: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.privacySettings.upsert({
        where: { userId: ctx.user.id },
        update: input,
        create: {
          userId: ctx.user.id,
          ...input,
        },
      });

      return settings;
    }),

  // Block a user
  blockUser: protectedProcedure
    .input(z.object({ userId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot block yourself',
        });
      }

      const block = await ctx.prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: ctx.user.id,
            blockedId: input.userId,
          },
        },
        update: { reason: input.reason },
        create: {
          blockerId: ctx.user.id,
          blockedId: input.userId,
          reason: input.reason,
        },
      });

      return block;
    }),

  // Unblock a user
  unblockUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.block.deleteMany({
        where: {
          blockerId: ctx.user.id,
          blockedId: input.userId,
        },
      });

      return { success: true };
    }),

  // Get blocked users
  blockedUsers: protectedProcedure.query(async ({ ctx }) => {
    const blocks = await ctx.prisma.block.findMany({
      where: { blockerId: ctx.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks;
  }),

  // Report a user
  reportUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        category: z.enum([
          'SPAM',
          'HARASSMENT',
          'UNDERAGE',
          'NON_CONSENSUAL',
          'IMPERSONATION',
          'COPYRIGHT',
          'ILLEGAL',
          'OTHER',
        ]),
        description: z.string().min(10).max(1000),
        evidence: z.array(z.string().url()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.prisma.report.create({
        data: {
          reporterId: ctx.user.id,
          reportedUserId: input.userId,
          type: 'PROFILE',
          category: input.category,
          description: input.description,
          evidence: input.evidence || [],
        },
      });

      return { reportId: report.id };
    }),
});
