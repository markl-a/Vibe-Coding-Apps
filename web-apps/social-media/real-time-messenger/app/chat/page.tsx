'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useChatStore } from '@/store/chatStore'
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket'
import RoomList from '@/components/RoomList'
import ChatRoom from '@/components/ChatRoom'
import UserList from '@/components/UserList'
import type { Message, Room, User, TypingUser } from '@/types'

export default function ChatPage() {
  const router = useRouter()
  const currentUser = useUserStore((state) => state.currentUser)
  const logout = useUserStore((state) => state.logout)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const {
    currentRoom,
    setCurrentRoom,
    setRooms,
    addMessage,
    setMessages,
    setOnlineUsers,
    addTypingUser,
    removeTypingUser,
  } = useChatStore()

  useEffect(() => {
    if (!currentUser) {
      router.push('/')
      return
    }

    const initSocket = async () => {
      try {
        await connectSocket(currentUser.id, currentUser.nickname)
        const socket = getSocket()
        setIsConnected(true)
        setConnectionError(null)

        // Socket event listeners
        socket.on('connect', () => {
          setIsConnected(true)
          setConnectionError(null)
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
        })

        socket.on('connect_error', (error) => {
          setConnectionError('無法連接到伺服器，請確認伺服器是否運行')
          console.error('Connection error:', error)
        })

        // Room events
        socket.on('room:list', (rooms: Room[]) => {
          setRooms(rooms)
        })

        // Message events
        socket.on('message:new', (message: Message) => {
          addMessage(message)
        })

        // User events
        socket.on('users:online', (users: User[]) => {
          setOnlineUsers(users)
        })

        socket.on('user:joined', (user: User) => {
          console.log('User joined:', user)
        })

        socket.on('user:left', (user: User) => {
          console.log('User left:', user)
        })

        // Typing events
        socket.on('typing:start', (data: TypingUser) => {
          if (data.userId !== currentUser.id) {
            addTypingUser(data)
          }
        })

        socket.on('typing:stop', (data: { userId: string }) => {
          removeTypingUser(data.userId)
        })

        // Request initial room list
        socket.emit('room:list')
      } catch (error) {
        console.error('Failed to initialize socket:', error)
        setConnectionError('初始化連接失敗')
      }
    }

    initSocket()

    return () => {
      disconnectSocket()
    }
  }, [currentUser, router, setRooms, addMessage, setOnlineUsers, addTypingUser, removeTypingUser])

  const handleLogout = () => {
    disconnectSocket()
    logout()
    router.push('/')
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">即時通訊</h1>
              <p className="text-sm text-gray-600">歡迎，{currentUser.nickname}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">已連線</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">未連線</span>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>登出</span>
            </button>
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <p className="text-sm text-red-800 text-center">{connectionError}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Room List Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <RoomList />
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {currentRoom ? (
            <ChatRoom />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  選擇一個聊天室開始對話
                </h2>
                <p className="text-gray-600">
                  從左側選擇一個聊天室，或創建一個新的聊天室
                </p>
              </div>
            </div>
          )}
        </main>

        {/* User List Sidebar */}
        {currentRoom && (
          <aside className="w-64 bg-white border-l border-gray-200 flex-shrink-0">
            <UserList />
          </aside>
        )}
      </div>
    </div>
  )
}
