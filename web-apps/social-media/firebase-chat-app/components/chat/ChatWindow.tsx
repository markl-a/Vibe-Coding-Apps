'use client';

import { useState } from 'react';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

// 示範資料
const mockMessages = [
  {
    id: '1',
    content: '嗨！你好嗎？',
    senderId: 'other',
    senderName: '張小明',
    timestamp: new Date('2025-11-16T14:00:00'),
    isRead: true,
  },
  {
    id: '2',
    content: '我很好！你呢？',
    senderId: 'me',
    senderName: '我',
    timestamp: new Date('2025-11-16T14:02:00'),
    isRead: true,
  },
  {
    id: '3',
    content: '明天有空嗎？我們約個時間討論專案',
    senderId: 'other',
    senderName: '張小明',
    timestamp: new Date('2025-11-16T14:05:00'),
    isRead: true,
  },
  {
    id: '4',
    content: '好的，明天見！',
    senderId: 'me',
    senderName: '我',
    timestamp: new Date('2025-11-16T14:30:00'),
    isRead: false,
  },
];

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log('發送訊息:', message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              張
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">張小明</h2>
            <p className="text-sm text-green-600">在線上</p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {mockMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="輸入訊息..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          按 Enter 傳送，Shift + Enter 換行
        </p>
      </div>
    </div>
  );
}
