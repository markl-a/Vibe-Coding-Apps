import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";

export const commentRouter = createTRPCRouter({
  // 取得文章的所有留言（公開）
  getByPostId: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { postId, limit, cursor } = input;

      const comments = await ctx.db.comment.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: {
          postId,
          parentId: null, // 只取得頂層留言
        },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              reputation: true,
            },
          },
          replies: {
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
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: {
              votes: true,
              replies: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem!.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  // 建立留言（需認證）
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1).max(2000),
        parentId: z.string().optional(), // 用於回覆其他留言
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          authorId: ctx.session.user.id,
          postId: input.postId,
          parentId: input.parentId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      // 增加作者聲望（發表留言 +2）
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { reputation: { increment: 2 } },
      });

      return comment;
    }),

  // 更新留言（需認證）
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (!comment || comment.authorId !== ctx.session.user.id) {
        throw new Error("未授權或留言不存在");
      }

      return ctx.db.comment.update({
        where: { id: input.id },
        data: {
          content: input.content,
          isEdited: true,
        },
      });
    }),

  // 刪除留言（需認證）
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });

      if (!comment || comment.authorId !== ctx.session.user.id) {
        throw new Error("未授權或留言不存在");
      }

      // 如果有回覆,也一併刪除
      await ctx.db.comment.deleteMany({
        where: { parentId: input.id },
      });

      return ctx.db.comment.delete({
        where: { id: input.id },
      });
    }),

  // 標記最佳解答（需認證 - 僅文章作者）
  markAsBestAnswer: protectedProcedure
    .input(z.object({
      commentId: z.string(),
      postId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 檢查是否為文章作者
      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
      });

      if (!post || post.authorId !== ctx.session.user.id) {
        throw new Error("只有文章作者可以標記最佳解答");
      }

      // 取消其他最佳解答
      await ctx.db.comment.updateMany({
        where: { postId: input.postId },
        data: { isBestAnswer: false },
      });

      // 標記新的最佳解答
      const comment = await ctx.db.comment.update({
        where: { id: input.commentId },
        data: { isBestAnswer: true },
      });

      // 增加回答者聲望（最佳解答 +15）
      if (comment) {
        await ctx.db.user.update({
          where: { id: comment.authorId },
          data: { reputation: { increment: 15 } },
        });
      }

      return comment;
    }),

  // 投票（讚/踩）
  vote: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        value: z.number().min(-1).max(1), // -1: 踩, 0: 取消, 1: 讚
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { commentId, value } = input;
      const userId = ctx.session.user.id;

      // 檢查是否已經投過票
      const existingVote = await ctx.db.commentVote.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });

      const comment = await ctx.db.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new Error("留言不存在");
      }

      if (value === 0) {
        // 取消投票
        if (existingVote) {
          await ctx.db.commentVote.delete({
            where: { id: existingVote.id },
          });

          // 減少作者聲望
          await ctx.db.user.update({
            where: { id: comment.authorId },
            data: { reputation: { increment: existingVote.value === 1 ? -5 : 5 } },
          });
        }
      } else {
        if (existingVote) {
          // 更新投票
          await ctx.db.commentVote.update({
            where: { id: existingVote.id },
            data: { value },
          });

          // 調整聲望
          const reputationChange = (value - existingVote.value) * 5;
          await ctx.db.user.update({
            where: { id: comment.authorId },
            data: { reputation: { increment: reputationChange } },
          });
        } else {
          // 新增投票
          await ctx.db.commentVote.create({
            data: {
              userId,
              commentId,
              value,
            },
          });

          // 增加/減少作者聲望（讚 +5, 踩 -5）
          await ctx.db.user.update({
            where: { id: comment.authorId },
            data: { reputation: { increment: value * 5 } },
          });
        }
      }

      // 返回更新後的留言
      return ctx.db.comment.findUnique({
        where: { id: commentId },
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
      });
    }),
});
