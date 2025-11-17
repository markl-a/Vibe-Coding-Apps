import Link from 'next/link';
import { ArrowRight, Code2, BookOpen, Zap } from 'lucide-react';
import { getPostsMeta } from '@/lib/mdx';
import BlogCard from '@/components/blog/BlogCard';

export default function Home() {
  const recentPosts = getPostsMeta().slice(0, 3);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <div className="inline-block mb-4 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
          Welcome to DevBlog
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Learn, Build, and Grow
          <br />
          <span className="text-primary-600 dark:text-primary-400">as a Developer</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Discover in-depth tutorials, practical tips, and insights about modern web
          development technologies and best practices.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Explore Blog
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            About Me
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
              <Code2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Code Examples
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Practical code snippets with syntax highlighting and detailed explanations
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              In-Depth Tutorials
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive guides covering various web development topics
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Best Practices
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Learn modern development patterns and industry best practices
            </p>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Recent Posts
          </h2>
          <Link
            href="/blog"
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            View all posts
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
