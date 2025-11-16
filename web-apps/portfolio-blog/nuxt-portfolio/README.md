# Nuxt 3 作品集網站

使用 Nuxt 3、Vue 3 和 Tailwind CSS 打造的現代化個人作品集網站。

## 功能特色

- ⚡ **超快速度** - Nuxt 3 提供極致的效能與 SSR 支援
- 🎨 **精美設計** - Tailwind CSS 打造的響應式 UI
- 📱 **完全響應式** - 支援所有裝置尺寸
- 🔥 **Vue 3** - 使用最新的 Composition API
- 🎯 **TypeScript** - 完整的型別支援
- 🌙 **深色模式** - 支援淺色/深色主題
- 📦 **Auto Imports** - 自動匯入組件與 composables
- 🔍 **SEO 優化** - 完整的 meta 標籤與 SSR

## 頁面結構

- **首頁** (`/`) - 個人簡介與技能展示
- **作品集** (`/projects`) - 專案展示
- **部落格** (`/blog`) - 技術文章列表
- **關於我** (`/about`) - 個人背景與經歷
- **聯絡** (`/contact`) - 聯絡表單

## 技術棧

- **框架**: Nuxt 3
- **UI 框架**: Vue 3 (Composition API)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖示**: Nuxt Icon (Iconify)
- **工具**: VueUse
- **部署**: Vercel / Netlify

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
```

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
nuxt-portfolio/
├── assets/
│   └── css/
│       └── main.css          # 全局樣式
├── components/
│   ├── Header.vue            # 導航列
│   ├── Footer.vue            # 頁尾
│   ├── SkillCard.vue         # 技能卡片
│   └── ProjectCard.vue       # 專案卡片
├── layouts/
│   └── default.vue           # 預設佈局
├── pages/
│   ├── index.vue             # 首頁
│   ├── projects.vue          # 作品集頁面
│   ├── blog.vue              # 部落格頁面
│   ├── about.vue             # 關於頁面
│   └── contact.vue           # 聯絡頁面
├── app.vue                   # 根組件
├── nuxt.config.ts           # Nuxt 配置
└── tailwind.config.js       # Tailwind 配置
```

## Nuxt 3 特色功能

### 1. Auto Imports

Nuxt 3 自動匯入：

- Vue Composition API (`ref`, `computed`, `watch` 等)
- Nuxt composables (`useHead`, `useFetch`, `useRoute` 等)
- Components (無需手動 import)

```vue
<script setup>
// 無需 import，直接使用
const count = ref(0)
const route = useRoute()
</script>
```

### 2. File-based Routing

基於檔案系統的路由：

- `pages/index.vue` → `/`
- `pages/about.vue` → `/about`
- `pages/blog/[id].vue` → `/blog/:id`

### 3. SEO 優化

使用 `useHead` 設定 meta 標籤：

```typescript
useHead({
  title: '頁面標題',
  meta: [
    { name: 'description', content: '頁面描述' }
  ]
})
```

## 客製化指南

### 修改個人資訊

1. **首頁** - 編輯 `pages/index.vue`
2. **作品集** - 編輯 `pages/projects.vue` 中的 projects 陣列
3. **關於我** - 編輯 `pages/about.vue`
4. **部落格** - 編輯 `pages/blog.vue` 中的 posts 陣列

### 修改配色

編輯 `tailwind.config.js`：

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

### 新增頁面

在 `pages/` 目錄下建立新的 `.vue` 檔案即可自動生成路由。

## 部署

### Vercel

```bash
npm run build
```

推送到 GitHub 後，在 Vercel 中匯入專案即可自動部署。

### Netlify

```bash
npm run build
```

設定：
- Build command: `npm run build`
- Publish directory: `.output/public`

### 靜態生成

```bash
npm run generate
```

生成靜態網站到 `.output/public/` 目錄。

## 效能優化

- ✅ SSR (Server-Side Rendering)
- ✅ 程式碼分割
- ✅ 自動圖片優化
- ✅ CSS 最小化
- ✅ Tree-shaking
- ✅ Lazy loading

## 相關資源

- [Nuxt 3 文檔](https://nuxt.com/docs)
- [Vue 3 文檔](https://vuejs.org/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Nuxt Icon](https://nuxt.com/modules/icon)

## License

MIT License

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
