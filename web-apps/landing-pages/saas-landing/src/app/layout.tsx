import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VibeCoding - AI 驅動的開發平台',
  description: '使用 AI 驅動的工具，讓你的想法在幾分鐘內變成現實。無需編程經驗，立即開始。',
  keywords: ['AI開發', 'SaaS', '快速開發', '低代碼平台'],
  openGraph: {
    type: 'website',
    title: 'VibeCoding - AI 驅動的開發平台',
    description: '使用 AI 驅動的工具，讓你的想法在幾分鐘內變成現實',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
