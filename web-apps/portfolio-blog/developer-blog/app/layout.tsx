import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import AIAssistant from '@/components/ai/AIAssistant';
import { getPostsMeta } from '@/lib/mdx';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Developer Blog - AI-Powered Development Insights',
    template: '%s | Developer Blog',
  },
  description: 'A modern AI-enhanced developer blog featuring tutorials, insights, and best practices in web development. Powered by artificial intelligence for enhanced learning.',
  keywords: ['blog', 'development', 'programming', 'web development', 'tutorials', 'AI', 'artificial intelligence', 'machine learning'],
  authors: [{ name: 'Developer Blog' }],
  creator: 'Developer Blog',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://developer-blog.example.com',
    title: 'Developer Blog - AI-Powered Development Insights',
    description: 'A modern AI-enhanced developer blog featuring tutorials and insights',
    siteName: 'Developer Blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Developer Blog',
    description: 'A modern AI-enhanced developer blog featuring tutorials and insights',
    creator: '@devblog',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const posts = getPostsMeta();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
          <AIAssistant posts={posts} />
        </div>
      </body>
    </html>
  );
}
