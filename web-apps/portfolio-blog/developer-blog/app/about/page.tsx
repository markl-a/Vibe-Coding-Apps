import { Mail, Github, Twitter, Linkedin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about Developer Blog and its author',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          About Me
        </h1>

        <div className="prose prose-lg dark:prose-dark max-w-none">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Hi there! Welcome to my developer blog where I share my journey,
            insights, and learnings in web development.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              What I Do
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              I'm a passionate web developer with expertise in modern JavaScript
              frameworks and technologies. I love building performant, accessible,
              and user-friendly web applications.
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              Through this blog, I aim to share practical tutorials, best practices,
              and insights that I've gathered throughout my development journey.
              Whether you're a beginner or an experienced developer, I hope you'll
              find something valuable here.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                'JavaScript',
                'TypeScript',
                'React',
                'Next.js',
                'Node.js',
                'Tailwind CSS',
                'Git',
                'PostgreSQL',
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              This Blog
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This blog is built with cutting-edge web technologies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Next.js 14 with App Router for optimal performance</li>
              <li>TypeScript for type safety</li>
              <li>Tailwind CSS for styling</li>
              <li>MDX for rich content creation</li>
              <li>Prism.js for beautiful code highlighting</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Get in Touch
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              I'd love to hear from you! Feel free to reach out through any of
              these channels:
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:hello@example.com"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email Me
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
