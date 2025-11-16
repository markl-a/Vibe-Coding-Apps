# 🎨 個人作品集與部落格網站
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的個人品牌網站、作品集展示與部落格系統。

## 📦 可用子專案

本目錄包含三個**完整可運行**的作品集/部落格專案範本，使用不同的現代化技術棧：

### 1. [nextjs-portfolio](./nextjs-portfolio/) - Next.js 14 作品集
- ⚛️ **技術**: Next.js 14 + React 18 + TypeScript
- 🎨 **樣式**: Tailwind CSS
- 📱 **特色**: App Router、Server Components、響應式設計
- 🚀 **適合**: 需要 SSR、SEO 優化的專業作品集網站
- 📖 [查看文檔](./nextjs-portfolio/README.md)

```bash
cd nextjs-portfolio
npm install
npm run dev
```

### 2. [astro-blog](./astro-blog/) - Astro 部落格系統
- ⚡ **技術**: Astro 4 + React + TypeScript
- 🎨 **樣式**: Tailwind CSS
- 📝 **內容**: Content Collections (Markdown/MDX)
- 🚀 **適合**: 內容為主的技術部落格、極致效能要求
- 📖 [查看文檔](./astro-blog/README.md)

```bash
cd astro-blog
npm install
npm run dev
```

### 3. [nuxt-portfolio](./nuxt-portfolio/) - Nuxt 3 作品集
- 💚 **技術**: Nuxt 3 + Vue 3 + TypeScript
- 🎨 **樣式**: Tailwind CSS
- 🔥 **特色**: Auto Imports、File-based Routing、SSR
- 🚀 **適合**: Vue 生態系開發者、企業級應用
- 📖 [查看文檔](./nuxt-portfolio/README.md)

```bash
cd nuxt-portfolio
npm install
npm run dev
```

## 🎯 如何選擇？

| 專案 | 最適合 | 學習曲線 | 效能 | 生態系 |
|------|--------|---------|------|--------|
| **Next.js** | React 開發者、需要 SSR | 中等 | 優秀 | 最豐富 |
| **Astro** | 內容網站、追求極致效能 | 簡單 | 極佳 | 成長中 |
| **Nuxt** | Vue 開發者、全端應用 | 中等 | 優秀 | 豐富 |

## 📋 專案目標

建立專業的個人品牌網站，展示作品集、分享技術文章與個人經歷，並透過 AI 工具加速開發與內容創作。

## 🎯 核心功能（規劃中）

### 1. 作品集展示
- 專案作品網格展示
- 專案詳情頁面（含圖片、影片、程式碼連結）
- 分類與標籤系統
- 搜尋與篩選功能
- 響應式圖片畫廊

### 2. 部落格系統
- Markdown 文章編寫支援
- 程式碼語法高亮
- 文章分類與標籤
- 全文搜尋
- RSS 訂閱
- 評論系統（可選）

### 3. 關於我頁面
- 個人簡介
- 技能展示
- 工作經歷時間軸
- 教育背景
- 證書與成就

### 4. 聯絡功能
- 聯絡表單
- 社交媒體連結
- Email 整合
- 下載履歷功能

### 5. SEO 優化
- Meta 標籤優化
- Open Graph 支援
- Sitemap 生成
- 結構化資料 (JSON-LD)
- 語意化 HTML

## 🛠️ 技術棧選項

### Option 1: Next.js + TypeScript (推薦)
```
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Content: MDX / Contentlayer
- Deployment: Vercel
- CMS: Notion API / Contentful (可選)
```

### Option 2: Astro + React
```
- Framework: Astro 4+
- UI: React / Preact
- Styling: Tailwind CSS
- Content: Markdown + Frontmatter
- Deployment: Netlify / Vercel
- Performance: 極佳的靜態生成
```

### Option 3: Vue + Nuxt
```
- Framework: Nuxt 3
- Language: TypeScript
- Styling: Tailwind CSS / UnoCSS
- Content: Nuxt Content
- Deployment: Vercel / Netlify
```

