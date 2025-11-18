'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const AI_RESPONSES: Record<string, string> = {
  '功能': '我們的 SaaS 平台提供以下核心功能：\n\n✨ 智能自動化 - 節省 80% 的手動工作時間\n📊 實時分析 - 深入洞察您的業務數據\n🔒 企業級安全 - 符合 SOC2 和 GDPR 標準\n🚀 快速部署 - 5 分鐘即可開始使用\n\n您對哪個功能最感興趣？',

  '價格': '我們提供靈活的定價方案：\n\n💎 入門版 - $29/月\n適合小團隊和初創企業\n\n🚀 專業版 - $99/月\n適合成長中的企業\n\n🏢 企業版 - 客製化定價\n適合大型組織\n\n所有方案都包含 14 天免費試用，無需信用卡！',

  '試用': '開始免費試用非常簡單：\n\n1️⃣ 點擊「免費試用」按鈕\n2️⃣ 輸入您的電子郵件\n3️⃣ 立即開始使用，無需信用卡\n\n試用期間您可以使用所有專業版功能！需要我幫您導航到註冊頁面嗎？',

  '整合': '我們支援與眾多工具無縫整合：\n\n🔗 Slack、Teams、Discord\n📧 Gmail、Outlook\n💼 Salesforce、HubSpot\n💻 GitHub、GitLab、Bitbucket\n📊 Google Analytics、Mixpanel\n\n還支援 REST API 和 Webhooks 用於自定義整合！',

  '安全': '安全是我們的首要任務：\n\n🔐 端到端加密\n✅ SOC 2 Type II 認證\n🛡️ GDPR 和 CCPA 合規\n🔒 雙因素認證 (2FA)\n💾 每日自動備份\n🌍 全球 CDN 部署\n\n您的數據安全由我們守護！',

  '支援': '我們提供全方位的客戶支援：\n\n💬 24/7 即時聊天支援\n📧 郵件支援（4 小時響應時間）\n📚 完整的知識庫和文檔\n🎓 免費在線培訓課程\n🤝 專屬客戶成功經理（企業版）\n\n隨時為您服務！',
}

export const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 您好！我是 AI 助手，很高興為您服務！\n\n我可以回答關於產品功能、價格方案、免費試用等問題。請問有什麼可以幫助您的？'
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Find best matching response
    let response = '我理解您的問題。以下是我們的相關資訊：\n\n'
    let found = false

    for (const [key, value] of Object.entries(AI_RESPONSES)) {
      if (input.toLowerCase().includes(key.toLowerCase())) {
        response = value
        found = true
        break
      }
    }

    if (!found) {
      response = '感謝您的提問！我可以幫您了解：\n\n' +
        '🔍 產品功能和特色\n' +
        '💰 價格方案\n' +
        '🎯 免費試用流程\n' +
        '🔗 系統整合\n' +
        '🔒 安全性與合規\n' +
        '💬 客戶支援\n\n' +
        '請選擇您感興趣的主題，或直接輸入您的問題！'
    }

    setIsTyping(false)
    setMessages(prev => [...prev, { role: 'assistant', content: response }])
  }

  const quickReplies = [
    { emoji: '✨', text: '產品功能' },
    { emoji: '💰', text: '查看價格' },
    { emoji: '🚀', text: '免費試用' },
    { emoji: '🔗', text: '系統整合' },
  ]

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:shadow-2xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">AI 智能助手</h3>
                  <p className="text-xs text-white/80">隨時為您解答疑問</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 bg-white border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">快速選擇：</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(reply.text)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition"
                    >
                      {reply.emoji} {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="輸入您的問題..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
