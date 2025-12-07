import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, creatorProcedure } from '../trpc';

export const liveRouter = router({
  // Get live sessions (public)
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const sessions = await ctx.prisma.liveSession.findMany({
        where: {
          ...(status && { status }),
          ...(status === undefined && { status: { in: ['SCHEDULED', 'LIVE'] } }),
        },
        orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }, { startedAt: 'desc' }],
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              creatorProfile: {
                select: {
                  archetype: true,
                  isVerified: true,
                },
              },
            },
          },
          _count: {
            select: { attendees: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (sessions.length > limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        sessions,
        nextCursor,
      };
    }),

  // Get single live session
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              creatorProfile: {
                select: {
                  archetype: true,
                  isVerified: true,
                  subscriptionPrice: true,
                },
              },
            },
          },
          _count: {
            select: { attendees: true },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live session not found',
        });
      }

      // Check if user can access
      let canWatch = !session.isSubscribersOnly;

      if (ctx.user && session.isSubscribersOnly) {
        if (session.creatorId === ctx.user.id) {
          canWatch = true;
        } else {
          const subscription = await ctx.prisma.subscription.findUnique({
            where: {
              fanId_creatorId: {
                fanId: ctx.user.id,
                creatorId: session.creatorId,
              },
            },
          });
          canWatch = subscription?.status === 'ACTIVE';
        }
      }

      return {
        ...session,
        canWatch,
        playbackUrl: canWatch ? session.playbackUrl : null,
      };
    }),

  // Schedule a live session (creator)
  schedule: creatorProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        scheduledAt: z.date(),
        isSubscribersOnly: z.boolean().default(true),
        tipGoal: z.number().min(0).max(10000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.scheduledAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Scheduled time must be in the future',
        });
      }

      // Generate unique stream key
      const streamKey = `live_${ctx.user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const session = await ctx.prisma.liveSession.create({
        data: {
          creatorId: ctx.user.id,
          title: input.title,
          description: input.description,
          scheduledAt: input.scheduledAt,
          isSubscribersOnly: input.isSubscribersOnly,
          tipGoal: input.tipGoal,
          streamKey,
          status: 'SCHEDULED',
        },
      });

      return session;
    }),

  // Start live session (creator)
  start: creatorProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      if (session.status === 'LIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Session is already live',
        });
      }

      if (session.status === 'ENDED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Session has already ended',
        });
      }

      const updatedSession = await ctx.prisma.liveSession.update({
        where: { id: input.sessionId },
        data: {
          status: 'LIVE',
          startedAt: new Date(),
        },
      });

      // Notify subscribers
      const subscriptions = await ctx.prisma.subscription.findMany({
        where: {
          creatorId: ctx.user.id,
          status: 'ACTIVE',
        },
        select: { fanId: true },
      });

      await ctx.prisma.notification.createMany({
        data: subscriptions.map((sub) => ({
          userId: sub.fanId,
          type: 'LIVE_STARTED' as const,
          title: 'Live Now!',
          body: `@${ctx.user.username} just went live: ${session.title}`,
          actionUrl: `/live/${input.sessionId}`,
          fromUserId: ctx.user.id,
        })),
      });

      return updatedSession;
    }),

  // End live session (creator)
  end: creatorProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      if (session.status !== 'LIVE') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Session is not currently live',
        });
      }

      const updatedSession = await ctx.prisma.liveSession.update({
        where: { id: input.sessionId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      });

      return updatedSession;
    }),

  // Join live session (viewer)
  join: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.status !== 'LIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live session not found or not active',
        });
      }

      // Check access
      if (session.isSubscribersOnly && session.creatorId !== ctx.user.id) {
        const subscription = await ctx.prisma.subscription.findUnique({
          where: {
            fanId_creatorId: {
              fanId: ctx.user.id,
              creatorId: session.creatorId,
            },
          },
        });

        if (subscription?.status !== 'ACTIVE') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Subscription required to watch this stream',
          });
        }
      }

      // Add/update attendee record
      await ctx.prisma.liveAttendee.upsert({
        where: {
          sessionId_userId: {
            sessionId: input.sessionId,
            userId: ctx.user.id,
          },
        },
        update: {
          leftAt: null,
        },
        create: {
          sessionId: input.sessionId,
          userId: ctx.user.id,
        },
      });

      // Update peak viewer count
      const currentViewers = await ctx.prisma.liveAttendee.count({
        where: {
          sessionId: input.sessionId,
          leftAt: null,
        },
      });

      if (currentViewers > session.peakViewerCount) {
        await ctx.prisma.liveSession.update({
          where: { id: input.sessionId },
          data: { peakViewerCount: currentViewers },
        });
      }

      return {
        playbackUrl: session.playbackUrl,
        streamKey: session.creatorId === ctx.user.id ? session.streamKey : null,
      };
    }),

  // Leave live session
  leave: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attendee = await ctx.prisma.liveAttendee.findUnique({
        where: {
          sessionId_userId: {
            sessionId: input.sessionId,
            userId: ctx.user.id,
          },
        },
      });

      if (attendee) {
        const watchDuration = Math.floor(
          (Date.now() - attendee.joinedAt.getTime()) / 1000
        );

        await ctx.prisma.liveAttendee.update({
          where: { id: attendee.id },
          data: {
            leftAt: new Date(),
            watchDuration: { increment: watchDuration },
          },
        });
      }

      return { success: true };
    }),

  // Send chat message
  chat: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        text: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session || session.status !== 'LIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live session not found or not active',
        });
      }

      const message = await ctx.prisma.liveChatMessage.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.user.id,
          text: input.text,
        },
      });

      return message;
    }),

  // Send tip during live
  tip: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        amount: z.number().min(1).max(1000),
        message: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.prisma.liveSession.findUnique({
        where: { id: input.sessionId },
        include: {
          creator: {
            include: { wallet: true },
          },
        },
      });

      if (!session || session.status !== 'LIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Live session not found or not active',
        });
      }

      // Create tip record
      await ctx.prisma.liveTip.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.user.id,
          amount: input.amount,
          message: input.message,
        },
      });

      // Create chat message for tip
      await ctx.prisma.liveChatMessage.create({
        data: {
          sessionId: input.sessionId,
          userId: ctx.user.id,
          text: input.message || `Sent a $${input.amount} tip!`,
          isTip: true,
          tipAmount: input.amount,
        },
      });

      // Update session tip total
      await ctx.prisma.liveSession.update({
        where: { id: input.sessionId },
        data: {
          tipTotal: { increment: input.amount },
        },
      });

      // Handle wallet transactions
      const platformFee = input.amount * 0.2;
      const netAmount = input.amount - platformFee;

      if (session.creator.wallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: session.creator.wallet.id,
            type: 'TIP',
            status: 'COMPLETED',
            amount: input.amount,
            platformFee,
            processingFee: 0,
            netAmount,
            description: `Live tip from @${ctx.user.username}`,
            completedAt: new Date(),
          },
        });

        await ctx.prisma.wallet.update({
          where: { id: session.creator.wallet.id },
          data: {
            pendingBalance: { increment: netAmount },
            totalEarnings: { increment: netAmount },
          },
        });
      }

      return { success: true };
    }),

  // Get live chat messages
  chatMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { sessionId, cursor, limit } = input;

      const messages = await ctx.prisma.liveChatMessage.findMany({
        where: {
          sessionId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.reverse(),
        nextCursor,
      };
    }),
});
