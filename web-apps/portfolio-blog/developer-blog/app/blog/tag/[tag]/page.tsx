import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag } from 'lucide-react';
import { getPostsByTag, getAllTags } from '@/lib/mdx';
import BlogCard from '@/components/blog/BlogCard';
import type { Metadata } from 'next';

interface TagPageProps {
  params: {
    tag: string;
  };
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({
    tag: tag.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  return {
    title: `Posts tagged with "${tag}"`,
    description: `Browse all posts tagged with ${tag}`,
  };
}

export default function TagPage({ params }: TagPageProps) {
  const tag = decodeURIComponent(params.tag);
  const posts = getPostsByTag(tag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <Tag className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
            {tag}
          </h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {posts.length} {posts.length === 1 ? 'post' : 'posts'} tagged with "{tag}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
