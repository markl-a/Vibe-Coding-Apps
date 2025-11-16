'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiShoppingBag, FiTruck, FiShield, FiCreditCard } from 'react-icons/fi'

export default function Home() {
  const features = [
    {
      icon: <FiShoppingBag className="w-8 h-8" />,
      title: '精選商品',
      description: '嚴選優質商品，確保最佳品質',
    },
    {
      icon: <FiTruck className="w-8 h-8" />,
      title: '快速配送',
      description: '24小時內出貨，快速送達',
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: '安全保障',
      description: '30天無條件退換貨保證',
    },
    {
      icon: <FiCreditCard className="w-8 h-8" />,
      title: '多元付款',
      description: '支援信用卡、轉帳等多種付款方式',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl font-bold mb-6">
              歡迎來到 Next Shop
            </h1>
            <p className="text-xl mb-8">
              探索精選商品，享受優質購物體驗
            </p>
            <Link
              href="/products"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              開始購物
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            為什麼選擇我們
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md text-center"
              >
                <div className="text-primary-600 flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">準備開始購物了嗎？</h2>
          <p className="text-xl text-gray-600 mb-8">
            瀏覽我們的商品目錄，找到您喜歡的商品
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            查看所有商品
          </Link>
        </div>
      </section>
    </div>
  )
}
