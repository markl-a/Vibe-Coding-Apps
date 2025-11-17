'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageCircle, User, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/store/userStore'

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(2, '暱稱至少需要 2 個字元')
    .max(20, '暱稱最多 20 個字元')
    .regex(/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/, '暱稱只能包含字母、數字、中文、底線和連字號'),
})

type NicknameFormData = z.infer<typeof nicknameSchema>

export default function HomePage() {
  const router = useRouter()
  const setCurrentUser = useUserStore((state) => state.setCurrentUser)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NicknameFormData>({
    resolver: zodResolver(nicknameSchema),
  })

  const onSubmit = async (data: NicknameFormData) => {
    setIsLoading(true)
    try {
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Set user in store
      setCurrentUser({
        id: userId,
        nickname: data.nickname,
        joinedAt: new Date(),
      })

      // Navigate to chat
      router.push('/chat')
    } catch (error) {
      console.error('Error setting up user:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            即時通訊
          </h1>
          <p className="text-gray-600">
            輸入您的暱稱開始聊天
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                暱稱
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nickname"
                  type="text"
                  {...register('nickname')}
                  className={`block w-full pl-10 pr-3 py-3 border ${
                    errors.nickname ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="請輸入您的暱稱"
                  disabled={isLoading}
                />
              </div>
              {errors.nickname && (
                <p className="mt-2 text-sm text-red-600 animate-fade-in">
                  {errors.nickname.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>準備中...</span>
                </>
              ) : (
                <>
                  <span>進入聊天室</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-4">功能特色</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>即時訊息</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>多聊天室</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>線上用戶</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>打字指示</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
