'use client';

import { useState } from 'react';
import { Wand2, Copy, Download, RefreshCw } from 'lucide-react';
import { generateBlogPost, generateOutline, generateMetaDescription } from '@/lib/ai-utils';

export default function AIContentGenerator() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'post' | 'outline' | 'meta'>('post');

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing

    const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);

    let content = '';
    switch (activeTab) {
      case 'post':
        content = await generateBlogPost(topic, keywordArray.length > 0 ? keywordArray : ['Concept', 'Implementation', 'Examples']);
        break;
      case 'outline':
        const outline = generateOutline(topic);
        content = `# ${outline.title}\n\n` +
          outline.sections.map(section =>
            `## ${section.heading}\n\n${section.points.map(point => `- ${point}`).join('\n')}`
          ).join('\n\n');
        break;
      case 'meta':
        const sampleContent = `Learn about ${topic}. This comprehensive guide covers ${keywordArray.join(', ')} and more.`;
        const metaDesc = generateMetaDescription(topic, sampleContent);
        content = `**Meta Title:**\n${topic} - Complete Guide\n\n**Meta Description:**\n${metaDesc}\n\n**Keywords:**\n${keywordArray.join(', ')}\n\n**Open Graph Tags:**\n- og:title: ${topic}\n- og:description: ${metaDesc}\n- og:type: article`;
        break;
    }

    setGeneratedContent(content);
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedContent);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Wand2 className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              AI Content Generator
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Generate blog posts, outlines, and SEO metadata using AI assistance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('post')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'post'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Blog Post
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'outline'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Outline
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'meta'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            SEO Meta
          </button>
        </div>

        {/* Input Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Topic / Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Modern Web Development with React and TypeScript"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., React, TypeScript, Hooks, State Management"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Content
              </>
            )}
          </button>
        </div>

        {/* Generated Content */}
        {generatedContent && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Generated Content
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    onClick={downloadMarkdown}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {generatedContent}
                </pre>
              </div>
            </div>

            {/* Tips */}
            <div className="px-6 pb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Pro Tip:</strong> This is a simulated AI content generator. In production, integrate with OpenAI GPT-4, Claude, or similar APIs for real AI-powered content generation. Always review and edit generated content before publishing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Examples Section */}
      <div className="mt-8 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-6 border border-primary-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          How to Use AI Content Generation
        </h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <p>Enter your topic or title in the first field</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <p>Add relevant keywords to guide the content generation</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <p>Choose between Blog Post, Outline, or SEO Meta generation</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <p>Click Generate and copy or download the result</p>
          </div>
        </div>
      </div>
    </div>
  );
}
