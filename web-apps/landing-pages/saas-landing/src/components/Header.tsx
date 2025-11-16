'use client'

import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/Button'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#" className="text-2xl font-bold text-primary-600">
              VibeCoding
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-primary-600 transition">
              功能
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition">
              價格
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition">
              客戶評價
            </a>
            <a href="#faq" className="text-gray-700 hover:text-primary-600 transition">
              常見問題
            </a>
            <Button variant="outline" size="sm">
              登入
            </Button>
            <Button size="sm">
              免費試用
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <a href="#features" className="block text-gray-700 hover:text-primary-600">
              功能
            </a>
            <a href="#pricing" className="block text-gray-700 hover:text-primary-600">
              價格
            </a>
            <a href="#testimonials" className="block text-gray-700 hover:text-primary-600">
              客戶評價
            </a>
            <a href="#faq" className="block text-gray-700 hover:text-primary-600">
              常見問題
            </a>
            <div className="space-y-2 pt-4">
              <Button variant="outline" className="w-full">
                登入
              </Button>
              <Button className="w-full">
                免費試用
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
