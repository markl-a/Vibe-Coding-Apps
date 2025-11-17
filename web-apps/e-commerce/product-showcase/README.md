# Product Showcase - 產品展示電商網站

一個現代化的電子商務產品展示網站，使用 Next.js 14、TypeScript 和 Tailwind CSS 構建。

## 功能特色

### 核心功能
- 產品列表頁面（網格佈局）
- 產品詳情頁面（大圖展示、規格、評價）
- 購物車功能（增刪改、總價計算）
- 願望清單（收藏功能）
- 產品搜尋
- 分類篩選（多個分類和價格範圍）
- 產品排序（價格、評分、新品）
- 產品評價系統
- 結帳流程（表單驗證）
- 響應式設計
- 圖片懸停放大效果
- 本地存儲（購物車持久化）

### 技術亮點
- 使用 Zustand 進行狀態管理
- React Hook Form + Zod 進行表單驗證
- Framer Motion 提供流暢動畫效果
- TypeScript 保證類型安全
- Tailwind CSS 實現現代化 UI
- 完全響應式設計

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **表單處理**: React Hook Form + Zod
- **動畫**: Framer Motion
- **圖標**: Lucide React

## 專案結構

```
product-showcase/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # 根佈局
│   ├── page.tsx             # 首頁（產品列表）
│   ├── globals.css          # 全局樣式
│   ├── product/
│   │   └── [id]/
│   │       └── page.tsx     # 產品詳情頁
│   ├── cart/
│   │   └── page.tsx         # 購物車頁面
│   ├── checkout/
│   │   └── page.tsx         # 結帳頁面
│   └── wishlist/
│       └── page.tsx         # 願望清單頁面
├── components/              # React 組件
│   ├── ui/                  # 基礎 UI 組件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Rating.tsx
│   ├── layout/              # 佈局組件
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── products/            # 產品相關組件
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   ├── ProductSort.tsx
│   │   ├── ProductSearch.tsx
│   │   └── ImageGallery.tsx
│   ├── cart/                # 購物車組件
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   └── checkout/            # 結帳組件
│       └── CheckoutForm.tsx
├── store/                   # Zustand 狀態管理
│   ├── useCartStore.ts      # 購物車狀態
│   ├── useWishlistStore.ts  # 願望清單狀態
│   └── useFilterStore.ts    # 篩選狀態
├── lib/                     # 工具函數和數據
│   ├── utils.ts             # 工具函數
│   └── mockData.ts          # 模擬數據
├── types/                   # TypeScript 類型定義
│   └── index.ts
├── public/                  # 靜態資源
│   └── images/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── .gitignore
```

## 開始使用

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

在瀏覽器中打開 [http://localhost:3000](http://localhost:3000) 查看結果。

### 建置專案

```bash
npm run build
```

### 啟動生產伺服器

```bash
npm start
```

### 類型檢查

```bash
npm run type-check
```

## 主要功能說明

### 產品瀏覽
- 網格佈局展示所有產品
- 支援分類、價格範圍、評分、標籤篩選
- 支援多種排序方式（價格、評分、新品、名稱）
- 即時搜尋功能
- 產品卡片懸停效果

### 產品詳情
- 多圖展示（支援縮放和切換）
- 完整的產品規格
- 用戶評價展示
- 庫存狀態顯示
- 數量選擇器
- 加入購物車和願望清單

### 購物車
- 商品列表展示
- 數量調整
- 即時更新總價
- 運費計算（滿額免運）
- 稅金計算
- 本地存儲（刷新不丟失）

### 願望清單
- 收藏商品
- 快速加入購物車
- 本地存儲

### 結帳流程
- 完整的表單驗證
- 個人資料輸入
- 配送地址
- 付款資訊
- 訂單摘要
- 安全提示

## 數據說明

專案使用模擬數據（`lib/mockData.ts`），包含：
- 12 個精心設計的產品
- 多個分類（音訊設備、筆記型電腦、智慧型手機等）
- 產品評價和評分
- 完整的產品規格
- 高品質的產品圖片（來自 Unsplash）

## 響應式設計

網站針對不同屏幕尺寸進行了優化：
- 手機（< 640px）：單列佈局
- 平板（640px - 1024px）：雙列佈局
- 桌面（> 1024px）：多列佈局

## 瀏覽器支援

- Chrome（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- Edge（最新版本）

## 授權

MIT License

## 作者

Vibe Coding Apps - E-commerce Team
