import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">VibeCoding</h3>
            <p className="text-gray-400 mb-4">
              使用 AI 驅動的工具，讓你的想法快速變成現實。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition">
                <Github size={20} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Linkedin size={20} />
              </a>
              <a href="#" className="hover:text-white transition">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">產品</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">功能</a></li>
              <li><a href="#" className="hover:text-white transition">價格</a></li>
              <li><a href="#" className="hover:text-white transition">更新日誌</a></li>
              <li><a href="#" className="hover:text-white transition">API 文檔</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">公司</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">關於我們</a></li>
              <li><a href="#" className="hover:text-white transition">部落格</a></li>
              <li><a href="#" className="hover:text-white transition">職缺</a></li>
              <li><a href="#" className="hover:text-white transition">聯絡我們</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">法律資訊</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">隱私政策</a></li>
              <li><a href="#" className="hover:text-white transition">服務條款</a></li>
              <li><a href="#" className="hover:text-white transition">Cookie 政策</a></li>
              <li><a href="#" className="hover:text-white transition">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 VibeCoding. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
