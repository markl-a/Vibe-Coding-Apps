import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

const blogPosts = [
  {
    id: 1,
    title: '使用 Next.js 14 App Router 打造現代化網站',
    excerpt: '深入探討 Next.js 14 的新特性，包括 App Router、Server Components 與優化技巧。',
    date: new Date('2025-11-10'),
    readTime: 8,
    tags: ['Next.js', 'React', 'Web Development'],
    slug: 'nextjs-14-app-router',
  },
  {
    id: 2,
    title: 'TypeScript 最佳實踐：從入門到精通',
    excerpt: '分享 TypeScript 開發的最佳實踐，包括型別設計、泛型使用與常見陷阱。',
    date: new Date('2025-11-05'),
    readTime: 12,
    tags: ['TypeScript', 'JavaScript', 'Best Practices'],
    slug: 'typescript-best-practices',
  },
  {
    id: 3,
    title: 'Tailwind CSS：快速建立美觀的 UI',
    excerpt: '介紹如何使用 Tailwind CSS 提升開發效率，以及如何客製化設計系統。',
    date: new Date('2025-11-01'),
    readTime: 6,
    tags: ['Tailwind CSS', 'CSS', 'UI/UX'],
    slug: 'tailwind-css-guide',
  },
  {
    id: 4,
    title: 'AI 輔助開發：GitHub Copilot 使用心得',
    excerpt: '分享使用 GitHub Copilot 一年後的心得，以及如何最大化 AI 工具的效益。',
    date: new Date('2025-10-28'),
    readTime: 10,
    tags: ['AI', 'GitHub Copilot', 'Productivity'],
    slug: 'github-copilot-review',
  },
  {
    id: 5,
    title: 'React Server Components 深度解析',
    excerpt: '詳細解說 React Server Components 的工作原理、優勢與使用時機。',
    date: new Date('2025-10-20'),
    readTime: 15,
    tags: ['React', 'Next.js', 'Server Components'],
    slug: 'react-server-components',
  },
  {
    id: 6,
    title: '建立高效能的 Web 應用：優化技巧總整理',
    excerpt: '從代碼分割、圖片優化到快取策略，全方位提升網站效能的實用技巧。',
    date: new Date('2025-10-15'),
    readTime: 11,
    tags: ['Performance', 'Web Development', 'Optimization'],
    slug: 'web-performance-optimization',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">技術部落格</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            分享我的開發經驗、學習筆記與技術見解
          </p>
        </div>

        {/* Blog Posts */}
        <div className="space-y-8">
          {blogPosts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BlogPostCard({ post }: { post: typeof blogPosts[0] }) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
      <Link href={`/blog/${post.slug}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-2xl font-bold hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-2 md:mb-0">
            {post.title}
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={post.date.toISOString()}>
              {format(post.date, 'yyyy年MM月dd日', { locale: zhTW })}
            </time>
            <span>·</span>
            <span>{post.readTime} 分鐘閱讀</span>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </article>
  )
}
