# Astro 部落格系統

使用 Astro、React 和 Tailwind CSS 打造的現代化技術部落格。

## 功能特色

- ⚡ **極速載入** - Astro 的 Island Architecture 提供極致效能
- 📝 **Markdown/MDX 支援** - 使用 Markdown 撰寫文章
- 🎨 **精美設計** - Tailwind CSS 打造的響應式 UI
- 🏷️ **標籤系統** - 文章分類與標籤
- 📱 **完全響應式** - 支援所有裝置
- 🔍 **SEO 優化** - 完整的 meta 標籤與 sitemap
- 🌙 **深色模式** - 支援淺色/深色主題
- ⚛️ **React 整合** - 需要互動時使用 React 組件

## 技術棧

- **框架**: Astro 4+
- **UI 組件**: React 18
- **樣式**: Tailwind CSS
- **內容**: Content Collections (Markdown/MDX)
- **部署**: Netlify / Vercel

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

訪問 [http://localhost:4321](http://localhost:4321)

### 建置

```bash
npm run build
```

### 預覽

```bash
npm run preview
```

## 專案結構

```
astro-blog/
├── src/
│   ├── content/
│   │   ├── config.ts        # Content Collections 配置
│   │   └── blog/            # 部落格文章 (.md)
│   │       ├── post-1.md
│   │       └── post-2.md
│   ├── layouts/
│   │   └── Layout.astro     # 主佈局
│   ├── pages/
│   │   ├── index.astro      # 首頁
│   │   ├── about.astro      # 關於頁面
│   │   └── blog/
│   │       ├── index.astro  # 部落格列表
│   │       └── [slug].astro # 文章詳情頁
│   └── styles/
│       └── global.css       # 全局樣式
├── public/                  # 靜態資源
├── astro.config.mjs        # Astro 配置
├── tailwind.config.mjs     # Tailwind 配置
└── package.json
```

## 撰寫文章

### 1. 建立新文章

在 `src/content/blog/` 目錄下建立新的 `.md` 檔案：

```markdown
---
title: '文章標題'
description: '文章摘要'
pubDate: 2025-11-16
author: '作者名稱'
tags: ['tag1', 'tag2']
---

## 標題

文章內容...
```

### 2. Frontmatter 欄位

- `title` (必填) - 文章標題
- `description` (必填) - 文章摘要
- `pubDate` (必填) - 發布日期
- `author` (選填) - 作者，預設為「作者」
- `tags` (必填) - 標籤陣列
- `updatedDate` (選填) - 更新日期
- `coverImage` (選填) - 封面圖片 URL

### 3. Markdown 語法

支援標準 Markdown 語法與程式碼區塊：

````markdown
## 標題

段落文字

- 列表項目 1
- 列表項目 2

```javascript
const hello = 'world';
```
````

## 客製化

### 修改配色

編輯 `tailwind.config.mjs`：

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // 自訂顏色
      },
    },
  },
},
```

### 修改佈局

編輯 `src/layouts/Layout.astro` 自訂導航列、頁尾等。

### 新增頁面

在 `src/pages/` 目錄下建立新的 `.astro` 檔案。

## Content Collections

Astro 的 Content Collections 提供型別安全的內容管理：

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog };
```

## 部署

### Netlify

```bash
# 建置指令
npm run build

# 發布目錄
dist
```

### Vercel

```bash
npm run build
```

Vercel 會自動偵測 Astro 專案並配置。

### GitHub Pages

需要額外配置 `astro.config.mjs`：

```javascript
export default defineConfig({
  site: 'https://username.github.io',
  base: '/repo-name',
});
```

## 效能優化

- ✅ 預設零 JavaScript（除非需要互動）
- ✅ 自動圖片優化
- ✅ CSS 最小化
- ✅ 程式碼分割
- ✅ 自動生成 Sitemap

## 相關資源

- [Astro 官方文檔](https://docs.astro.build)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Content Collections 指南](https://docs.astro.build/en/guides/content-collections/)

## License

MIT License

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
