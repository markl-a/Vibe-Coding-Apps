---
title: 'Tailwind CSS 最佳實踐：打造高效能的樣式系統'
description: '分享使用 Tailwind CSS 的最佳實踐，包括如何組織樣式、客製化設計系統與效能優化技巧。'
pubDate: 2025-11-10
author: '技術部落格'
tags: ['Tailwind CSS', 'CSS', 'Best Practices']
---

## 為什麼選擇 Tailwind CSS？

Tailwind CSS 是一個 utility-first 的 CSS 框架，它提供了大量的預設類別，讓你可以快速建立客製化的設計。

### 主要優勢

1. **開發速度快** - 不需要在 HTML 和 CSS 檔案之間切換
2. **設計一致性** - 使用預設的設計系統（spacing、colors 等）
3. **檔案大小小** - 透過 PurgeCSS 移除未使用的樣式
4. **易於維護** - 所有樣式都在組件中，清楚明瞭

## 最佳實踐

### 1. 使用 @apply 提取重複樣式

當相同的 utility 類別組合重複出現時，使用 `@apply` 提取成自訂類別：

```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
  }
}
```

### 2. 客製化設計系統

在 `tailwind.config.js` 中擴展預設主題：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... 其他色階
          900: '#0c4a6e',
        },
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
}
```

### 3. 使用響應式設計斷點

Tailwind 的響應式設計非常直觀：

```html
<div class="w-full md:w-1/2 lg:w-1/3">
  <!-- 手機全寬，平板半寬，桌面三分之一寬 -->
</div>
```

### 4. 深色模式支援

啟用深色模式並使用 `dark:` 前綴：

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  內容
</div>
```

### 5. 使用插件擴展功能

安裝有用的官方插件：

```bash
npm install -D @tailwindcss/typography @tailwindcss/forms
```

```javascript
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
```

## 效能優化

### 1. 配置 PurgeCSS

確保生產環境移除未使用的樣式：

```javascript
module.exports = {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}',
  ],
}
```

### 2. 避免過度使用 @apply

`@apply` 方便但可能增加 CSS 檔案大小。只在確實有重複使用的情況下使用。

### 3. 使用 JIT 模式

Tailwind 3.0+ 預設啟用 JIT（Just-In-Time）模式，提供：

- 更快的建置時間
- 更小的開發環境 CSS 檔案
- 支援任意值：`w-[137px]`

## 組織技巧

### 1. 按功能分組類別

```html
<!-- 佈局 + 間距 + 文字 + 背景 + 邊框 + 互動 -->
<button class="
  flex items-center gap-2
  px-4 py-2
  text-white font-semibold
  bg-blue-600
  rounded-lg
  hover:bg-blue-700 transition-colors
">
  按鈕
</button>
```

### 2. 使用編輯器插件

安裝 Tailwind CSS IntelliSense 插件獲得：

- 自動完成
- 語法高亮
- Linting

## 常見陷阱

### ❌ 不要做

```html
<!-- 過度具體化 -->
<div class="mt-4 mb-4 ml-4 mr-4"></div>

<!-- 混合 inline styles -->
<div class="p-4" style="padding: 20px;"></div>
```

### ✅ 應該做

```html
<!-- 使用簡寫 -->
<div class="m-4"></div>

<!-- 堅持使用 Tailwind -->
<div class="p-5"></div>
```

## 總結

Tailwind CSS 是一個強大的工具，但需要遵循最佳實踐才能發揮最大效益：

- 適當使用 `@apply` 提取重複樣式
- 客製化設計系統以符合需求
- 善用響應式與深色模式功能
- 注意效能優化
- 保持程式碼整潔有序

掌握這些技巧後，你就能建立既美觀又高效的網站了！
