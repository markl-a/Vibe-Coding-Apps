'use client';

import { useState } from 'react';
import { Code2, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { explainCode, calculateReadabilityScore } from '@/lib/ai-utils';

const LANGUAGE_OPTIONS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C++',
  'PHP',
  'Ruby',
  'Swift'
];

export default function AICodeExplainer() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [explanation, setExplanation] = useState('');
  const [analysis, setAnalysis] = useState<{
    complexity: string;
    suggestions: string[];
    bestPractices: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) return;

    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate explanation
    const codeExplanation = explainCode(code, language);
    setExplanation(codeExplanation);

    // Analyze code
    const lines = code.split('\n').length;
    const hasComments = code.includes('//') || code.includes('/*');
    const hasErrorHandling = code.includes('try') || code.includes('catch') || code.includes('throw');

    const complexity = lines < 10 ? 'Simple' : lines < 30 ? 'Moderate' : 'Complex';
    const suggestions: string[] = [];
    const bestPractices: string[] = [];

    if (!hasComments) {
      suggestions.push('Add comments to explain complex logic');
    }

    if (!hasErrorHandling && lines > 20) {
      suggestions.push('Consider adding error handling');
    }

    if (language === 'JavaScript' || language === 'TypeScript') {
      bestPractices.push('Use const/let instead of var');
      bestPractices.push('Consider using async/await for asynchronous operations');
      bestPractices.push('Add type annotations (TypeScript)');
    }

    bestPractices.push('Follow consistent naming conventions');
    bestPractices.push('Keep functions small and focused');
    bestPractices.push('Write unit tests for critical logic');

    setAnalysis({ complexity, suggestions, bestPractices });
    setIsAnalyzing(false);
  };

  const codeExamples = {
    JavaScript: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,
    TypeScript: `interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}`,
    Python: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
  };

  const loadExample = () => {
    const example = codeExamples[language as keyof typeof codeExamples] || codeExamples.JavaScript;
    setCode(example);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              AI Code Explainer
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Paste your code to get AI-powered explanations, complexity analysis, and improvement suggestions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Programming Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={loadExample}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  Load Example
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={16}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!code.trim() || isAnalyzing}
              className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5" />
                  Analyze Code
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {explanation ? (
              <>
                {/* Explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Explanation
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">{explanation}</p>
                </div>

                {/* Analysis */}
                {analysis && (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Complexity: {analysis.complexity}
                      </h3>
                      <div className="text-sm text-green-800 dark:text-green-300">
                        <p className="mb-2">
                          <strong>Lines of code:</strong> {code.split('\n').length}
                        </p>
                        <p>
                          <strong>Estimated complexity:</strong> {analysis.complexity} - The code structure is {analysis.complexity.toLowerCase()} to understand and maintain.
                        </p>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {analysis.suggestions.length > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Improvement Suggestions
                        </h3>
                        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                          {analysis.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-500">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Best Practices */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Best Practices for {language}
                      </h3>
                      <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                        {analysis.bestPractices.map((practice, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-purple-500">✓</span>
                            {practice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                <div className="text-center">
                  <Code2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Paste your code and click "Analyze Code" to get AI-powered insights</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4 border border-primary-100 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>💡 Production Integration:</strong> This code explainer uses simulated AI analysis.
              For production, integrate with OpenAI Codex, GitHub Copilot API, or similar code intelligence platforms
              to provide real-time, context-aware code explanations and refactoring suggestions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
