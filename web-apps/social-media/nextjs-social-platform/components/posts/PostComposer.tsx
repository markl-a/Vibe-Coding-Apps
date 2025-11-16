'use client';

import { useState } from 'react';
import { Image, Smile, MapPin } from 'lucide-react';

export function PostComposer() {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('發布貼文:', content);
    setContent('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            我
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="有什麼新鮮事？"
              className="w-full border-none resize-none focus:outline-none text-gray-900 placeholder-gray-400 text-lg"
              rows={3}
            />

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="上傳圖片"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="新增表情符號"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="新增位置"
                >
                  <MapPin className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                發布
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
