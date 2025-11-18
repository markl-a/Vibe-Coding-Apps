import { createTRPCRouter } from "@/server/api/trpc";
import { postRouter } from "@/server/api/routers/post";
import { commentRouter } from "@/server/api/routers/comment";
import { categoryRouter } from "@/server/api/routers/category";
import { recommendationRouter } from "@/server/api/routers/recommendation";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  comment: commentRouter,
  category: categoryRouter,
  recommendation: recommendationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
