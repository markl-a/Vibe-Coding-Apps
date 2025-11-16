# React Marketplace - React + Vite 線上市集

使用 React 18、Vite、TypeScript、Tailwind CSS 和 Zustand 打造的現代化線上市集平台。

## 功能特色

- 🛍️ **商品展示** - 精美的商品列表與分類篩選
- 🛒 **購物車系統** - 完整的購物車功能與 Zustand 狀態管理
- 💳 **結帳流程** - 直觀的結帳頁面與表單驗證
- 📱 **響應式設計** - 完美支援各種螢幕尺寸
- ⚡ **極速開發** - Vite 超快速熱模組替換 (HMR)
- 🎨 **精美 UI** - 使用 Tailwind CSS 打造現代化介面
- 🔄 **狀態管理** - 使用 Zustand 輕量級狀態管理
- 💾 **本地儲存** - 購物車資料自動持久化
- 🎬 **流暢動畫** - Framer Motion 打造絲滑體驗

## 頁面結構

- **首頁** (`/`) - 品牌介紹、功能特色與分類導覽
- **商品列表** (`/products`) - 商品展示與分類篩選
- **購物車** (`/cart`) - 購物車管理與訂單摘要
- **結帳** (`/checkout`) - 訂單結帳與配送資訊填寫

## 技術棧

- **框架**: React 18
- **建置工具**: Vite 5
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **路由**: React Router v6
- **圖示**: React Icons
- **動畫**: Framer Motion
- **部署**: Vercel / Netlify (推薦)

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:5173](http://localhost:5173)

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
react-marketplace/
├── index.html             # HTML 進入點
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
├── tailwind.config.js     # Tailwind CSS 配置
├── postcss.config.js      # PostCSS 配置
├── src/
│   ├── main.tsx          # 應用進入點
│   ├── App.tsx           # 根組件與路由設定
│   ├── pages/            # 頁面組件
│   │   ├── HomePage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── CartPage.tsx
│   │   └── CheckoutPage.tsx
│   ├── components/       # 共用組件
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── store/            # Zustand Store
│   │   └── cartStore.ts
│   └── styles/           # 樣式檔案
│       └── index.css
└── public/               # 靜態資源
```

## 核心功能說明

### 購物車系統

使用 Zustand 實作購物車狀態管理，支援：
- 新增商品到購物車
- 調整商品數量
- 移除商品
- 計算總價與總件數
- 自動持久化到 localStorage

### 商品管理

- 商品列表展示
- 分類篩選功能
- 商品詳細資訊
- 響應式圖片載入

### 結帳流程

- 配送資訊表單
- 付款方式選擇
- 訂單摘要確認
- 完整表單驗證

## 客製化指南

### 新增商品

編輯 `src/pages/ProductsPage.tsx` 中的 `products` 陣列：

```typescript
const products = [
  {
    id: 1,
    name: '商品名稱',
    price: 1000,
    image: '圖片網址',
    category: '類別',
    description: '商品描述',
  },
  // 新增更多商品...
]
```

### 修改配色

編輯 `tailwind.config.js` 中的 primary 顏色：

```javascript
colors: {
  primary: {
    50: '#f5f3ff',
    // ... 其他色階
  },
}
```

### 自訂頁面內容

- **首頁**: 編輯 `src/pages/HomePage.tsx`
- **Header**: 編輯 `src/components/Header.tsx`
- **Footer**: 編輯 `src/components/Footer.tsx`

### 新增路由

在 `src/App.tsx` 中添加新路由：

```typescript
<Route path="/new-page" element={<NewPage />} />
```

## 部署

### Vercel (推薦)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 自動部署完成

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### 靜態託管

建置完成後，將 `dist` 目錄部署到任何靜態託管服務。

## Vite 特色

### 超快速 HMR

- 即時模組熱替換
- 無需重新載入頁面
- 保留應用狀態

### 優化建置

- Rollup 打包優化
- 自動程式碼分割
- Tree-shaking

### 現代化開發

- 原生 ESM 支援
- TypeScript 開箱即用
- CSS 預處理器支援

## 優化建議

- 🔌 **API 整合** - 串接實際的商品 API
- 💳 **支付整合** - 整合 Stripe / PayPal
- 🔐 **使用者認證** - Firebase Auth / Auth0
- 📊 **訂單管理** - 建立訂單追蹤系統
- 🔍 **搜尋功能** - 實作商品搜尋
- ⭐ **評論系統** - 商品評價功能
- 📧 **Email 通知** - 訂單確認信件
- 🎯 **推薦系統** - 相關商品推薦
- 🌙 **深色模式** - 主題切換功能
- 📱 **PWA** - 使用 vite-plugin-pwa
- 🖼️ **圖片優化** - 使用 vite-imagetools
- 📦 **虛擬滾動** - react-window 處理大量商品

## 環境變數

創建 `.env.local` 檔案：

```env
# API 端點
VITE_API_URL=your_api_url

# 其他配置
VITE_STRIPE_KEY=your_stripe_key
```

注意：環境變數必須以 `VITE_` 開頭才能在應用中使用。

## 效能優化

### 程式碼分割

```typescript
// 使用動態導入
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
```

### 圖片優化

```typescript
// 使用 Vite 的圖片導入
import imageUrl from './image.png?url'
import imageWebp from './image.png?webp'
```

### Bundle 分析

```bash
npm run build -- --mode analyze
```

## License

MIT License

## 相關資源

- [Vite 文檔](https://vitejs.dev/)
- [React 文檔](https://react.dev/)
- [Zustand 文檔](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [React Router 文檔](https://reactrouter.com/)
- [Framer Motion 文檔](https://www.framer.com/motion/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
