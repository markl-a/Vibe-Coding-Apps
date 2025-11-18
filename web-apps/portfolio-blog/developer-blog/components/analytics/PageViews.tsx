'use client';

import { useEffect, useState } from 'react';
import { Eye, TrendingUp } from 'lucide-react';

interface PageViewsProps {
  slug: string;
  title?: string;
}

export default function PageViews({ slug, title }: PageViewsProps) {
  const [views, setViews] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate page view tracking
    // In production: Call analytics API (Google Analytics, Vercel Analytics, etc.)
    const fetchViews = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulated view count (in production, fetch from analytics service)
        const simulatedViews = Math.floor(Math.random() * 1000) + 100;
        setViews(simulatedViews);

        // Track the current page view
        trackPageView(slug, title);
      } catch (error) {
        console.error('Error fetching page views:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViews();
  }, [slug, title]);

  const trackPageView = (pageSlug: string, pageTitle?: string) => {
    // In production: Send to analytics service
    if (typeof window !== 'undefined') {
      // Example: Google Analytics
      // window.gtag?.('event', 'page_view', {
      //   page_path: `/blog/${pageSlug}`,
      //   page_title: pageTitle,
      // });

      // Example: Vercel Analytics
      // window.va?.('pageview', { path: `/blog/${pageSlug}` });

      console.log('Page view tracked:', { slug: pageSlug, title: pageTitle });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Eye className="w-4 h-4" />
        <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
      </div>
    );
  }

  if (views === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Eye className="w-4 h-4" />
      <span>{views.toLocaleString()} views</span>
      {views > 500 && (
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="w-3 h-3" />
          Popular
        </span>
      )}
    </div>
  );
}

/**
 * Analytics Integration Guide
 *
 * To integrate real analytics, install and configure:
 *
 * 1. Google Analytics:
 * npm install @next/third-parties
 *
 * // app/layout.tsx
 * import { GoogleAnalytics } from '@next/third-parties/google'
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>{children}</body>
 *       <GoogleAnalytics gaId="G-XXXXXXXXXX" />
 *     </html>
 *   )
 * }
 *
 * 2. Vercel Analytics:
 * npm install @vercel/analytics
 *
 * // app/layout.tsx
 * import { Analytics } from '@vercel/analytics/react'
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Analytics />
 *       </body>
 *     </html>
 *   )
 * }
 *
 * 3. Plausible Analytics:
 * npm install next-plausible
 *
 * // app/layout.tsx
 * import PlausibleProvider from 'next-plausible'
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <PlausibleProvider domain="yourdomain.com" />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   )
 * }
 */
