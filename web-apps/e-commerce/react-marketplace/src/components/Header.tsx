import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingCart, FiMenu } from 'react-icons/fi'
import { useCartStore } from '@/store/cartStore'

export default function Header() {
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const totalItems = getTotalItems()

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            React Marketplace
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-primary-600 transition-colors">
              首頁
            </Link>
            <Link to="/products" className="hover:text-primary-600 transition-colors">
              商品
            </Link>
            <Link to="/cart" className="relative hover:text-primary-600 transition-colors">
              <FiShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3">
            <Link
              to="/"
              className="block py-2 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              首頁
            </Link>
            <Link
              to="/products"
              className="block py-2 hover:text-primary-600 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              商品
            </Link>
            <Link
              to="/cart"
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
