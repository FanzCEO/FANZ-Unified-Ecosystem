import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';

export const adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalCreators,
      activeSubscriptions,
      pendingReports,
      pendingDmca,
      totalRevenue,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.user.count({ where: { role: 'CREATOR' } }),
      ctx.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.report.count({ where: { status: 'PENDING' } }),
      ctx.prisma.dMCARequest.count({ where: { status: 'RECEIVED' } }),
      ctx.prisma.transaction.aggregate({
        where: { status: 'COMPLETED', type: { in: ['SUBSCRIPTION', 'TIP', 'PPV_UNLOCK', 'MESSAGE_UNLOCK'] } },
        _sum: { platformFee: true },
      }),
    ]);

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = await ctx.prisma.user.count({
      where: { createdAt: { gte: today } },
    });

    return {
      totalUsers,
      totalCreators,
      activeSubscriptions,
      pendingReports,
      pendingDmca,
      platformRevenue: totalRevenue._sum.platformFee || 0,
      newUsersToday,
    };
  }),

  // List users with filters
  users: adminProcedure
    .input(
      z.object({
        role: z.enum(['FAN', 'CREATOR', 'MODERATOR', 'ADMIN']).optional(),
        status: z.enum(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DELETED']).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { role, status, search, cursor, limit } = input;

      const users = await ctx.prisma.user.findMany({
        where: {
          ...(role && { role }),
          ...(status && { status }),
          ...(search && {
            OR: [
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { displayName: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          creatorProfile: {
            select: {
              subscriberCount: true,
              totalEarnings: true,
              isVerified: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem?.id;
      }

      return { users, nextCursor };
    }),

  // Update user status
  updateUserStatus: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { status: input.status },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: `user.status.${input.status.toLowerCase()}`,
          entityType: 'User',
          entityId: input.userId,
          newValues: { status: input.status },
          performedBy: ctx.user.id,
          reason: input.reason,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers['user-agent'],
        },
      });

      return user;
    }),

  // Verify creator
  verifyCreator: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        verified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.creatorProfile.update({
        where: { userId: input.userId },
        data: {
          isVerified: input.verified,
          verifiedAt: input.verified ? new Date() : null,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.verified ? 'creator.verified' : 'creator.unverified',
          entityType: 'CreatorProfile',
          entityId: profile.id,
          performedBy: ctx.user.id,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers['user-agent'],
        },
      });

      return profile;
    }),

  // List reports
  reports: adminProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED']).optional(),
        type: z.enum(['CONTENT', 'PROFILE', 'MESSAGE', 'COMMENT', 'LIVE_STREAM']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, type, cursor, limit } = input;

      const reports = await ctx.prisma.report.findMany({
        where: {
          ...(status && { status }),
          ...(type && { type }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reports.length > limit) {
        const nextItem = reports.pop();
        nextCursor = nextItem?.id;
      }

      return { reports, nextCursor };
    }),

  // Resolve report
  resolveReport: adminProcedure
    .input(
      z.object({
        reportId: z.string(),
        status: z.enum(['RESOLVED', 'DISMISSED', 'ESCALATED']),
        resolution: z.string().optional(),
        actionTaken: z.enum(['none', 'warning', 'suspension', 'ban', 'content_removal']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.prisma.report.update({
        where: { id: input.reportId },
        data: {
          status: input.status,
          resolution: input.resolution,
          actionTaken: input.actionTaken,
          resolvedBy: ctx.user.id,
          resolvedAt: new Date(),
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          action: 'report.resolved',
          entityType: 'Report',
          entityId: input.reportId,
          newValues: { status: input.status, actionTaken: input.actionTaken },
          performedBy: ctx.user.id,
          reason: input.resolution,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers['user-agent'],
        },
      });

      return report;
    }),

  // List DMCA requests
  dmcaRequests: adminProcedure
    .input(
      z.object({
        status: z.enum(['RECEIVED', 'UNDER_REVIEW', 'VALID_TAKEDOWN', 'INVALID', 'COUNTER_FILED', 'RESTORED']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const requests = await ctx.prisma.dMCARequest.findMany({
        where: {
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined;
      if (requests.length > limit) {
        const nextItem = requests.pop();
        nextCursor = nextItem?.id;
      }

      return { requests, nextCursor };
    }),

  // Process DMCA request
  processDmca: adminProcedure
    .input(
      z.object({
        requestId: z.string(),
        status: z.enum(['VALID_TAKEDOWN', 'INVALID']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.prisma.dMCARequest.update({
        where: { id: input.requestId },
        data: {
          status: input.status,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          reviewNotes: input.notes,
        },
      });

      // If valid, remove content
      if (input.status === 'VALID_TAKEDOWN' && request.contentUrls.length > 0) {
        // Extract content IDs from URLs and update status
        // This is simplified - real implementation would parse URLs
        await ctx.prisma.auditLog.create({
          data: {
            action: 'dmca.takedown',
            entityType: 'DMCARequest',
            entityId: input.requestId,
            newValues: { status: input.status, contentUrls: request.contentUrls },
            performedBy: ctx.user.id,
            reason: input.notes,
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers['user-agent'],
          },
        });
      }

      return request;
    }),

  // Get feature flags
  featureFlags: adminProcedure.query(async ({ ctx }) => {
    const flags = await ctx.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    return flags;
  }),

  // Update feature flag
  updateFeatureFlag: adminProcedure
    .input(
      z.object({
        key: z.string(),
        isEnabled: z.boolean().optional(),
        percentage: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { key, ...data } = input;

      const flag = await ctx.prisma.featureFlag.update({
        where: { key },
        data,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          action: 'feature_flag.updated',
          entityType: 'FeatureFlag',
          entityId: flag.id,
          newValues: data,
          performedBy: ctx.user.id,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers['user-agent'],
        },
      });

      return flag;
    }),

  // Get audit logs
  auditLogs: adminProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, action, entityType, cursor, limit } = input;

      const logs = await ctx.prisma.auditLog.findMany({
        where: {
          ...(userId && { userId }),
          ...(action && { action: { contains: action } }),
          ...(entityType && { entityType }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (logs.length > limit) {
        const nextItem = logs.pop();
        nextCursor = nextItem?.id;
      }

      return { logs, nextCursor };
    }),
});