### Option 4: Gatsby + React
```
- Framework: Gatsby 5+
- UI: React
- Styling: Styled Components / Emotion
- Content: GraphQL + Markdown
- Deployment: Netlify
- Plugins: 豐富的插件生態系統
```

## 🚀 快速開始

### Option 1: Next.js 專案

```bash
# 使用 create-next-app
npx create-next-app@latest my-portfolio --typescript --tailwind --app

cd my-portfolio

# 安裝額外依賴
npm install contentlayer next-contentlayer date-fns
npm install -D @tailwindcss/typography

# 啟動開發伺服器
npm run dev
```

### Option 2: Astro 專案

```bash
# 建立 Astro 專案
npm create astro@latest my-portfolio

cd my-portfolio

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

## 📁 專案結構（Next.js 範例）

```
portfolio-blog/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── contentlayer.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 首頁
│   ├── about/
│   │   └── page.tsx          # 關於我
│   ├── projects/
│   │   ├── page.tsx          # 作品集列表
│   │   └── [slug]/
│   │       └── page.tsx      # 專案詳情
│   ├── blog/
│   │   ├── page.tsx          # 部落格列表
│   │   └── [slug]/
│   │       └── page.tsx      # 文章內容
│   └── contact/
│       └── page.tsx          # 聯絡頁面
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProjectCard.tsx
│   ├── BlogCard.tsx
│   ├── SEO.tsx
│   └── ContactForm.tsx
├── content/
│   ├── projects/             # 作品集 MDX 檔案
│   │   ├── project-1.mdx
│   │   └── project-2.mdx
│   └── blog/                 # 部落格 MDX 檔案
│       ├── post-1.mdx
│       └── post-2.mdx
├── lib/
│   ├── utils.ts
│   └── content.ts
├── public/
│   ├── images/
│   ├── projects/
│   └── resume.pdf
└── styles/
    └── globals.css
```

## 🤖 AI 輔助開發建議

### 使用 AI 快速建立專案

1. **專案架構設計**
```
提示詞範例：
"請幫我設計一個 Next.js 14 的個人作品集網站架構，包含首頁、作品集、部落格、關於我和聯絡頁面。使用 App Router、TypeScript 和 Tailwind CSS。"
```

2. **組件生成**
```
提示詞範例：
"請建立一個 React 作品集卡片組件，包含：
- 專案縮圖
- 專案標題
- 簡短描述
- 技術標籤
- Hover 效果
使用 TypeScript 和 Tailwind CSS。"
```

3. **內容結構**
```
提示詞範例：
"請幫我設計一個 MDX frontmatter 結構，用於部落格文章，包含：
- 標題、日期、作者
- 描述、標籤
- 封面圖片
- 閱讀時間估計"
```

4. **SEO 優化**
```
提示詞範例：
"請建立一個 Next.js SEO 組件，支援：
- 動態 meta 標籤
- Open Graph
- Twitter Card
- JSON-LD 結構化資料"
```

### AI 工具推薦使用場景

- **GitHub Copilot**: 組件程式碼生成、樣式撰寫
- **ChatGPT/Claude**: 架構設計、問題解決、內容創作
- **Cursor**: 整體專案開發、重構優化
- **v0.dev**: UI 組件快速原型設計

## 🎨 設計資源

### 配色方案建議
- **專業商務**: 深藍 + 灰白
- **創意設計**: 紫色 + 橙色漸層
- **技術開發**: 深色主題 + 青綠色強調
- **極簡風格**: 黑白灰 + 單一強調色

### UI 組件庫選擇
- **shadcn/ui** - 現代化、可客製化
- **Headless UI** - 無樣式、完全控制
- **Radix UI** - 可訪問性優先
- **DaisyUI** - Tailwind 預設主題

### 動畫庫
- **Framer Motion** - React 動畫首選
- **GSAP** - 強大的動畫引擎
- **React Spring** - 物理動畫

## 📊 開發路線圖

### Phase 1: 基礎框架 ✅
- [x] 選擇技術棧
- [x] 專案架構設計
- [ ] 建立專案骨架
- [ ] 設置 Tailwind CSS
- [ ] 基本頁面路由

### Phase 2: 核心功能
- [ ] 首頁設計與實作
- [ ] 作品集展示系統
- [ ] 部落格系統（Markdown 支援）
- [ ] 關於我頁面
- [ ] 聯絡表單

### Phase 3: 內容與樣式
- [ ] 響應式設計完善
- [ ] 深色模式支援
- [ ] 動畫與互動效果
- [ ] 圖片優化
- [ ] 字體優化

### Phase 4: 優化與部署
- [ ] SEO 優化
- [ ] 效能優化（Lighthouse 95+）
- [ ] 可訪問性檢查
- [ ] 部署到 Vercel/Netlify
- [ ] GA / 分析工具整合

## 🔥 特色功能建議

### 1. 互動式技能展示
```typescript
// 使用圓形進度條展示技能熟練度
const SkillCircle = ({ skill, percentage }) => {
  // AI 可協助生成 SVG 動畫程式碼
}
```

### 2. 專案時間軸
```typescript
// 使用時間軸展示專案歷程
const ProjectTimeline = ({ projects }) => {
  // 垂直時間軸，含動畫效果
}
```

### 3. 即時閱讀時間
```typescript
// 自動計算文章閱讀時間
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
```

### 4. 文章搜尋與篩選
```typescript
// 使用 Fuse.js 實作模糊搜尋
import Fuse from 'fuse.js'

