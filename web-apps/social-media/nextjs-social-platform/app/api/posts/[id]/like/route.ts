import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/posts/[id]/like
 * 按讚貼文 (Toggle: 如果已按讚則取消,否則按讚)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 檢查貼文是否存在
    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 檢查是否已按讚
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: params.id,
          userId: user.id,
        },
      },
    });

    let isLiked: boolean;

    if (existingLike) {
      // 取消按讚
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      // 新增按讚
      await prisma.like.create({
        data: {
          postId: params.id,
          userId: user.id,
        },
      });
      isLiked = true;
    }

    // 取得更新後的按讚數
    const likeCount = await prisma.like.count({
      where: { postId: params.id },
    });

    return NextResponse.json({
      isLiked,
      likeCount,
      message: isLiked ? "Post liked" : "Post unliked",
    });
  } catch (error) {
    console.error(`POST /api/posts/${params.id}/like error:`, error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[id]/like
 * 取得貼文的按讚用戶列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const likes = await prisma.like.findMany({
      where: { postId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      likes: likes.map((like) => like.user),
      count: likes.length,
    });
  } catch (error) {
    console.error(`GET /api/posts/${params.id}/like error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}
