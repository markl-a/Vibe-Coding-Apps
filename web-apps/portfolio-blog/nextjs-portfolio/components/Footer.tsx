import { FaGithub, FaLinkedin, FaTwitter, FaEnvelope } from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Portfolio</h3>
            <p className="text-gray-400">
              全端工程師，專注於打造優質的網頁應用。使用現代化技術棧，結合 AI 工具提升開發效率。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <a href="/projects" className="text-gray-400 hover:text-primary-400 transition-colors">
                  作品集
                </a>
              </li>
              <li>
                <a href="/blog" className="text-gray-400 hover:text-primary-400 transition-colors">
                  部落格
                </a>
              </li>
              <li>
                <a href="/about" className="text-gray-400 hover:text-primary-400 transition-colors">
                  關於我
                </a>
              </li>
              <li>
                <a href="/contact" className="text-gray-400 hover:text-primary-400 transition-colors">
                  聯絡我
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xl font-bold mb-4">聯絡方式</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaGithub size={24} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaLinkedin size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaTwitter size={24} />
              </a>
              <a
                href="mailto:your.email@example.com"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <FaEnvelope size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Portfolio. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
