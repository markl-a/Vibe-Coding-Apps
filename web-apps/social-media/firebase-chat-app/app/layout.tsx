import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Firebase Chat - 即時聊天應用",
  description: "使用 Firebase 打造的即時聊天應用，支援一對一聊天、群組聊天、檔案分享等功能",
  keywords: ["chat", "firebase", "real-time", "messaging"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
