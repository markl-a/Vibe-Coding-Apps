'use client'

import Link from 'next/link'
import { FiShoppingCart, FiMenu } from 'react-icons/fi'
import { useCartStore } from '@/store/cartStore'
import { useState } from 'react'

export default function Header() {
  const items = useCartStore((state) => state.items)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Next Shop
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              首頁
            </Link>
            <Link href="/products" className="hover:text-primary-600 transition-colors">
              商品
            </Link>
            <Link href="/cart" className="relative hover:text-primary-600 transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3">
            <Link
              href="/"
              className="block py-2 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              首頁
            </Link>
            <Link
              href="/products"
              className="block py-2 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              商品
            </Link>
            <Link
              href="/cart"
              className="block py-2 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              購物車 ({totalItems})
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
