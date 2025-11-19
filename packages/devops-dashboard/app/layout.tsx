export const metadata = {
  title: 'Vibe DevOps Dashboard',
  description: 'Centralized DevOps monitoring for Vibe-Coding-Apps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
