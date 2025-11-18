import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  // 取得所有分類（公開）
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });
  }),

  // 取得單一分類（公開）
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });
    }),

  // 取得分類的熱門文章
  getPopularPosts: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        where: { categoryId: input.categoryId },
        take: input.limit,
        orderBy: [
          { views: "desc" },
          { createdAt: "desc" },
        ],
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
              comments: true,
              votes: true,
            },
          },
        },
      });
    }),

  // 建立分類（需認證 - 管理員）
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(50),
        slug: z.string().min(2).max(50),
        description: z.string().max(200).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: 檢查管理員權限

      return ctx.db.category.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          icon: input.icon,
          color: input.color,
        },
      });
    }),

  // 更新分類（需認證 - 管理員）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(2).max(50).optional(),
        description: z.string().max(200).optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: 檢查管理員權限

      return ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          icon: input.icon,
          color: input.color,
        },
      });
    }),

  // 刪除分類（需認證 - 管理員）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: 檢查管理員權限
      // TODO: 檢查分類是否有文章

      return ctx.db.category.delete({
        where: { id: input.id },
      });
    }),
});
