'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useChatStore } from '@/store/chatStore'
import { useUserStore } from '@/store/userStore'
import TypingIndicator from './TypingIndicator'

export default function MessageList() {
  const { messages, currentRoom } = useChatStore()
  const currentUser = useUserStore((state) => state.currentUser)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Filter messages for current room
  const roomMessages = messages.filter((msg) => msg.roomId === currentRoom?.id)

  if (!currentRoom) {
    return null
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
    >
      {roomMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-gray-500 mb-2">還沒有訊息</p>
            <p className="text-sm text-gray-400">發送第一條訊息開始對話吧！</p>
          </div>
        </div>
      ) : (
        <>
          {roomMessages.map((message, index) => {
            const isOwnMessage = message.userId === currentUser?.id
            const showAvatar =
              index === 0 ||
              roomMessages[index - 1].userId !== message.userId ||
              new Date(message.timestamp).getTime() -
                new Date(roomMessages[index - 1].timestamp).getTime() >
                60000 // 1 minute

            const showTimestamp =
              index === 0 ||
              new Date(message.timestamp).getTime() -
                new Date(roomMessages[index - 1].timestamp).getTime() >
                300000 // 5 minutes

            return (
              <div key={message.id}>
                {/* Timestamp Divider */}
                {showTimestamp && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {format(new Date(message.timestamp), 'PPp', { locale: zhTW })}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`flex items-start gap-3 ${
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  } ${!showAvatar && 'ml-11'}`}
                >
                  {/* Avatar */}
                  {showAvatar && (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                        isOwnMessage
                          ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                          : 'bg-gradient-to-br from-gray-500 to-gray-700'
                      }`}
                    >
                      {message.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Message Content */}
                  <div
                    className={`flex flex-col ${
                      isOwnMessage ? 'items-end' : 'items-start'
                    } max-w-[70%]`}
                  >
                    {/* Username */}
                    {showAvatar && !isOwnMessage && (
                      <span className="text-sm font-medium text-gray-900 mb-1 px-1">
                        {message.username}
                      </span>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-tr-sm'
                          : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                      } shadow-sm animate-fade-in`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {/* Message Time */}
                    <span className="text-xs text-gray-500 mt-1 px-1">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          <TypingIndicator />

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  )
}
