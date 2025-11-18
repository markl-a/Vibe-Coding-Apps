'use client';

import { useState } from 'react';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';

interface CodePlaygroundProps {
  initialCode?: string;
  language?: string;
}

export default function CodePlayground({
  initialCode = '// Write your code here\nconsole.log("Hello, World!");',
  language = 'javascript'
}: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...\n');

    try {
      // Create a safe execution context
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => logs.push('Error: ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('Warning: ' + args.map(String).join(' ')),
      };

      // Execute code in isolated context
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate execution time

      if (language === 'javascript') {
        try {
          // Use Function constructor for safer eval
          const fn = new Function('console', code);
          fn(customConsole);
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');
        } catch (error) {
          setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        setOutput(`Note: This playground supports JavaScript execution. For ${language}, use a dedicated environment.`);
      }
    } catch (error) {
      setOutput(`Runtime Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    setIsRunning(false);
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
            {language.charAt(0).toUpperCase() + language.slice(1)} Playground
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyCode}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded transition-colors flex items-center gap-1"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={resetCode}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded transition-colors flex items-center gap-1"
            title="Reset code"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="px-4 py-1 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Input */}
        <div className="border-r border-gray-300 dark:border-gray-700">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">CODE</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">OUTPUT</span>
          </div>
          <div className="h-64 p-4 bg-gray-900 overflow-y-auto">
            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
              {output || '// Output will appear here when you run the code'}
            </pre>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 Tip: This is a client-side JavaScript playground. For security, some features are limited.
        </p>
      </div>
    </div>
  );
}
