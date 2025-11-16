import { MessageCircle, Users, Lock, Zap, Globe, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Firebase Chat</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                登入
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                註冊
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            即時聊天，無縫連接
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            使用 Firebase 打造的現代化聊天應用，安全、快速、可靠
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/chat"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
            >
              開始聊天
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-lg"
            >
              了解功能
            </a>
          </div>
        </div>

        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="即時通訊"
            description="Firebase Firestore 即時資料庫，訊息即時同步"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="群組聊天"
            description="建立群組、邀請成員、管理權限"
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="安全認證"
            description="Firebase Authentication 多種登入方式"
          />
          <FeatureCard
            icon={<MessageCircle className="w-8 h-8" />}
            title="豐富互動"
            description="支援文字、表情符號、檔案分享"
          />
          <FeatureCard
            icon={<Globe className="w-8 h-8" />}
            title="跨平台"
            description="支援網頁、手機、平板各種裝置"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="隱私保護"
            description="端對端加密，保護您的隱私"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            核心功能
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">一對一聊天</h3>
                <p className="text-gray-600">
                  私密對話，即時已讀狀態，正在輸入指示器
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">群組聊天</h3>
                <p className="text-gray-600">
                  建立群組、新增成員、設定管理員權限
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">即時通知</h3>
                <p className="text-gray-600">
                  新訊息推送通知，永不錯過重要對話
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">檔案分享</h3>
                <p className="text-gray-600">
                  分享圖片、影片、文件，Firebase Storage 安全儲存
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">準備好開始聊天了嗎？</h2>
          <p className="text-xl mb-8 opacity-90">立即註冊，開始與朋友即時互動</p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            免費註冊
          </Link>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© 2025 Firebase Chat. All rights reserved.</p>
            <p className="mt-2 text-sm">Built with Next.js 14 + Firebase</p>
          </div>
        </div>
      </footer>
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
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
