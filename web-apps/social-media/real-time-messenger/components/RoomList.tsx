'use client'

import { useState } from 'react'
import { Hash, Plus, Users, X } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { getSocket } from '@/lib/socket'
import type { Room } from '@/types'

export default function RoomList() {
  const { rooms, currentRoom, setCurrentRoom, clearMessages } = useChatStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDescription, setNewRoomDescription] = useState('')

  const handleJoinRoom = (room: Room) => {
    const socket = getSocket()

    // Leave current room if exists
    if (currentRoom) {
      socket.emit('room:leave', { roomId: currentRoom.id })
    }

    // Join new room
    socket.emit('room:join', { roomId: room.id })
    setCurrentRoom(room)
    clearMessages()

    // Request room messages
    socket.emit('message:history', { roomId: room.id })
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    const socket = getSocket()
    socket.emit('room:create', {
      name: newRoomName.trim(),
      description: newRoomDescription.trim(),
    })

    setNewRoomName('')
    setNewRoomDescription('')
    setShowCreateModal(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">聊天室</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="創建新聊天室"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600">{rooms.length} 個聊天室</p>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {rooms.length === 0 ? (
          <div className="p-4 text-center">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">尚無聊天室</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              創建第一個聊天室
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentRoom?.id === room.id
                    ? 'bg-primary-50 text-primary-900'
                    : 'hover:bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Hash
                    className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      currentRoom?.id === room.id ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium truncate">{room.name}</h3>
                      <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <Users className="w-3 h-3" />
                        {room.userCount}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">創建新聊天室</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                  聊天室名稱 *
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：技術討論"
                  required
                  maxLength={30}
                />
              </div>

              <div>
                <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  描述（可選）
                </label>
                <textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="簡短描述這個聊天室的用途"
                  rows={3}
                  maxLength={100}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-lg font-medium transition-all shadow-lg"
                >
                  創建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
