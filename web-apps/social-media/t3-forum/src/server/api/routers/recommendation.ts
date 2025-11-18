import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

/**
 * AI 推薦系統 Router
 * 提供智能內容推薦、相關文章、個人化推薦等功能
 */
export const recommendationRouter = createTRPCRouter({
  /**
   * 取得相關文章
   * 基於當前文章的標籤、分類來推薦相關內容
   */
  getRelatedPosts: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      // 取得當前文章
      const currentPost = await ctx.db.post.findUnique({
        where: { id: input.postId },
        include: {
          tags: true,
          category: true,
        },
      });

      if (!currentPost) {
        return [];
      }

      // 基於標籤和分類推薦相關文章
      const tagIds = currentPost.tags.map((t) => t.id);

      const relatedPosts = await ctx.db.post.findMany({
        where: {
          AND: [
            { id: { not: input.postId } }, // 排除當前文章
            {
              OR: [
                // 相同分類
                { categoryId: currentPost.categoryId },
                // 有相同標籤
                tagIds.length > 0
                  ? {
                      tags: {
                        some: {
                          id: { in: tagIds },
                        },
                      },
                    }
                  : {},
              ],
            },
          ],
        },
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
          category: true,
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      });

      return relatedPosts;
    }),

  /**
   * 個人化推薦
   * 基於用戶的瀏覽歷史、互動記錄推薦文章
   */
  getPersonalizedPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 取得用戶的互動記錄（發文、留言、投票）
      const userPosts = await ctx.db.post.findMany({
        where: { authorId: userId },
        select: { categoryId: true, tags: true },
        take: 10,
      });

      const userComments = await ctx.db.comment.findMany({
        where: { authorId: userId },
        include: {
          post: {
            select: { categoryId: true, tags: true },
          },
        },
        take: 10,
      });

      // 收集用戶感興趣的分類和標籤
      const categoryIds = new Set<string>();
      const tagIds = new Set<string>();

      userPosts.forEach((post) => {
        categoryIds.add(post.categoryId);
        post.tags.forEach((tag) => tagIds.add(tag.id));
      });

      userComments.forEach((comment) => {
        if (comment.post.categoryId) {
          categoryIds.add(comment.post.categoryId);
        }
        comment.post.tags.forEach((tag) => tagIds.add(tag.id));
      });

      // 基於興趣推薦文章
      const recommendedPosts = await ctx.db.post.findMany({
        where: {
          AND: [
            { authorId: { not: userId } }, // 排除自己的文章
            {
              OR: [
                // 感興趣的分類
                categoryIds.size > 0
                  ? { categoryId: { in: Array.from(categoryIds) } }
                  : {},
                // 感興趣的標籤
                tagIds.size > 0
                  ? {
                      tags: {
                        some: {
                          id: { in: Array.from(tagIds) },
                        },
                      },
                    }
                  : {},
              ],
            },
          ],
        },
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
              reputation: true,
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

      return recommendedPosts;
    }),

  /**
   * 熱門文章推薦
   * 基於瀏覽數、留言數、投票數的綜合評分
   */
  getTrendingPosts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        timeframe: z.enum(["day", "week", "month", "all"]).default("week"),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      let startDate = new Date(0); // 預設全部時間

      // 計算時間範圍
      if (input.timeframe === "day") {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (input.timeframe === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (input.timeframe === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const posts = await ctx.db.post.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        take: input.limit,
        orderBy: [
          { views: "desc" },
        ],
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
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      });

      return posts;
    }),

  /**
   * 推薦活躍用戶
   * 基於發文數、留言數、聲望推薦
   */
  getActiveUsers: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        take: input.limit,
        orderBy: [
          { reputation: "desc" },
        ],
        select: {
          id: true,
          name: true,
          image: true,
          reputation: true,
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      });
    }),

  /**
   * 推薦熱門標籤
   * 基於使用頻率推薦標籤
   */
  getPopularTags: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(30).default(15),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tag.findMany({
        take: input.limit,
        orderBy: {
          posts: {
            _count: "desc",
          },
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });
    }),

  /**
   * 智能搜尋建議
   * 基於關鍵字提供搜尋建議
   */
  getSearchSuggestions: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      // 搜尋文章標題
      const postSuggestions = await ctx.db.post.findMany({
        where: {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });

      // 搜尋標籤
      const tagSuggestions = await ctx.db.tag.findMany({
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        take: limit,
        select: {
          id: true,
          name: true,
        },
      });

      // 搜尋分類
      const categorySuggestions = await ctx.db.category.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      return {
        posts: postSuggestions,
        tags: tagSuggestions,
        categories: categorySuggestions,
      };
    }),

  /**
   * AI 內容摘要
   * 為長文生成摘要(簡化版,實際應該調用 AI API)
   */
  getPostSummary: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: {
          id: true,
          title: true,
          content: true,
        },
      });

      if (!post) {
        return null;
      }

      // 簡化版摘要:取前200字
      const summary = post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "");

      // TODO: 整合真實 AI API (如 OpenAI) 生成更智能的摘要

      return {
        postId: post.id,
        title: post.title,
        summary,
        wordCount: post.content.length,
      };
    }),

  /**
   * 相似問題檢測
   * 防止重複提問
   */
  findSimilarQuestions: publicProcedure
    .input(
      z.object({
        title: z.string().min(5).max(200),
        limit: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      // 提取關鍵字(簡化版)
      const keywords = input.title
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);

      if (keywords.length === 0) {
        return [];
      }

      // 搜尋包含相似關鍵字的文章
      const similarPosts = await ctx.db.post.findMany({
        where: {
          OR: keywords.map((keyword) => ({
            title: {
              contains: keyword,
              mode: "insensitive",
            },
          })),
        },
        take: input.limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
      });

      return similarPosts;
    }),
});
