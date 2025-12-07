import { z } from 'zod';
import { router, publicProcedure, adminProcedure } from '../trpc';

export const tagRouter = router({
  // Get all tag groups with their tags
  groups: publicProcedure.query(async ({ ctx }) => {
    const groups = await ctx.prisma.tagGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        tags: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return groups;
  }),

  // Get tags by group slug
  byGroup: publicProcedure
    .input(z.object({ groupSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const group = await ctx.prisma.tagGroup.findUnique({
        where: { slug: input.groupSlug },
        include: {
          tags: {
            where: { isActive: true },
            orderBy: [{ usageCount: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      });

      return group;
    }),

  // Get popular tags
  popular: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const tags = await ctx.prisma.tag.findMany({
        where: { isActive: true },
        orderBy: { usageCount: 'desc' },
        take: input.limit,
        include: {
          group: true,
        },
      });

      return tags;
    }),

  // Search tags
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const tags = await ctx.prisma.tag.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { slug: { contains: input.query, mode: 'insensitive' } },
          ],
        },
        orderBy: { usageCount: 'desc' },
        take: 20,
        include: {
          group: true,
        },
      });

      return tags;
    }),

  // Admin: Create tag group
  createGroup: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        slug: z.string().min(1).max(50),
        description: z.string().max(200).optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.tagGroup.create({
        data: input,
      });

      return group;
    }),

  // Admin: Create tag
  createTag: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        name: z.string().min(1).max(50),
        slug: z.string().min(1).max(50),
        description: z.string().max(200).optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(7).optional(),
        sortOrder: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tag = await ctx.prisma.tag.create({
        data: input,
      });

      return tag;
    }),

  // Admin: Update tag
  updateTag: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().max(200).optional(),
        icon: z.string().max(10).optional(),
        color: z.string().max(7).optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const tag = await ctx.prisma.tag.update({
        where: { id },
        data,
      });

      return tag;
    }),
});
