import { useState } from 'react'
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
    name: '運動背包',
    price: 1590,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    category: '服飾配件',
    description: '防水耐用，容量充足',
  },
  {
    id: 4,
    name: '瑜伽墊',
    price: 890,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500',
    category: '運動健身',
    description: '環保材質，防滑設計',
  },
  {
    id: 5,
    name: 'T恤',
    price: 590,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    category: '服飾配件',
    description: '舒適透氣，多色可選',
  },
  {
    id: 6,
    name: '咖啡機',
    price: 3990,
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500',
    category: '生活用品',
    description: '一鍵萃取，享受咖啡香',
  },
]

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const addItem = useCartStore((state) => state.addItem)

  const categories = ['全部', ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts =
    selectedCategory === '全部'
      ? products
      : products.filter((p) => p.category === selectedCategory)

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
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover"
            />
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
