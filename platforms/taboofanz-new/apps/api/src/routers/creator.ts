import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, creatorProcedure } from '../trpc';

export const creatorRouter = router({
  // Get featured creators
  featured: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const creators = await ctx.prisma.creatorProfile.findMany({
        where: {
          isVerified: true,
          user: {
            status: 'ACTIVE',
          },
        },
        orderBy: { subscriberCount: 'desc' },
        take: input.limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              bannerUrl: true,
            },
          },
          tags: {
            include: { tag: true },
            take: 5,
          },
        },
      });

      return creators;
    }),

  // Discover creators with filters (TabooFanz-specific filtering)
  discover: publicProcedure
    .input(
      z.object({
        archetype: z.enum([
          'THE_SIREN',
          'THE_PHANTOM',
          'THE_REBEL',
          'THE_DOLL',
          'THE_BEAST',
          'THE_ENIGMA',
          'THE_ORACLE',
          'THE_SWITCH',
          'THE_SOVEREIGN',
          'CUSTOM',
        ]).optional(),
        powerEnergy: z.enum([
          'DOMINANT',
          'SUBMISSIVE',
          'SWITCH',
          'BRAT',
          'PRIMAL',
          'CARETAKER',
        ]).optional(),
        tags: z.array(z.string()).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { archetype, powerEnergy, tags, cursor, limit } = input;

      const creators = await ctx.prisma.creatorProfile.findMany({
        where: {
          user: { status: 'ACTIVE' },
          ...(archetype && { archetype }),
          ...(powerEnergy && { powerEnergy }),
          ...(tags?.length && {
            tags: {
              some: {
                tag: {
                  slug: { in: tags },
                },
              },
            },
          }),
        },
        orderBy: [{ subscriberCount: 'desc' }, { createdAt: 'desc' }],
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
              bannerUrl: true,
              bio: true,
            },
          },
          tags: {
            include: { tag: true },
            take: 5,
          },
        },
      });

      let nextCursor: string | undefined;
      if (creators.length > limit) {
        const nextItem = creators.pop();
        nextCursor = nextItem?.id;
      }

      return {
        creators,
        nextCursor,
      };
    }),

  // Update creator profile
  updateProfile: creatorProcedure
    .input(
      z.object({
        archetype: z.enum([
          'THE_SIREN',
          'THE_PHANTOM',
          'THE_REBEL',
          'THE_DOLL',
          'THE_BEAST',
          'THE_ENIGMA',
          'THE_ORACLE',
          'THE_SWITCH',
          'THE_SOVEREIGN',
          'CUSTOM',
        ]).optional(),
        customArchetypeName: z.string().max(50).optional(),
        archetypeDescription: z.string().max(500).optional(),
        powerEnergy: z.enum([
          'DOMINANT',
          'SUBMISSIVE',
          'SWITCH',
          'BRAT',
          'PRIMAL',
          'CARETAKER',
        ]).optional().nullable(),
        tagline: z.string().max(200).optional(),
        extendedBio: z.string().max(2000).optional(),
        brandColors: z.object({
          primary: z.string(),
          secondary: z.string(),
          accent: z.string(),
        }).optional(),
        subscriptionPrice: z.number().min(0).max(500).optional(),
        messagePrice: z.number().min(0).max(100).optional().nullable(),
        welcomeMessage: z.string().max(500).optional(),
        autoReplyEnabled: z.boolean().optional(),
        autoReplyMessage: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.creatorProfile.update({
        where: { userId: ctx.user.id },
        data: input,
      });

      return profile;
    }),

  // Update identity protection settings (TabooFanz-specific)
  updateIdentityProtection: creatorProcedure
    .input(
      z.object({
        maskedModeEnabled: z.boolean().optional(),
        autoBlurBackground: z.boolean().optional(),
        faceDetectionWarnings: z.boolean().optional(),
        locationWarnings: z.boolean().optional(),
        tattooWarnings: z.boolean().optional(),
        blockedCountries: z.array(z.string()).optional(),
        blockedRegions: z.array(z.string()).optional(),
        vpnAccessAllowed: z.boolean().optional(),
        realNameHidden: z.boolean().optional(),
        metadataStripping: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      const protection = await ctx.prisma.identityProtection.upsert({
        where: { creatorProfileId: creatorProfile.id },
        update: input,
        create: {
          creatorProfileId: creatorProfile.id,
          ...input,
        },
      });

      return protection;
    }),

  // Update boundary profile (TabooFanz-specific)
  updateBoundaryProfile: creatorProcedure
    .input(
      z.object({
        publicStatement: z.string().max(1000).optional(),
        comfortableTags: z.array(z.string()).optional(),
        hardBoundaries: z.array(z.string()).optional(),
        internalNotes: z.string().max(2000).optional(),
        dmsOpenTo: z.enum(['all', 'subscribers', 'none']).optional(),
        customRequestsAllowed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      const boundary = await ctx.prisma.boundaryProfile.upsert({
        where: { creatorProfileId: creatorProfile.id },
        update: input,
        create: {
          creatorProfileId: creatorProfile.id,
          ...input,
        },
      });

      return boundary;
    }),

  // Update creator tags
  updateTags: creatorProcedure
    .input(
      z.object({
        tags: z.array(
          z.object({
            slug: z.string(),
            isPrimary: z.boolean().default(false),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      // Delete existing tags
      await ctx.prisma.creatorTag.deleteMany({
        where: { creatorProfileId: creatorProfile.id },
      });

      // Add new tags
      for (const tagInput of input.tags) {
        const tag = await ctx.prisma.tag.findUnique({
          where: { slug: tagInput.slug },
        });

        if (tag) {
          await ctx.prisma.creatorTag.create({
            data: {
              creatorProfileId: creatorProfile.id,
              tagId: tag.id,
              isPrimary: tagInput.isPrimary,
            },
          });
        }
      }

      // Update tag usage counts
      await ctx.prisma.$executeRaw`
        UPDATE "Tag" t
        SET "usageCount" = (
          SELECT COUNT(*) FROM "CreatorTag" ct WHERE ct."tagId" = t.id
        )
      `;

      return { success: true };
    }),

  // Get creator analytics
  analytics: creatorProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      const startDate = input.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = input.endDate || new Date();

      const analytics = await ctx.prisma.creatorAnalytics.findMany({
        where: {
          creatorProfileId: creatorProfile.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });

      // Summary stats
      const summary = {
        totalProfileViews: analytics.reduce((sum, a) => sum + a.profileViews, 0),
        totalContentViews: analytics.reduce((sum, a) => sum + a.contentViews, 0),
        totalLikes: analytics.reduce((sum, a) => sum + a.likes, 0),
        totalComments: analytics.reduce((sum, a) => sum + a.comments, 0),
        newSubscribers: analytics.reduce((sum, a) => sum + a.newSubscribers, 0),
        churnedSubscribers: analytics.reduce((sum, a) => sum + a.churnedSubscribers, 0),
        totalRevenue: analytics.reduce(
          (sum, a) =>
            sum +
            Number(a.subscriptionRevenue) +
            Number(a.tipRevenue) +
            Number(a.ppvRevenue) +
            Number(a.messageRevenue),
          0
        ),
      };

      return {
        daily: analytics,
        summary,
        subscriberCount: creatorProfile.subscriberCount,
        totalEarnings: creatorProfile.totalEarnings,
        contentCount: creatorProfile.contentCount,
      };
    }),

  // Create subscription tier
  createTier: creatorProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        description: z.string().max(500).optional(),
        price: z.number().min(0).max(500),
        intervalDays: z.number().min(7).max(365).default(30),
        trialDays: z.number().min(0).max(30).default(0),
        benefits: z.array(z.string()).default([]),
        maxSubscribers: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorProfile = await ctx.prisma.creatorProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!creatorProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Creator profile not found',
        });
      }

      const tier = await ctx.prisma.subscriptionTier.create({
        data: {
          creatorProfileId: creatorProfile.id,
          ...input,
        },
      });

      return tier;
    }),
});
