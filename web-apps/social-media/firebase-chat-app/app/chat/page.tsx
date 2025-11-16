'use client';

import { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Firebase Chat</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
          <ChatList
            onSelectChat={setSelectedChat}
            selectedChatId={selectedChat}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow chatId={selectedChat} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <p className="text-xl">選擇一個對話開始聊天</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
