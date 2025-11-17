'use client'

import { Hash } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatRoom() {
  const { currentRoom } = useChatStore()

  if (!currentRoom) {
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Room Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Hash className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentRoom.name}
            </h2>
            {currentRoom.description && (
              <p className="text-sm text-gray-600">{currentRoom.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList />

      {/* Message Input */}
      <MessageInput />
    </div>
  )
}
