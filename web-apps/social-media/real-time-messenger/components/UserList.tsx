'use client'

import { Users, Circle } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useUserStore } from '@/store/userStore'

export default function UserList() {
  const { onlineUsers, currentRoom } = useChatStore()
  const currentUser = useUserStore((state) => state.currentUser)

  // Filter users by current room (in a real app, you'd get this from the server)
  const roomUsers = onlineUsers

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">線上用戶</h2>
        </div>
        <p className="text-sm text-gray-600">{roomUsers.length} 位成員</p>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {roomUsers.length === 0 ? (
          <div className="p-4 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">目前沒有其他用戶</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {roomUsers.map((user) => {
              const isCurrentUser = user.id === currentUser?.id
              return (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrentUser ? 'bg-primary-50' : 'hover:bg-gray-50'
                  } transition-colors`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <Circle className="w-2.5 h-2.5 text-green-500 fill-green-500" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {user.nickname}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                          你
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(user.joinedAt).toLocaleTimeString('zh-TW', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })} 加入
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
