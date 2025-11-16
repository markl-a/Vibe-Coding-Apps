import { FiFacebook, FiInstagram, FiTwitter, FiMail } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">React Marketplace</h3>
            <p className="text-gray-400">
              提供最優質的商品與服務，打造最佳的購物體驗。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">快速連結</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="/products" className="hover:text-white transition-colors">
                  商品列表
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  購物車
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  關於我們
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">客戶服務</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  配送資訊
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  退換貨政策
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  常見問題
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">聯絡我們</h4>
            <p className="text-gray-400 mb-4">
              <FiMail className="inline mr-2" />
              support@reactmarketplace.com
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiFacebook className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiInstagram className="w-6 h-6" />
              </a>
              <a href="#" className="hover:text-primary-400 transition-colors">
                <FiTwitter className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 React Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
