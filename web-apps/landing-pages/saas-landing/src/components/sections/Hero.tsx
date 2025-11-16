'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight, Play } from 'lucide-react'
import { motion } from 'framer-motion'

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6"
        >
          🎉 新功能上線！AI 驅動的代碼生成器
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
        >
          打造你的夢想產品
          <br />
          <span className="text-primary-600">更快更簡單</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto"
        >
          使用 AI 驅動的工具，讓你的想法在幾分鐘內變成現實。
          無需編程經驗，立即開始。
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button size="lg" className="text-lg px-8 py-4">
            開始免費試用
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-4">
            <Play className="mr-2" size={20} />
            觀看示範影片
          </Button>
        </motion.div>

        {/* Social Proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-gray-500 mb-16"
        >
          已有 <span className="font-bold text-gray-900">10,000+</span> 位用戶信賴
        </motion.p>

        {/* Product Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="rounded-lg shadow-2xl border border-gray-200 bg-white p-2">
            <div className="aspect-video bg-gradient-to-br from-primary-400 to-indigo-600 rounded flex items-center justify-center text-white text-2xl font-semibold">
              產品截圖預覽
            </div>
          </div>
          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg shadow-lg font-semibold hidden lg:block">
            ⚡ 快速部署
          </div>
          <div className="absolute -bottom-4 -right-4 bg-green-400 text-green-900 px-4 py-2 rounded-lg shadow-lg font-semibold hidden lg:block">
            ✅ 高轉換率
          </div>
        </motion.div>
      </div>
    </section>
  )
}
