'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User } from 'lucide-react';
import { Product } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
}

interface AIChatbotProps {
  products?: Product[];
}

export default function AIChatbot({ products = [] }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！我是 AI 智能客服助手 🤖\n\n我可以幫您：\n• 推薦商品\n• 解答疑問\n• 比較產品\n• 查詢訂單\n\n請問有什麼可以幫助您的嗎？',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();

    // Product recommendations
    if (lowerMessage.includes('推薦') || lowerMessage.includes('建議')) {
      const recommended = products.slice(0, 3);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '根據您的需求，我為您推薦以下商品：',
        timestamp: new Date(),
        products: recommended,
      };
    }

    // Price inquiry
    if (lowerMessage.includes('價格') || lowerMessage.includes('多少錢')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '您可以在商品頁面查看詳細價格。我們提供多種優惠：\n\n• 會員專屬折扣\n• 滿額免運\n• 節日促銷\n\n需要我為您推薦特定價位的商品嗎？',
        timestamp: new Date(),
      };
    }

    // Shipping inquiry
    if (lowerMessage.includes('運送') || lowerMessage.includes('配送') || lowerMessage.includes('物流')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '📦 運送資訊：\n\n• 台灣本島：1-2 個工作天\n• 離島地區：3-5 個工作天\n• 超商取貨：2-3 個工作天\n• 滿 $1000 免運費\n\n您可以在結帳時選擇配送方式。',
        timestamp: new Date(),
      };
    }

    // Payment inquiry
    if (lowerMessage.includes('付款') || lowerMessage.includes('支付')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '💳 我們支援以下付款方式：\n\n• 信用卡（Visa、MasterCard、JCB）\n• LINE Pay\n• Apple Pay\n• ATM 轉帳\n• 超商付款\n\n所有付款都經過加密保護，請放心使用。',
        timestamp: new Date(),
      };
    }

    // Return policy
    if (lowerMessage.includes('退貨') || lowerMessage.includes('退換')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🔄 退換貨政策：\n\n• 7 天鑑賞期（未拆封商品）\n• 14 天無條件退貨（會員專屬）\n• 商品瑕疵可全額退款\n• 免費到府取件\n\n需要辦理退換貨嗎？我可以協助您。',
        timestamp: new Date(),
      };
    }

    // Product comparison
    if (lowerMessage.includes('比較') || lowerMessage.includes('差異')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '我可以幫您比較商品！請告訴我：\n\n1. 您想比較哪些類型的商品？\n2. 您的預算範圍？\n3. 最重視的功能？\n\n這樣我能為您提供更精準的比較分析。',
        timestamp: new Date(),
      };
    }

    // Warranty inquiry
    if (lowerMessage.includes('保固') || lowerMessage.includes('保修')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🛡️ 保固服務：\n\n• 原廠保固：1-3 年（依商品而定）\n• 延長保固方案可選購\n• 全台服務據點\n• 快速維修服務\n\n具體保固期限請參考商品說明。',
        timestamp: new Date(),
      };
    }

    // Member inquiry
    if (lowerMessage.includes('會員') || lowerMessage.includes('註冊')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⭐ 會員權益：\n\n• 購物金回饋 5%\n• 生日專屬優惠\n• 優先購買新品\n• 專屬客服服務\n• 免運門檻降低\n\n立即註冊即享新會員禮！',
        timestamp: new Date(),
      };
    }

    // Greeting
    if (lowerMessage.includes('你好') || lowerMessage.includes('哈囉') || lowerMessage.includes('hello')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '您好！很高興為您服務 😊\n\n我是 AI 購物助手，可以幫您：\n• 找到理想商品\n• 解答各種疑問\n• 提供專業建議\n\n請隨時告訴我您的需求！',
        timestamp: new Date(),
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: '感謝您的提問！我會盡力為您解答。\n\n您可以詢問：\n• 商品推薦\n• 價格與優惠\n• 運送與配送\n• 付款方式\n• 退換貨政策\n• 保固資訊\n\n或者直接告訴我您的需求，我會提供最適合的建議。',
      timestamp: new Date(),
    };
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 group"
          aria-label="打開 AI 客服"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI 智能客服
          </div>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  AI 智能客服
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </h3>
                <p className="text-xs text-white/80">24/7 線上服務</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="關閉聊天"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-gray-50 dark:bg-gray-600 rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                        >
                          <p className="text-xs font-medium">{product.name}</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                            NT$ {product.price.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="輸入您的問題..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="發送訊息"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              由 AI 提供支援 • 24/7 全天候服務
            </p>
          </div>
        </div>
      )}
    </>
  );
}
