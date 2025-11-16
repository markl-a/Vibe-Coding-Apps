'use client';

import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface PostCardProps {
  post: {
    id: string;
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
    };
    content: string;
    images?: string[];
    likes: number;
    comments: number;
    shares: number;
    createdAt: Date;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      {/* 用戶資訊 */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          {post.author.name[0]}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
          <p className="text-sm text-gray-500">
            @{post.author.username} · {formatDistanceToNow(post.createdAt, {
              addSuffix: true,
              locale: zhTW
            })}
          </p>
        </div>
      </div>

      {/* 貼文內容 */}
      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* 互動按鈕 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors group">
          <Heart className="w-5 h-5 group-hover:fill-red-600" />
          <span className="text-sm">{post.likes}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">{post.comments}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
          <Share2 className="w-5 h-5" />
          <span className="text-sm">{post.shares}</span>
        </button>

        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group">
          <Bookmark className="w-5 h-5 group-hover:fill-blue-600" />
        </button>
      </div>
    </div>
  );
}
