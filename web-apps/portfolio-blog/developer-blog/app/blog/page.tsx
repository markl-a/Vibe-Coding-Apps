import BlogCard from '@/components/blog/BlogCard';
import { getPostsMeta } from '@/lib/mdx';

export const metadata = {
  title: 'Blog',
  description: 'Explore articles about web development, programming, and technology.',
};

export default function BlogPage() {
  const posts = getPostsMeta();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Explore articles about web development, programming, and technology.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No posts available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
