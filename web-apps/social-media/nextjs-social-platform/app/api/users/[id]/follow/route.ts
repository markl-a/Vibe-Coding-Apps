import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/users/[id]/follow
 * 追蹤/取消追蹤用戶 (Toggle)
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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 不能追蹤自己
    if (currentUser.id === params.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // 檢查目標用戶是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 檢查是否已追蹤
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: params.id,
        },
      },
    });

    let isFollowing: boolean;

    if (existingFollow) {
      // 取消追蹤
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      isFollowing = false;
    } else {
      // 新增追蹤
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: params.id,
        },
      });
      isFollowing = true;
    }

    // 取得更新後的追蹤數
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: params.id } }),
      prisma.follow.count({ where: { followerId: params.id } }),
    ]);

    return NextResponse.json({
      isFollowing,
      followerCount,
      followingCount,
      message: isFollowing ? "User followed" : "User unfollowed",
    });
  } catch (error) {
    console.error(`POST /api/users/${params.id}/follow error:`, error);
    return NextResponse.json(
      { error: "Failed to toggle follow" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[id]/follow
 * 取得用戶的追蹤資訊
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'followers' or 'following'

    if (type === "followers") {
      // 取得追蹤者列表
      const followers = await prisma.follow.findMany({
        where: { followingId: params.id },
        include: {
          follower: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: followers.map((f) => f.follower),
        count: followers.length,
      });
    } else if (type === "following") {
      // 取得追蹤中列表
      const following = await prisma.follow.findMany({
        where: { followerId: params.id },
        include: {
          following: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: following.map((f) => f.following),
        count: following.length,
      });
    } else {
      // 取得統計數據
      const [followerCount, followingCount] = await Promise.all([
        prisma.follow.count({ where: { followingId: params.id } }),
        prisma.follow.count({ where: { followerId: params.id } }),
      ]);

      return NextResponse.json({
        followerCount,
        followingCount,
      });
    }
  } catch (error) {
    console.error(`GET /api/users/${params.id}/follow error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch follow data" },
      { status: 500 }
    );
  }
}
