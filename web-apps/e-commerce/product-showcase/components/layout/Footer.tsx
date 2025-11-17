import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">關於我們</h3>
            <p className="text-sm leading-relaxed">
              Product Showcase 提供最優質的電子產品，致力於為客戶帶來最佳的購物體驗。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors text-sm">
                  所有產品
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors text-sm">
                  購物車
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors text-sm">
                  願望清單
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">客戶服務</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition-colors text-sm">
                  聯絡我們
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors text-sm">
                  配送資訊
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors text-sm">
                  退貨政策
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors text-sm">
                  常見問題
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">追蹤我們</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-white transition-colors"
                aria-label="Youtube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2024 Product Showcase. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
