import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
