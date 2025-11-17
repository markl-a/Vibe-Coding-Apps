'use client'

import { useChatStore } from '@/store/chatStore'
import { useUserStore } from '@/store/userStore'

export default function TypingIndicator() {
  const { typingUsers, currentRoom } = useChatStore()
  const currentUser = useUserStore((state) => state.currentUser)

  // Filter typing users for current room and exclude current user
  const roomTypingUsers = typingUsers.filter(
    (user) => user.roomId === currentRoom?.id && user.userId !== currentUser?.id
  )

  if (roomTypingUsers.length === 0) {
    return null
  }

  const typingText =
    roomTypingUsers.length === 1
      ? `${roomTypingUsers[0].username} 正在輸入...`
      : roomTypingUsers.length === 2
      ? `${roomTypingUsers[0].username} 和 ${roomTypingUsers[1].username} 正在輸入...`
      : `${roomTypingUsers.length} 個人正在輸入...`

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-gray-500">...</span>
      </div>

      {/* Typing indicator */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-600 mb-1 px-1">
          {typingText}
        </span>
        <div className="bg-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-small" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-small" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-small" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
