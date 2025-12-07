import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, creatorProcedure } from '../trpc';

export const walletRouter = router({
  // Get wallet balance
  balance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await ctx.prisma.wallet.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallet = await ctx.prisma.wallet.create({
        data: { userId: ctx.user.id },
      });
      return newWallet;
    }

    return wallet;
  }),

  // Get transaction history
  transactions: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          'SUBSCRIPTION',
          'TIP',
          'PPV_UNLOCK',
          'MESSAGE_UNLOCK',
          'PAYOUT',
          'REFUND',
          'CHARGEBACK',
          'ADJUSTMENT',
        ]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, cursor, limit } = input;

      const wallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!wallet) {
        return { transactions: [], nextCursor: undefined };
      }

      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          walletId: wallet.id,
          ...(type && { type }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined;
      if (transactions.length > limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        transactions,
        nextCursor,
      };
    }),

  // Send tip to creator
  tip: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        amount: z.number().min(1).max(1000),
        message: z.string().max(200).optional(),
        contentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.creatorId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot tip yourself',
        });
      }

      const creator = await ctx.prisma.user.findUnique({
        where: { id: input.creatorId },
        include: { wallet: true },
      });

      if (!creator || creator.role !== 'CREATOR') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator not found',
        });
      }

      const fanWallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!fanWallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found',
        });
      }

      // Calculate fees (example: 20% platform fee)
      const platformFeeRate = 0.2;
      const platformFee = input.amount * platformFeeRate;
      const netAmount = input.amount - platformFee;

      // Create transaction for fan (debit)
      await ctx.prisma.transaction.create({
        data: {
          walletId: fanWallet.id,
          type: 'TIP',
          status: 'COMPLETED',
          amount: -input.amount,
          platformFee: 0,
          processingFee: 0,
          netAmount: -input.amount,
          description: `Tip to @${creator.username}`,
          contentId: input.contentId,
          completedAt: new Date(),
        },
      });

      // Create transaction for creator (credit)
      if (creator.wallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: creator.wallet.id,
            type: 'TIP',
            status: 'COMPLETED',
            amount: input.amount,
            platformFee,
            processingFee: 0,
            netAmount,
            description: `Tip from @${ctx.user.username}`,
            contentId: input.contentId,
            completedAt: new Date(),
          },
        });

        // Update creator wallet balance
        await ctx.prisma.wallet.update({
          where: { id: creator.wallet.id },
          data: {
            pendingBalance: { increment: netAmount },
            totalEarnings: { increment: netAmount },
          },
        });
      }

      // Update fan wallet
      await ctx.prisma.wallet.update({
        where: { id: fanWallet.id },
        data: {
          totalSpent: { increment: input.amount },
        },
      });

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: input.creatorId,
          type: 'NEW_TIP',
          title: 'New Tip',
          body: `@${ctx.user.username} sent you a $${input.amount} tip!${input.message ? ` "${input.message}"` : ''}`,
          actionUrl: input.contentId ? `/p/${input.contentId}` : `/c/${ctx.user.username}`,
          fromUserId: ctx.user.id,
          contentId: input.contentId,
        },
      });

      return { success: true, amount: input.amount };
    }),

  // Unlock PPV content
  unlockContent: protectedProcedure
    .input(z.object({ contentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.contentItem.findUnique({
        where: { id: input.contentId },
        include: {
          creator: {
            include: { wallet: true },
          },
        },
      });

      if (!content || content.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      if (content.visibility !== 'PPV' || !content.price) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This content is not available for purchase',
        });
      }

      // Check if already unlocked
      const existing = await ctx.prisma.contentUnlock.findUnique({
        where: {
          contentId_userId: {
            contentId: input.contentId,
            userId: ctx.user.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Content already unlocked',
        });
      }

      const price = Number(content.price);
      const platformFee = price * 0.2;
      const netAmount = price - platformFee;

      // Create unlock record
      await ctx.prisma.contentUnlock.create({
        data: {
          contentId: input.contentId,
          userId: ctx.user.id,
          price: content.price,
        },
      });

      // Update content unlock count
      await ctx.prisma.contentItem.update({
        where: { id: input.contentId },
        data: { unlockCount: { increment: 1 } },
      });

      // Handle wallet transactions
      const fanWallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (fanWallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: fanWallet.id,
            type: 'PPV_UNLOCK',
            status: 'COMPLETED',
            amount: -price,
            platformFee: 0,
            processingFee: 0,
            netAmount: -price,
            contentId: input.contentId,
            description: `Unlocked content from @${content.creator.username}`,
            completedAt: new Date(),
          },
        });

        await ctx.prisma.wallet.update({
          where: { id: fanWallet.id },
          data: { totalSpent: { increment: price } },
        });
      }

      if (content.creator.wallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: content.creator.wallet.id,
            type: 'PPV_UNLOCK',
            status: 'COMPLETED',
            amount: price,
            platformFee,
            processingFee: 0,
            netAmount,
            contentId: input.contentId,
            description: `PPV unlock from @${ctx.user.username}`,
            completedAt: new Date(),
          },
        });

        await ctx.prisma.wallet.update({
          where: { id: content.creator.wallet.id },
          data: {
            pendingBalance: { increment: netAmount },
            totalEarnings: { increment: netAmount },
          },
        });
      }

      return { success: true };
    }),

  // Request payout (creator only)
  requestPayout: creatorProcedure
    .input(
      z.object({
        amount: z.number().min(20), // Minimum payout amount
        payoutMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const wallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!wallet) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Wallet not found',
        });
      }

      if (Number(wallet.availableBalance) < input.amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient available balance',
        });
      }

      const payout = await ctx.prisma.payout.create({
        data: {
          walletId: wallet.id,
          amount: input.amount,
          status: 'PENDING',
          payoutMethodId: input.payoutMethodId,
        },
      });

      // Deduct from available balance
      await ctx.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: input.amount },
        },
      });

      return payout;
    }),

  // Get payout history
  payouts: creatorProcedure
    .input(
      z.object({
        status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ON_HOLD']).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, cursor, limit } = input;

      const wallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!wallet) {
        return { payouts: [], nextCursor: undefined };
      }

      const payouts = await ctx.prisma.payout.findMany({
        where: {
          walletId: wallet.id,
          ...(status && { status }),
        },
        orderBy: { requestedAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          payoutMethod: true,
        },
      });

      let nextCursor: string | undefined;
      if (payouts.length > limit) {
        const nextItem = payouts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        payouts,
        nextCursor,
      };
    }),
});
