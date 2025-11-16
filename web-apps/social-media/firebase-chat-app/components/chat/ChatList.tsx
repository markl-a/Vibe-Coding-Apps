'use client';

import { Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// 示範資料
const mockChats = [
  {
    id: '1',
    name: '張小明',
    avatar: '張',
    lastMessage: '好的，明天見！',
    lastMessageTime: new Date('2025-11-16T14:30:00'),
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    name: '李美華',
    avatar: '李',
    lastMessage: '這個專案進度如何？',
    lastMessageTime: new Date('2025-11-16T13:15:00'),
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: '3',
    name: '開發團隊',
    avatar: '開',
    lastMessage: '王小華: 我已經完成了功能開發',
    lastMessageTime: new Date('2025-11-16T12:45:00'),
    unreadCount: 5,
    isOnline: true,
    isGroup: true,
  },
];

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

export function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜尋對話..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          新增對話
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {mockChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              selectedChatId === chat.id ? 'bg-indigo-50' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {chat.avatar}
              </div>
              {chat.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            {/* Chat Info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {chat.name}
                </h3>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatDistanceToNow(chat.lastMessageTime, {
                    addSuffix: true,
                    locale: zhTW
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
