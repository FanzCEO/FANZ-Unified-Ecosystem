import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, creatorProcedure } from '../trpc';

export const contentRouter = router({
  // Get content feed for authenticated user
  feed: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      // Get creators the user is subscribed to
      const subscriptions = await ctx.prisma.subscription.findMany({
        where: {
          fanId: ctx.user.id,
          status: 'ACTIVE',
        },
        select: { creatorId: true },
      });

      const subscribedCreatorIds = subscriptions.map((s) => s.creatorId);

      const content = await ctx.prisma.contentItem.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { visibility: 'PUBLIC' },
            {
              visibility: 'SUBSCRIBERS_ONLY',
              creatorId: { in: subscribedCreatorIds },
            },
          ],
        },
        orderBy: { publishedAt: 'desc' },
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
          mediaItems: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
          tags: {
            include: { tag: true },
            take: 5,
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (content.length > limit) {
        const nextItem = content.pop();
        nextCursor = nextItem?.id;
      }

      // Check if user has liked each item
      const contentIds = content.map((c) => c.id);
      const userLikes = await ctx.prisma.like.findMany({
        where: {
          userId: ctx.user.id,
          contentId: { in: contentIds },
        },
        select: { contentId: true },
      });
      const likedContentIds = new Set(userLikes.map((l) => l.contentId));

      const contentWithLikes = content.map((item) => ({
        ...item,
        isLiked: likedContentIds.has(item.id),
      }));

      return {
        items: contentWithLikes,
        nextCursor,
      };
    }),

  // Get single content item
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const content = await ctx.prisma.contentItem.findUnique({
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
          mediaItems: {
            orderBy: { sortOrder: 'asc' },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      if (!content || content.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      // Check access
      let hasAccess = content.visibility === 'PUBLIC';

      if (ctx.user) {
        if (content.creatorId === ctx.user.id) {
          hasAccess = true;
        } else if (content.visibility === 'SUBSCRIBERS_ONLY') {
          const subscription = await ctx.prisma.subscription.findUnique({
            where: {
              fanId_creatorId: {
                fanId: ctx.user.id,
                creatorId: content.creatorId,
              },
            },
          });
          hasAccess = subscription?.status === 'ACTIVE';
        } else if (content.visibility === 'PPV') {
          const unlock = await ctx.prisma.contentUnlock.findUnique({
            where: {
              contentId_userId: {
                contentId: input.id,
                userId: ctx.user.id,
              },
            },
          });
          hasAccess = !!unlock;
        }
      }

      // Increment view count
      await ctx.prisma.contentItem.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });

      return {
        ...content,
        hasAccess,
        // Blur media URLs if no access
        mediaItems: hasAccess
          ? content.mediaItems
          : content.mediaItems.map((m) => ({
              ...m,
              cdnUrl: m.thumbnailUrl, // Show thumbnail only
            })),
      };
    }),

  // Create new content (creator only)
  create: creatorProcedure
    .input(
      z.object({
        type: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'TEXT', 'GALLERY']),
        visibility: z.enum(['PUBLIC', 'SUBSCRIBERS_ONLY', 'PPV', 'PRIVATE']).default('SUBSCRIBERS_ONLY'),
        caption: z.string().max(2000).optional(),
        price: z.number().min(0).max(500).optional(),
        scheduledAt: z.date().optional(),
        tags: z.array(z.string()).default([]),
        mediaItems: z
          .array(
            z.object({
              storageKey: z.string(),
              cdnUrl: z.string(),
              thumbnailUrl: z.string().optional(),
              mimeType: z.string(),
              fileSize: z.number(),
              width: z.number().optional(),
              height: z.number().optional(),
              duration: z.number().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tags, mediaItems, ...contentData } = input;

      const content = await ctx.prisma.contentItem.create({
        data: {
          ...contentData,
          creatorId: ctx.user.id,
          status: input.scheduledAt ? 'DRAFT' : 'PUBLISHED',
          publishedAt: input.scheduledAt ? null : new Date(),
          mediaItems: {
            create: mediaItems.map((item, index) => ({
              ...item,
              sortOrder: index,
            })),
          },
        },
        include: {
          mediaItems: true,
        },
      });

      // Add tags
      for (const tagSlug of tags) {
        const tag = await ctx.prisma.tag.findUnique({
          where: { slug: tagSlug },
        });
        if (tag) {
          await ctx.prisma.contentTag.create({
            data: {
              contentId: content.id,
              tagId: tag.id,
            },
          });
        }
      }

      // Update creator content count
      await ctx.prisma.creatorProfile.update({
        where: { userId: ctx.user.id },
        data: { contentCount: { increment: 1 } },
      });

      return content;
    }),

  // Update content
  update: creatorProcedure
    .input(
      z.object({
        id: z.string(),
        caption: z.string().max(2000).optional(),
        visibility: z.enum(['PUBLIC', 'SUBSCRIBERS_ONLY', 'PPV', 'PRIVATE']).optional(),
        price: z.number().min(0).max(500).optional().nullable(),
        isPinned: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const existing = await ctx.prisma.contentItem.findUnique({
        where: { id },
      });

      if (!existing || existing.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      const content = await ctx.prisma.contentItem.update({
        where: { id },
        data: updateData,
      });

      return content;
    }),

  // Delete content
  delete: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.contentItem.findUnique({
        where: { id: input.id },
      });

      if (!existing || existing.creatorId !== ctx.user.id) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      await ctx.prisma.contentItem.delete({
        where: { id: input.id },
      });

      // Update creator content count
      await ctx.prisma.creatorProfile.update({
        where: { userId: ctx.user.id },
        data: { contentCount: { decrement: 1 } },
      });

      return { success: true };
    }),

  // Like content
  like: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.contentItem.findUnique({
        where: { id: input.id },
      });

      if (!content || content.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      await ctx.prisma.like.upsert({
        where: {
          contentId_userId: {
            contentId: input.id,
            userId: ctx.user.id,
          },
        },
        update: {},
        create: {
          contentId: input.id,
          userId: ctx.user.id,
        },
      });

      await ctx.prisma.contentItem.update({
        where: { id: input.id },
        data: { likeCount: { increment: 1 } },
      });

      return { success: true };
    }),

  // Unlike content
  unlike: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.like.deleteMany({
        where: {
          contentId: input.id,
          userId: ctx.user.id,
        },
      });

      await ctx.prisma.contentItem.update({
        where: { id: input.id },
        data: { likeCount: { decrement: 1 } },
      });

      return { success: true };
    }),

  // Add comment
  comment: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        text: z.string().min(1).max(1000),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.contentItem.findUnique({
        where: { id: input.contentId },
      });

      if (!content || content.status !== 'PUBLISHED') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      const comment = await ctx.prisma.comment.create({
        data: {
          contentId: input.contentId,
          userId: ctx.user.id,
          text: input.text,
          parentId: input.parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      await ctx.prisma.contentItem.update({
        where: { id: input.contentId },
        data: { commentCount: { increment: 1 } },
      });

      return comment;
    }),

  // Get comments for content
  comments: publicProcedure
    .input(
      z.object({
        contentId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { contentId, cursor, limit } = input;

      const comments = await ctx.prisma.comment.findMany({
        where: {
          contentId,
          parentId: null, // Top-level comments only
          isHidden: false,
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
              avatarUrl: true,
            },
          },
          replies: {
            where: { isHidden: false },
            orderBy: { createdAt: 'asc' },
            take: 3,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { replies: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  // Report content
  report: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const content = await ctx.prisma.contentItem.findUnique({
        where: { id: input.contentId },
      });

      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      const report = await ctx.prisma.report.create({
        data: {
          reporterId: ctx.user.id,
          reportedUserId: content.creatorId,
          type: 'CONTENT',
          contentId: input.contentId,
          category: input.category,
          description: input.description,
        },
      });

      // Flag content for review
      await ctx.prisma.contentItem.update({
        where: { id: input.contentId },
        data: { isReported: true },
      });

      return { reportId: report.id };
    }),
});
