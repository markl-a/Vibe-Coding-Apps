import Head from "next/head";
import Link from "next/link";
import { Users, MessageSquare, TrendingUp, Award } from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>T3 Forum - Type-Safe 論壇系統</title>
        <meta name="description" content="使用 T3 Stack 打造的現代化論壇系統" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        {/* Header */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-8 h-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">T3 Forum</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/forum"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  論壇
                </Link>
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  登入
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  註冊
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              Type-Safe 論壇系統
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              使用 T3 Stack 打造的現代化論壇平台 - 完整型別安全、高效能、易擴展
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/forum"
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
              >
                探索論壇
              </Link>
              <a
                href="#features"
                className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-lg"
              >
                了解特色
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              T3 Stack 技術棧
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <TechCard name="Next.js 14" description="React 框架" />
              <TechCard name="tRPC" description="Type-Safe API" />
              <TechCard name="Prisma" description="資料庫 ORM" />
              <TechCard name="NextAuth.js" description="認證系統" />
              <TechCard name="Tailwind CSS" description="樣式框架" />
            </div>
          </div>

          {/* Features */}
          <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title="討論主題"
              description="建立主題、發表意見、深度討論"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="社群互動"
              description="關注用戶、私訊聊天、建立連結"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="熱門排序"
              description="智慧演算法推薦熱門內容"
            />
            <FeatureCard
              icon={<Award className="w-8 h-8" />}
              title="聲望系統"
              description="累積聲望、獲得徽章、升級等級"
            />
          </div>

          {/* Core Features */}
          <div className="bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              核心功能
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">📝 發文系統</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Markdown 編輯器</li>
                  <li>• 程式碼高亮顯示</li>
                  <li>• 圖片上傳</li>
                  <li>• 標籤分類</li>
                  <li>• 草稿儲存</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">💬 留言系統</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 巢狀回覆</li>
                  <li>• @提及用戶</li>
                  <li>• 投票機制</li>
                  <li>• 最佳解答標記</li>
                  <li>• 即時通知</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">🏆 聲望系統</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 發文獲得聲望</li>
                  <li>• 獲得讚賞加分</li>
                  <li>• 徽章獎勵</li>
                  <li>• 等級升級</li>
                  <li>• 排行榜</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">🔒 權限管理</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• 管理員權限</li>
                  <li>• 版主系統</li>
                  <li>• 內容審核</li>
                  <li>• 用戶封禁</li>
                  <li>• 文章鎖定</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">準備好加入社群了嗎？</h2>
            <p className="text-xl mb-8 opacity-90">立即註冊，開始參與討論</p>
            <Link
              href="/auth/signup"
              className="inline-block px-8 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              免費註冊
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p>© 2025 T3 Forum. All rights reserved.</p>
              <p className="mt-2 text-sm">
                Built with{" "}
                <span className="text-purple-600 font-semibold">T3 Stack</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-purple-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TechCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl">⚡</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
