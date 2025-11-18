import { Sparkles, Code2, Wand2, MessageCircle } from 'lucide-react';
import AIContentGenerator from '@/components/ai/AIContentGenerator';
import AICodeExplainer from '@/components/ai/AICodeExplainer';
import Link from 'next/link';

export const metadata = {
  title: 'AI Tools - Developer Blog',
  description: 'Explore AI-powered tools for content generation, code explanation, and more',
};

export default function AIToolsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4 inline mr-2" />
          AI-Powered Tools
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Developer Tools Enhanced by AI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          Leverage artificial intelligence to accelerate your development workflow,
          generate content, explain code, and enhance productivity.
        </p>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center mb-4">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Content Generator
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate blog posts, outlines, and SEO metadata with AI assistance
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Code Explainer
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get AI-powered code analysis, complexity metrics, and improvement tips
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <div className="w-12 h-12 bg-green-600 text-white rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              AI Assistant
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chat with AI to find articles, get recommendations, and learn
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Smart Search
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enhanced search with AI-powered suggestions and semantic understanding
            </p>
          </div>
        </div>
      </section>

      {/* Content Generator Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            AI Content Generator
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generate high-quality blog content, structured outlines, and SEO-optimized metadata
          </p>
        </div>
        <AIContentGenerator />
      </section>

      {/* Code Explainer Section */}
      <section className="mb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            AI Code Explainer
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Understand code complexity, get explanations, and receive improvement suggestions
          </p>
        </div>
        <AICodeExplainer />
      </section>

      {/* Integration Notice */}
      <section className="bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-lg p-8 border border-primary-200 dark:border-gray-700">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🚀 Production-Ready AI Integration
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-semibold mb-2">Recommended AI Providers:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <div>
                  <strong>OpenAI GPT-4:</strong> Best for content generation and chat
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <div>
                  <strong>Anthropic Claude:</strong> Excellent for code analysis and explanations
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">•</span>
                <div>
                  <strong>GitHub Copilot:</strong> Code completion and suggestions
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Implementation Steps:</h4>
            <ol className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary-600">1.</span>
                <div>Set up API keys in environment variables</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">2.</span>
                <div>Create API routes in <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">app/api/</code></div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">3.</span>
                <div>Implement rate limiting and caching</div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-600">4.</span>
                <div>Add error handling and fallbacks</div>
              </li>
            </ol>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-primary-200 dark:border-gray-700">
          <p className="text-sm">
            <strong>Note:</strong> The AI tools on this page use simulated responses for demonstration.
            In a production environment, connect to real AI APIs for full functionality.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center mt-16">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Ready to explore more?
        </h3>
        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Read Blog Posts
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            About This Project
          </Link>
        </div>
      </section>
    </div>
  );
}
