import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const subscriptionRouter = router({
  // Subscribe to a creator
  subscribe: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        tierId: z.string().optional(),
        promoCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.creatorId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot subscribe to yourself',
        });
      }

      // Check if already subscribed
      const existing = await ctx.prisma.subscription.findUnique({
        where: {
          fanId_creatorId: {
            fanId: ctx.user.id,
            creatorId: input.creatorId,
          },
        },
      });

      if (existing && existing.status === 'ACTIVE') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already subscribed to this creator',
        });
      }

      // Get creator profile
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: input.creatorId },
        include: {
          subscriptionTiers: true,
        },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator not found',
        });
      }

      // Determine price
      let price = creatorProfile.subscriptionPrice;
      let tier = null;

      if (input.tierId) {
        tier = creatorProfile.subscriptionTiers.find((t) => t.id === input.tierId);
        if (tier) {
          price = tier.price;
        }
      }

      // Apply promo code if provided
      let promotion = null;
      let discountApplied = 0;

      if (input.promoCode) {
        promotion = await ctx.prisma.promotion.findFirst({
          where: {
            creatorProfileId: creatorProfile.id,
            code: input.promoCode.toUpperCase(),
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            OR: [{ maxUses: null }, { usedCount: { lt: ctx.prisma.promotion.fields.maxUses } }],
          },
        });

        if (promotion) {
          if (promotion.discountType === 'percentage') {
            discountApplied = Number(price) * (Number(promotion.discountValue) / 100);
          } else {
            discountApplied = Number(promotion.discountValue);
          }
          price = Math.max(0, Number(price) - discountApplied);
        }
      }

      // Create subscription
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await ctx.prisma.subscription.upsert({
        where: {
          fanId_creatorId: {
            fanId: ctx.user.id,
            creatorId: input.creatorId,
          },
        },
        update: {
          status: 'ACTIVE',
          price,
          tierId: tier?.id,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          promotionId: promotion?.id,
          discountApplied: discountApplied > 0 ? discountApplied : null,
        },
        create: {
          fanId: ctx.user.id,
          creatorId: input.creatorId,
          tierId: tier?.id,
          status: 'ACTIVE',
          price,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          promotionId: promotion?.id,
          discountApplied: discountApplied > 0 ? discountApplied : null,
        },
      });

      // Update promotion usage count
      if (promotion) {
        await ctx.prisma.promotion.update({
          where: { id: promotion.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Update creator subscriber count
      await ctx.prisma.creatorProfile.update({
        where: { userId: input.creatorId },
        data: { subscriberCount: { increment: 1 } },
      });

      // Update fan subscription count
      await ctx.prisma.fanProfile.update({
        where: { userId: ctx.user.id },
        data: { subscriptionCount: { increment: 1 } },
      });

      // Create notification for creator
      await ctx.prisma.notification.create({
        data: {
          userId: input.creatorId,
          type: 'NEW_SUBSCRIBER',
          title: 'New Subscriber',
          body: `@${ctx.user.username} just subscribed to your content!`,
          actionUrl: `/c/${ctx.user.username}`,
          fromUserId: ctx.user.id,
        },
      });

      return subscription;
    }),

  // Unsubscribe from a creator
  unsubscribe: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: {
          fanId_creatorId: {
            fanId: ctx.user.id,
            creatorId: input.creatorId,
          },
        },
      });

      if (!subscription || subscription.status !== 'ACTIVE') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found',
        });
      }

      // Cancel at end of period (don't immediately revoke access)
      await ctx.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      return { success: true, accessUntil: subscription.currentPeriodEnd };
    }),

  // Get my subscriptions (as a fan)
  mySubscriptions: protectedProcedure
    .input(
      z.object({
        status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const subscriptions = await ctx.prisma.subscription.findMany({
        where: {
          fanId: ctx.user.id,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
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
          tier: true,
        },
      });

      let nextCursor: string | undefined;
      if (subscriptions.length > limit) {
        const nextItem = subscriptions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        subscriptions,
        nextCursor,
      };
    }),

  // Get my subscribers (as a creator)
  mySubscribers: protectedProcedure
    .input(
      z.object({
        status: z.enum(['ACTIVE', 'CANCELLED', 'EXPIRED']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const subscriptions = await ctx.prisma.subscription.findMany({
        where: {
          creatorId: ctx.user.id,
          ...(status && { status }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          fan: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          tier: true,
        },
      });

      let nextCursor: string | undefined;
      if (subscriptions.length > limit) {
        const nextItem = subscriptions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        subscriptions,
        nextCursor,
      };
    }),

  // Check subscription status
  checkStatus: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ ctx, input }) => {
      const subscription = await ctx.prisma.subscription.findUnique({
        where: {
          fanId_creatorId: {
            fanId: ctx.user.id,
            creatorId: input.creatorId,
          },
        },
        include: {
          tier: true,
        },
      });

      return {
        isSubscribed: subscription?.status === 'ACTIVE',
        subscription,
      };
    }),
});
