import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';

export const messageRouter = router({
  // Get conversations
  conversations: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const participants = await ctx.prisma.conversationParticipant.findMany({
        where: {
          userId: ctx.user.id,
          isArchived: false,
        },
        orderBy: { conversation: { lastMessageAt: 'desc' } },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          conversation: {
            include: {
              participants: {
                where: { userId: { not: ctx.user.id } },
                include: {
                  user: {
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
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: {
                  id: true,
                  text: true,
                  type: true,
                  createdAt: true,
                  senderId: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (participants.length > limit) {
        const nextItem = participants.pop();
        nextCursor = nextItem?.id;
      }

      const conversations = participants.map((p) => ({
        id: p.conversation.id,
        otherUser: p.conversation.participants[0]?.user,
        lastMessage: p.conversation.messages[0],
        unreadCount: p.unreadCount,
        isMuted: p.isMuted,
        lastMessageAt: p.conversation.lastMessageAt,
      }));

      return {
        conversations,
        nextCursor,
      };
    }),

  // Get messages in a conversation
  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const { conversationId, cursor, limit } = input;

      // Verify user is participant
      const participant = await ctx.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      const messages = await ctx.prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      // Mark as read
      await ctx.prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: {
          lastReadAt: new Date(),
          unreadCount: 0,
        },
      });

      // Mark messages as read
      await ctx.prisma.message.updateMany({
        where: {
          conversationId,
          recipientId: ctx.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return {
        messages: messages.reverse(),
        nextCursor,
      };
    }),

  // Send a message
  send: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        text: z.string().max(2000).optional(),
        mediaUrl: z.string().url().optional(),
        mediaType: z.string().optional(),
        thumbnailUrl: z.string().url().optional(),
        isPaid: z.boolean().default(false),
        price: z.number().min(0).max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot message yourself',
        });
      }

      // Check if blocked
      const block = await ctx.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: input.recipientId, blockedId: ctx.user.id },
            { blockerId: ctx.user.id, blockedId: input.recipientId },
          ],
        },
      });

      if (block) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Unable to send message',
        });
      }

      // Find or create conversation
      let conversation = await ctx.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [ctx.user.id, input.recipientId] },
            },
          },
        },
      });

      if (!conversation) {
        conversation = await ctx.prisma.conversation.create({
          data: {
            participants: {
              create: [{ userId: ctx.user.id }, { userId: input.recipientId }],
            },
          },
        });
      }

      // Determine message type
      let type: 'TEXT' | 'MEDIA' | 'PAID_UNLOCK' = 'TEXT';
      if (input.mediaUrl) type = 'MEDIA';
      if (input.isPaid) type = 'PAID_UNLOCK';

      // Create message
      const message = await ctx.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          type,
          text: input.text,
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          thumbnailUrl: input.thumbnailUrl,
          isPaid: input.isPaid,
          price: input.price,
          isUnlocked: !input.isPaid,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update conversation
      await ctx.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      // Update recipient's unread count
      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: input.recipientId,
        },
        data: { unreadCount: { increment: 1 } },
      });

      // Create notification
      await ctx.prisma.notification.create({
        data: {
          userId: input.recipientId,
          type: 'NEW_MESSAGE',
          title: 'New Message',
          body: `@${ctx.user.username} sent you a message`,
          actionUrl: '/messages',
          fromUserId: ctx.user.id,
        },
      });

      return message;
    }),

  // Unlock a paid message
  unlock: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
        include: {
          sender: {
            include: { wallet: true },
          },
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message.recipientId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot unlock this message',
        });
      }

      if (!message.isPaid || message.isUnlocked) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message is already unlocked or not paid',
        });
      }

      const price = Number(message.price);
      const platformFee = price * 0.2;
      const netAmount = price - platformFee;

      // Update message
      await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });

      // Handle wallet transactions
      const fanWallet = await ctx.prisma.wallet.findUnique({
        where: { userId: ctx.user.id },
      });

      if (fanWallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: fanWallet.id,
            type: 'MESSAGE_UNLOCK',
            status: 'COMPLETED',
            amount: -price,
            platformFee: 0,
            processingFee: 0,
            netAmount: -price,
            messageId: input.messageId,
            description: `Unlocked message from @${message.sender.username}`,
            completedAt: new Date(),
          },
        });
      }

      if (message.sender.wallet) {
        await ctx.prisma.transaction.create({
          data: {
            walletId: message.sender.wallet.id,
            type: 'MESSAGE_UNLOCK',
            status: 'COMPLETED',
            amount: price,
            platformFee,
            processingFee: 0,
            netAmount,
            messageId: input.messageId,
            description: `Message unlock from @${ctx.user.username}`,
            completedAt: new Date(),
          },
        });

        await ctx.prisma.wallet.update({
          where: { id: message.sender.wallet.id },
          data: {
            pendingBalance: { increment: netAmount },
            totalEarnings: { increment: netAmount },
          },
        });
      }

      return { success: true };
    }),

  // Archive/unarchive conversation
  archive: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        archive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: ctx.user.id,
        },
        data: { isArchived: input.archive },
      });

      return { success: true };
    }),

  // Mute/unmute conversation
  mute: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        mute: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: ctx.user.id,
        },
        data: { isMuted: input.mute },
      });

      return { success: true };
    }),
});