const searchPosts = (posts, query) => {
  const fuse = new Fuse(posts, {
    keys: ['title', 'description', 'tags']
  })
  return fuse.search(query)
}
```

## 📱 響應式設計要點

```css
/* Tailwind 響應式斷點 */
sm: 640px   /* 手機橫屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 小筆電 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

## 🔍 SEO 檢查清單

- [ ] 每頁都有唯一的 title 和 description
- [ ] 使用語意化 HTML (header, main, article, etc.)
- [ ] 圖片都有 alt 屬性
- [ ] 結構化資料（JSON-LD）
- [ ] Sitemap.xml 生成
- [ ] Robots.txt 配置
- [ ] 開放圖譜標籤 (Open Graph)
- [ ] Twitter Card 支援
- [ ] 正確的 heading 層級 (h1-h6)
- [ ] 內部連結優化

## 🚀 部署選項

### Vercel (推薦用於 Next.js)
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify
```bash
# 安裝 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### GitHub Pages (靜態網站)
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

## 📝 內容創作建議

### 使用 AI 協助撰寫文章

```
提示詞範例：
"請幫我寫一篇關於『使用 AI 工具提升開發效率』的技術文章大綱，包含：
1. 引言
2. 主要 AI 工具介紹
3. 實際應用案例
4. 最佳實踐
5. 總結"
```

### 部落格文章模板

```markdown
---
title: "文章標題"
date: "2025-11-16"
description: "文章摘要"
tags: ["React", "TypeScript", "AI"]
coverImage: "/images/cover.jpg"
---

## 引言

內容...

## 主要內容

### 小節 1

### 小節 2

## 總結
```

## 🤝 貢獻與改進

歡迎提出改進建議！可以協助的方向：

- 🎨 設計優化建議
- 💡 新功能提案
- 🐛 Bug 回報
- 📝 文檔改進
- ♿ 可訪問性改善

## 📄 授權

MIT License

## 🔗 相關資源

### 學習資源
- [Next.js 官方文檔](https://nextjs.org/docs)
- [Tailwind CSS 官方文檔](https://tailwindcss.com/docs)
- [MDX 官方網站](https://mdxjs.com/)

### 靈感參考
- [Lee Robinson's Portfolio](https://leerob.io/)
- [Brittany Chiang](https://brittanychiang.com/)
- [Josh Comeau](https://www.joshwcomeau.com/)

---

**最後更新**: 2025-11-16
**狀態**: ✅ 已完成（包含 3 個可用子專案）
