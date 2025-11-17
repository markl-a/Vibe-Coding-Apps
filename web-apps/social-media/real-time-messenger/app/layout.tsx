import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Real-Time Messenger',
  description: 'A modern real-time messaging application built with Next.js and Socket.io',
  keywords: ['chat', 'messenger', 'real-time', 'socket.io', 'next.js'],
  authors: [{ name: 'Real-Time Messenger Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
