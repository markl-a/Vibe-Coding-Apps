import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

// 使用 dynamic import 懒加载大型组件
const PostCard = dynamic(() => import('@/components/posts/PostCard').then(mod => ({ default: mod.PostCard })), {
  loading: () => <div className="bg-white rounded-lg shadow p-6 animate-pulse h-48" />,
  ssr: true,
});

const PostComposer = dynamic(() => import('@/components/posts/PostComposer').then(mod => ({ default: mod.PostComposer })), {
  loading: () => <div className="bg-white rounded-lg shadow p-6 animate-pulse h-32" />,
  ssr: false, // 编辑器不需要 SSR
});

const Sidebar = dynamic(() => import('@/components/ui/Sidebar').then(mod => ({ default: mod.Sidebar })), {
  loading: () => <div className="bg-white rounded-lg shadow p-4 animate-pulse h-64" />,
  ssr: false, // 侧边栏不需要 SSR
});

// 示範資料
const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      name: '張小明',
      username: 'xiaoming',
      avatar: '/avatars/default.png',
    },
    content: '今天天氣真好！☀️ 適合出門走走 #美好的一天',
    images: [],
    likes: 42,
    comments: 8,
    shares: 3,
    createdAt: new Date('2025-11-16T10:30:00'),
  },
  {
    id: '2',
    author: {
      id: '2',
      name: '李美華',
      username: 'meihua',
      avatar: '/avatars/default.png',
    },
    content: '剛完成了一個新專案！使用 Next.js 14 + Socket.io 真的很強大 🚀 #開發日常 #NextJS',
    images: [],
    likes: 128,
    comments: 24,
    shares: 15,
    createdAt: new Date('2025-11-16T09:15:00'),
  },
];

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-blue-600">Social Platform</h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                首頁
              </button>
              <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                訊息
              </button>
              <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                通知
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                登入
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* 左側邊欄 */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* 主要內容區 */}
          <div className="lg:col-span-6">
            <PostComposer />

            <div className="mt-6 space-y-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            <div className="mt-6 text-center">
              <button className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200">
                載入更多貼文
              </button>
            </div>
          </div>

          {/* 右側邊欄 */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">趨勢話題</h3>
              </div>
              <div className="space-y-3">
                <TrendingTopic topic="#NextJS" count="1.2K 貼文" />
                <TrendingTopic topic="#AI開發" count="856 貼文" />
                <TrendingTopic topic="#程式設計" count="642 貼文" />
                <TrendingTopic topic="#Web開發" count="521 貼文" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingTopic({ topic, count }: { topic: string; count: string }) {
  return (
    <div className="hover:bg-gray-50 p-2 rounded cursor-pointer">
      <p className="font-semibold text-gray-900">{topic}</p>
      <p className="text-sm text-gray-500">{count}</p>
    </div>
  );
}
