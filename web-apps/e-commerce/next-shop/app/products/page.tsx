'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FiShoppingCart } from 'react-icons/fi'
import { useCartStore } from '@/store/cartStore'

const products = [
  {
    id: 1,
    name: '無線藍牙耳機',
    price: 2990,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    category: '電子產品',
    description: '高品質音效，超長續航力',
  },
  {
    id: 2,
    name: '智能手錶',
    price: 8990,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    category: '電子產品',
    description: '健康監測，運動追蹤',
  },
  {
    id: 3,
    name: '筆記型電腦',
    price: 35900,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
    category: '電子產品',
    description: '輕薄高效，商務首選',
  },
  {
    id: 4,
    name: '相機包',
    price: 1590,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    category: '配件',
    description: '防水耐用，容量充足',
  },
  {
    id: 5,
    name: '機械鍵盤',
    price: 3490,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
    category: '電子產品',
    description: 'RGB背光，極致手感',
  },
  {
    id: 6,
    name: '運動水壺',
    price: 690,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500',
    category: '運動用品',
    description: '保溫保冷，環保材質',
  },
]

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const addItem = useCartStore((state) => state.addItem)

  const categories = ['全部', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = selectedCategory === '全部'
    ? products
    : products.filter(p => p.category === selectedCategory)

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">商品列表</h1>

      {/* Category Filter */}
      <div className="mb-8 flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-64">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <div className="text-sm text-gray-500 mb-2">{product.category}</div>
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-primary-600">
                  NT$ {product.price.toLocaleString()}
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FiShoppingCart />
                  加入購物車
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
