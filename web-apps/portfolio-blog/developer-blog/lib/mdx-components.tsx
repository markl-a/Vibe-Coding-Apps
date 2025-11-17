import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </p>
    ),
    a: ({ href, children }) => (
      <Link
        href={href as string}
        className="text-primary-600 dark:text-primary-400 hover:underline"
      >
        {children}
      </Link>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="ml-4">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary-500 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
        {children}
      </pre>
    ),
    img: (props) => (
      <Image
        {...(props as any)}
        className="rounded-lg my-6"
        width={800}
        height={400}
        alt={props.alt || ''}
      />
    ),
    hr: () => <hr className="my-8 border-gray-300 dark:border-gray-700" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
        {children}
      </td>
    ),
    ...components,
  };
}
