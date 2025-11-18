import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ai/recommendations
 * AI 驅動的內容推薦系統
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "posts"; // posts, users, trending

    if (!session?.user?.email) {
      // 未登入用戶：推薦熱門內容
      return getPublicRecommendations(type);
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 已登入用戶：個人化推薦
    return getPersonalizedRecommendations(currentUser.id, type);
  } catch (error) {
    console.error("GET /api/ai/recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}

/**
 * 公開推薦 (未登入用戶)
 */
async function getPublicRecommendations(type: string) {
  if (type === "posts") {
    // 推薦熱門貼文 (基於按讚數和留言數)
    const posts = await prisma.post.findMany({
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    // 按互動數排序
    const sortedPosts = posts.sort((a, b) => {
      const scoreA = a._count.likes * 2 + a._count.comments;
      const scoreB = b._count.likes * 2 + b._count.comments;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      type: "trending_posts",
      posts: sortedPosts.slice(0, 5),
    });
  } else if (type === "users") {
    // 推薦活躍用戶
    const users = await prisma.user.findMany({
      take: 10,
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const sortedUsers = users.sort((a, b) => {
      const scoreA = a._count.posts + a._count.followers * 2;
      const scoreB = b._count.posts + b._count.followers * 2;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      type: "active_users",
      users: sortedUsers.slice(0, 5).map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
        bio: u.bio,
        followerCount: u._count.followers,
        postCount: u._count.posts,
      })),
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

/**
 * 個人化推薦 (已登入用戶)
 */
async function getPersonalizedRecommendations(userId: string, type: string) {
  if (type === "posts") {
    // 1. 取得用戶追蹤的人
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // 2. 推薦追蹤用戶的貼文
    let posts = [];

    if (followingIds.length > 0) {
      posts = await prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
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
              likes: true,
              comments: true,
            },
          },
        },
      });
    }

    // 3. 如果追蹤的人不夠,補充熱門貼文
    if (posts.length < 5) {
      const additionalPosts = await prisma.post.findMany({
        where: {
          authorId: { not: userId },
        },
        take: 10 - posts.length,
        orderBy: { createdAt: "desc" },
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
              likes: true,
              comments: true,
            },
          },
        },
      });

      posts = [...posts, ...additionalPosts];
    }

    return NextResponse.json({
      type: "personalized_feed",
      posts,
    });
  } else if (type === "users") {
    // 推薦可能認識的人

    // 1. 取得已追蹤的用戶
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // 2. 找出追蹤的人也追蹤的用戶 (朋友的朋友)
    const friendOfFriends = await prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: {
          not: userId,
          notIn: followingIds,
        },
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
      },
      distinct: ["followingId"],
      take: 10,
    });

    // 3. 如果不夠,補充活躍用戶
    let recommendedUsers = friendOfFriends.map((f) => f.following);

    if (recommendedUsers.length < 5) {
      const activeUsers = await prisma.user.findMany({
        where: {
          id: {
            not: userId,
            notIn: [...followingIds, ...recommendedUsers.map((u) => u.id)],
          },
        },
        take: 5 - recommendedUsers.length,
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
            },
          },
        },
      });

      recommendedUsers = [
        ...recommendedUsers,
        ...activeUsers.map((u) => ({
          id: u.id,
          name: u.name,
          image: u.image,
          bio: u.bio,
        })),
      ];
    }

    return NextResponse.json({
      type: "suggested_users",
      users: recommendedUsers,
    });
  } else if (type === "trending") {
    // 趨勢貼文 (最近24小時內最熱門)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const trendingPosts = await prisma.post.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
      },
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
            likes: true,
            comments: true,
          },
        },
      },
    });

    // 計算熱度分數
    const scoredPosts = trendingPosts
      .map((post) => ({
        ...post,
        score: post._count.likes * 2 + post._count.comments * 3,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({
      type: "trending",
      posts: scoredPosts,
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
