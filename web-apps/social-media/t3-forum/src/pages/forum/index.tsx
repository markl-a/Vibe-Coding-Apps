import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { api } from "@/utils/api";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

const ForumPage: NextPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );

  // 取得分類列表
  const { data: categories } = api.category.getAll.useQuery();

  // 取得文章列表
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = api.post.getAll.useInfiniteQuery(
    {
      limit: 10,
      categoryId: selectedCategory,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  // 取得熱門文章
  const { data: trendingPosts } = api.recommendation.getTrendingPosts.useQuery({
    limit: 5,
    timeframe: "week",
  });

  // 取得熱門標籤
  const { data: popularTags } = api.recommendation.getPopularTags.useQuery({
    limit: 10,
  });

  const posts = postsData?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <>
      <Head>
        <title>論壇 - T3 Forum</title>
        <meta
          name="description"
          content="T3 Stack 驅動的現代化論壇平台"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                T3 Forum
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/forum"
                  className="text-gray-700 hover:text-blue-600"
                >
                  論壇
                </Link>
                <Link
                  href="/forum/create"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  發表文章
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* 左側邊欄 - 分類 */}
            <aside className="lg:col-span-3">
              <div className="sticky top-8 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">分類</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`w-full rounded-lg px-4 py-2 text-left ${
                      selectedCategory === undefined
                        ? "bg-blue-100 text-blue-700"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    全部分類
                  </button>
                  {categories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left ${
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {category._count.posts}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* 主要內容區 - 文章列表 */}
            <main className="lg:col-span-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategory
                    ? categories?.find((c) => c.id === selectedCategory)?.name
                    : "全部討論"}
                </h1>
                <p className="text-gray-600">
                  共 {posts.length} 篇文章
                </p>
              </div>

              {/* 文章列表 */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600">載入中...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                    <p className="text-gray-600">
                      目前沒有文章,成為第一個發表的人吧!
                    </p>
                    <Link
                      href="/forum/create"
                      className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                    >
                      發表文章
                    </Link>
                  </div>
                ) : (
                  posts.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <Link
                            href={`/forum/post/${post.id}`}
                            className="group"
                          >
                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                              {post.title}
                            </h2>
                          </Link>

                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              {post.author.image && (
                                <img
                                  src={post.author.image}
                                  alt={post.author.name || ""}
                                  className="h-6 w-6 rounded-full"
                                />
                              )}
                              <span>{post.author.name}</span>
                            </div>

                            <span>•</span>

                            <span>
                              {formatDistanceToNow(new Date(post.createdAt), {
                                addSuffix: true,
                                locale: zhTW,
                              })}
                            </span>

                            {post.category && (
                              <>
                                <span>•</span>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                                  {post.category.icon} {post.category.name}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              <span>{post._count.comments} 留言</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              <span>{post.views} 瀏覽</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                                />
                              </svg>
                              <span>{post._count.votes} 投票</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}

                {/* 載入更多按鈕 */}
                {hasNextPage && (
                  <div className="text-center">
                    <button
                      onClick={() => void fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isFetchingNextPage ? "載入中..." : "載入更多"}
                    </button>
                  </div>
                )}
              </div>
            </main>

            {/* 右側邊欄 - 熱門內容 */}
            <aside className="lg:col-span-3">
              <div className="space-y-6">
                {/* 本週熱門 */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">🔥 本週熱門</h2>
                  <div className="space-y-3">
                    {trendingPosts?.map((post, index) => (
                      <Link
                        key={post.id}
                        href={`/forum/post/${post.id}`}
                        className="block hover:bg-gray-50 rounded p-2 -m-2"
                      >
                        <div className="flex gap-3">
                          <span className="text-xl font-bold text-gray-300">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              {post._count.comments} 留言 · {post.views} 瀏覽
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 熱門標籤 */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">#️⃣ 熱門標籤</h2>
                  <div className="flex flex-wrap gap-2">
                    {popularTags?.map((tag) => (
                      <button
                        key={tag.id}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
                      >
                        #{tag.name}
                        <span className="ml-1 text-xs text-gray-500">
                          {tag._count.posts}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
};

export default ForumPage;
