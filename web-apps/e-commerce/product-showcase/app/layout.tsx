import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import AIChatbot from '@/components/ai/AIChatbot';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Product Showcase - AI 智能電商 | 精選電子產品購物網',
  description: '探索最新最優質的電子產品，享受 AI 驅動的智能購物體驗。24/7 AI 客服、智能推薦、個性化服務',
  keywords: ['電子產品', '購物', '3C', '電商', 'AI購物', '智能推薦'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Header />
          <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            {children}
          </main>
          <Footer />
          {/* AI Chatbot - Available on all pages */}
          <AIChatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
