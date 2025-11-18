'use client';

import { PostMeta } from '@/lib/types';
import BlogCard from './BlogCard';
import { Sparkles } from 'lucide-react';

interface RelatedPostsProps {
  currentPost: PostMeta;
  allPosts: PostMeta[];
  maxPosts?: number;
}

export default function RelatedPosts({
  currentPost,
  allPosts,
  maxPosts = 3
}: RelatedPostsProps) {
  // AI-powered recommendation algorithm
  const getRelatedPosts = (): PostMeta[] => {
    // Calculate relevance score based on shared tags
    const postsWithScore = allPosts
      .filter(post => post.slug !== currentPost.slug)
      .map(post => {
        let score = 0;

        // Score based on shared tags (most important)
        const sharedTags = post.tags.filter(tag =>
          currentPost.tags.includes(tag)
        );
        score += sharedTags.length * 10;

        // Boost for exact tag matches
        if (sharedTags.length === currentPost.tags.length) {
          score += 5;
        }

        // Penalty for date distance (prefer recent posts)
        const daysDiff = Math.abs(
          new Date(post.date).getTime() - new Date(currentPost.date).getTime()
        ) / (1000 * 60 * 60 * 24);
        score -= daysDiff / 100;

        // Boost for similar title words
        const currentWords = currentPost.title.toLowerCase().split(/\s+/);
        const postWords = post.title.toLowerCase().split(/\s+/);
        const commonWords = currentWords.filter(word =>
          postWords.includes(word) && word.length > 3
        );
        score += commonWords.length * 2;

        return { post, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPosts)
      .map(({ post }) => post);

    // If no related posts found, return most recent posts
    if (postsWithScore.length === 0) {
      return allPosts
        .filter(post => post.slug !== currentPost.slug)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxPosts);
    }

    return postsWithScore;
  };

  const relatedPosts = getRelatedPosts();

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-primary-600" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Recommended for You
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedPosts.map(post => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 AI-Powered Recommendations:</strong> These posts are suggested based on shared topics, tags, and content similarity. Our algorithm considers multiple factors to find the most relevant content for you.
        </p>
      </div>
    </section>
  );
}
