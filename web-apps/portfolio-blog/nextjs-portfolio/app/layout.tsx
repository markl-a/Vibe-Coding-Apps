import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '個人作品集 | Portfolio',
  description: '展示我的專案作品、技術文章與開發經歷',
  keywords: ['作品集', 'portfolio', 'web developer', '前端開發'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: '個人作品集 | Portfolio',
    description: '展示我的專案作品、技術文章與開發經歷',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
