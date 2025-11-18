'use client';

import { useState } from 'react';
import { MessageCircle, Send, ThumbsUp, Reply } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies?: Comment[];
}

interface CommentsProps {
  postSlug: string;
}

export default function Comments({ postSlug }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Sarah Chen',
      content: 'Great article! The AI features explanation was very clear and practical.',
      timestamp: new Date('2025-11-17'),
      likes: 12,
      replies: [
        {
          id: '1-1',
          author: 'Blog Author',
          content: 'Thanks Sarah! Glad you found it helpful.',
          timestamp: new Date('2025-11-17'),
          likes: 3
        }
      ]
    },
    {
      id: '2',
      author: 'Mike Johnson',
      content: 'I\'ve been using GitHub Copilot for a month now, and it\'s been a game changer for productivity.',
      timestamp: new Date('2025-11-16'),
      likes: 8
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !userName.trim()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const comment: Comment = {
      id: Date.now().toString(),
      author: userName,
      content: newComment,
      timestamp: new Date(),
      likes: 0
    };

    setComments([comment, ...comments]);
    setNewComment('');
    setIsSubmitting(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-8">
        <MessageCircle className="w-6 h-6 text-primary-600" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Comments ({comments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-12">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Comment
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim() || !userName.trim()}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post Comment
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {comment.author}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(comment.timestamp)}
                </p>
              </div>
              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">{comment.likes}</span>
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {comment.content}
            </p>

            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              <Reply className="w-4 h-4" />
              Reply
            </button>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 ml-8 space-y-4">
                {comment.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {reply.author}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(reply.timestamp)}
                        </p>
                      </div>
                      <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="text-xs">{reply.likes}</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Integration Note */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Production Integration:</strong> For production, integrate with comment services like:
          <br />
          • <strong>Giscus</strong> - GitHub Discussions-based comments
          <br />
          • <strong>Disqus</strong> - Full-featured comment system
          <br />
          • <strong>Utterances</strong> - GitHub Issues-based comments
          <br />
          • Custom backend with authentication and moderation
        </p>
      </div>
    </section>
  );
}

/**
 * Integration Examples:
 *
 * 1. Giscus (GitHub Discussions):
 * npm install @giscus/react
 *
 * import Giscus from '@giscus/react'
 * <Giscus
 *   repo="username/repo"
 *   repoId="R_kgDOG..."
 *   category="General"
 *   categoryId="DIC_kwDOG..."
 *   mapping="pathname"
 *   theme="light"
 * />
 *
 * 2. Utterances:
 * Add script to component:
 * <script
 *   src="https://utteranc.es/client.js"
 *   repo="username/repo"
 *   issue-term="pathname"
 *   theme="github-light"
 *   crossorigin="anonymous"
 *   async
 * />
 */
