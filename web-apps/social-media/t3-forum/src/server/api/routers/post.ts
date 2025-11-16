import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  // 取得所有文章（公開）
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        categoryId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categoryId } = input;

      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: categoryId ? { categoryId } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          category: true,
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        posts,
        nextCursor,
      };
    }),

  // 取得單一文章（公開）
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              reputation: true,
            },
          },
          category: true,
          tags: true,
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  votes: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      });

      // 增加瀏覽次數
      if (post) {
        await ctx.db.post.update({
          where: { id: input.id },
          data: { views: { increment: 1 } },
        });
      }

      return post;
    }),

  // 建立文章（需認證）
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(5).max(200),
        content: z.string().min(10),
        categoryId: z.string(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug = input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      return ctx.db.post.create({
        data: {
          title: input.title,
          slug: `${slug}-${Date.now()}`,
          content: input.content,
          authorId: ctx.session.user.id,
          categoryId: input.categoryId,
        },
      });
    }),

  // 更新文章（需認證）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(5).max(200).optional(),
        content: z.string().min(10).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new Error("未授權或文章不存在");
      }

      return ctx.db.post.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
        },
      });
    }),

  // 刪除文章（需認證）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
      });

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new Error("未授權或文章不存在");
      }

      return ctx.db.post.delete({
        where: { id: input.id },
      });
    }),
});
