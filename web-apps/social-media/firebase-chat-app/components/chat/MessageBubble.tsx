'use client';

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    isRead: boolean;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.senderId === 'me';

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-md ${isMe ? 'order-2' : 'order-1'}`}>
        {!isMe && (
          <p className="text-xs text-gray-500 mb-1 px-1">
            {message.senderName}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {format(message.timestamp, 'HH:mm', { locale: zhTW })}
          </span>
          {isMe && (
            <span className="text-indigo-600">
              {message.isRead ? (
                <CheckCheck className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
