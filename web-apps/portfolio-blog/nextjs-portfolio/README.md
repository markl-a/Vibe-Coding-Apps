# Next.js 作品集網站

使用 Next.js 14、TypeScript 和 Tailwind CSS 打造的現代化個人作品集網站。

## 功能特色

- ✨ **現代化設計** - 使用 Tailwind CSS 打造精美 UI
- 🚀 **高效能** - Next.js 14 App Router 與 Server Components
- 📱 **響應式設計** - 完美支援各種螢幕尺寸
- 🎨 **深色模式** - 支援深色/淺色主題切換
- 📝 **作品集展示** - 展示專案作品與技術細節
- 📰 **部落格系統** - 分享技術文章與開發心得
- 📧 **聯絡表單** - 方便的聯絡方式
- 🎯 **SEO 優化** - 完整的 meta 標籤與 Open Graph 支援

## 頁面結構

- **首頁** (`/`) - 個人簡介與技能展示
- **作品集** (`/projects`) - 專案展示與詳細資訊
- **部落格** (`/blog`) - 技術文章列表
- **關於我** (`/about`) - 個人背景、經歷與技能
- **聯絡** (`/contact`) - 聯絡表單與社群連結

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖示**: React Icons
- **動畫**: Framer Motion
- **日期**: date-fns
- **部署**: Vercel (推薦)

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
nextjs-portfolio/
├── app/                    # App Router 頁面
│   ├── layout.tsx         # 根佈局
│   ├── page.tsx           # 首頁
│   ├── globals.css        # 全局樣式
│   ├── projects/          # 作品集頁面
│   ├── blog/              # 部落格頁面
│   ├── about/             # 關於我頁面
│   └── contact/           # 聯絡頁面
├── components/            # 共用組件
│   ├── Header.tsx        # 導航列
│   └── Footer.tsx        # 頁尾
├── public/               # 靜態資源
├── package.json          # 專案配置
├── next.config.js        # Next.js 配置
├── tsconfig.json         # TypeScript 配置
└── tailwind.config.ts    # Tailwind CSS 配置
```

## 客製化指南

### 修改個人資訊

1. **更新 Meta 資訊** - 編輯 `app/layout.tsx` 中的 metadata
2. **修改個人簡介** - 編輯 `app/about/page.tsx`
3. **更新作品集** - 編輯 `app/projects/page.tsx` 中的 projects 陣列
4. **新增部落格文章** - 編輯 `app/blog/page.tsx` 中的 blogPosts 陣列

### 修改配色

編輯 `tailwind.config.ts` 中的 primary 顏色配置：

```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    // ... 其他色階
  },
}
```

### 新增社群連結

編輯 `components/Footer.tsx` 和 `app/page.tsx` 中的社群媒體連結。

## 部署

### Vercel (推薦)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 自動部署完成

### Netlify

```bash
npm run build
netlify deploy --prod
```

## 優化建議

- 🖼️ 使用 Next.js Image 組件優化圖片
- 🎯 新增 Google Analytics 追蹤
- 📊 使用 Contentlayer 管理 MDX 內容
- 🔍 實作全文搜尋功能
- 🌙 新增深色模式切換
- 📱 新增 PWA 支援

## License

MIT License

## 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
