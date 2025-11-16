'use client'

import { Zap, Shield, Smartphone, Cloud, Code, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const features = [
  {
    icon: Zap,
    title: '閃電般快速',
    description: '優化的效能讓你的工作效率提升 10 倍'
  },
  {
    icon: Shield,
    title: '安全可靠',
    description: '企業級安全保護，讓你的資料無憂'
  },
  {
    icon: Smartphone,
    title: '跨平台支援',
    description: '在任何裝置上都能完美運作'
  },
  {
    icon: Cloud,
    title: '雲端同步',
    description: '即時同步，隨時隨地訪問你的資料'
  },
  {
    icon: Code,
    title: 'AI 代碼生成',
    description: '智慧 AI 幫你自動生成高品質代碼'
  },
  {
    icon: TrendingUp,
    title: '數據分析',
    description: '深入的數據洞察幫助你做出更好的決策'
  }
]

export const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            強大功能，簡單易用
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            我們提供你所需的一切工具，讓你專注於最重要的事情
          </motion.p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition">
                  <Icon className="text-primary-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
