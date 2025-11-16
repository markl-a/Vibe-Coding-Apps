'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const plans = [
  {
    name: '個人版',
    price: '$9',
    period: '/月',
    features: [
      '5 個專案',
      '10 GB 儲存空間',
      '基本支援',
      '所有核心功能',
      '每月 1,000 次 AI 調用'
    ],
    highlighted: false
  },
  {
    name: '專業版',
    price: '$29',
    period: '/月',
    features: [
      '無限專案',
      '100 GB 儲存空間',
      '優先支援',
      '所有進階功能',
      '團隊協作',
      'API 訪問',
      '每月 10,000 次 AI 調用'
    ],
    highlighted: true
  },
  {
    name: '企業版',
    price: '客製',
    period: '',
    features: [
      '無限專案',
      '無限儲存空間',
      '專屬客服',
      '所有功能',
      'SSO 整合',
      'SLA 保證',
      '客製化開發',
      '無限 AI 調用'
    ],
    highlighted: false
  }
]

export const Pricing = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            選擇適合你的方案
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            所有方案都包含 14 天免費試用，無需信用卡
          </motion.p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${
                plan.highlighted ? 'ring-2 ring-primary-600 transform scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  最受歡迎
                </span>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mt-4">
                {plan.name}
              </h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="ml-2 text-gray-600">
                  {plan.period}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-8"
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                開始使用
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
