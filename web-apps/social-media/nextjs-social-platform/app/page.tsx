import { Home, Users, MessageCircle, Bell } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            歡迎來到社交平台
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            使用 Next.js 和 Socket.io 打造的即時社交媒體平台
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/feed"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              立即開始
            </Link>
            <Link
              href="/about"
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              了解更多
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Home className="w-8 h-8" />}
            title="動態牆"
            description="即時查看朋友的最新動態與貼文"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="好友系統"
            description="建立人脈網路，追蹤感興趣的用戶"
          />
          <FeatureCard
            icon={<MessageCircle className="w-8 h-8" />}
            title="即時聊天"
            description="Socket.io 驅動的即時訊息系統"
          />
          <FeatureCard
            icon={<Bell className="w-8 h-8" />}
            title="通知推送"
            description="即時接收互動通知與系統訊息"
          />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            核心功能
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">貼文發布</h3>
              <p className="text-gray-600">
                支援文字、圖片、影片上傳，Hashtag 標籤與 @ 提及功能
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">互動功能</h3>
              <p className="text-gray-600">
                按讚、留言、分享、收藏，打造活躍的社群互動
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">個人化</h3>
              <p className="text-gray-600">
                個人資料頁面、頭像上傳、封面設置與隱私設定
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-blue-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">準備好開始了嗎？</h2>
          <p className="text-xl mb-8">加入我們的社群，開始分享你的故事</p>
          <Link
            href="/feed"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
          >
            探索動態牆
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
