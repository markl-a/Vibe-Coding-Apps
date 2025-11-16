'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const faqs = [
  {
    question: '如何開始使用？',
    answer: '只需點擊「免費試用」按鈕，註冊一個帳號即可立即開始。無需信用卡，14 天免費試用期內可以體驗所有功能。'
  },
  {
    question: '可以隨時取消訂閱嗎？',
    answer: '當然可以！你可以在帳戶設定中隨時取消訂閱，不會有任何額外費用。取消後仍可使用到當期結束。'
  },
  {
    question: '支援哪些付款方式？',
    answer: '我們支援信用卡、金融卡、Apple Pay、Google Pay 等多種付款方式。企業客戶也可以選擇月結或年付發票。'
  },
  {
    question: '有提供技術支援嗎？',
    answer: '是的！所有付費用戶都可以透過 Email 和即時聊天獲得支援。專業版和企業版用戶享有優先支援和專屬客服。'
  },
  {
    question: '資料安全性如何保證？',
    answer: '我們使用銀行級 256 位元加密技術保護你的資料，並通過 SOC 2 Type II 和 ISO 27001 認證。資料中心位於台灣，符合 GDPR 要求。'
  },
  {
    question: '可以升級或降級方案嗎？',
    answer: '可以的！你可以隨時在帳戶設定中升級或降級方案。升級立即生效，降級則會在下個計費週期生效。'
  }
]

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            常見問題
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600"
          >
            找不到答案？<a href="#" className="text-primary-600 hover:underline">聯絡我們</a>
          </motion.p>
        </div>

        <div ref={ref} className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900 text-lg">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`text-gray-600 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  size={24}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
