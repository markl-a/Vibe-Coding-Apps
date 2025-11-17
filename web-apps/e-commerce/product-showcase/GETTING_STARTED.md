# 快速開始指南

歡迎使用 Product Showcase！這份指南將幫助您快速啟動並運行這個專案。

## 前置要求

確保您的系統已安裝：
- Node.js 18.0 或更高版本
- npm 9.0 或更高版本

## 安裝步驟

### 1. 安裝依賴

```bash
cd /home/user/Vibe-Coding-Apps/web-apps/e-commerce/product-showcase
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

### 3. 打開瀏覽器

訪問 [http://localhost:3000](http://localhost:3000) 查看網站。

## 專案導覽

### 主要頁面

- **首頁** (`/`): 產品列表頁面，支援搜尋、篩選和排序
- **產品詳情** (`/product/[id]`): 顯示單個產品的詳細資訊
- **購物車** (`/cart`): 查看和管理購物車商品
- **願望清單** (`/wishlist`): 查看收藏的產品
- **結帳** (`/checkout`): 完成訂單的結帳流程

### 主要功能體驗

1. **瀏覽產品**
   - 在首頁查看所有產品
   - 使用左側篩選器按分類、價格、評分篩選
   - 使用搜尋框搜尋產品
   - 使用排序下拉選單改變顯示順序

2. **產品詳情**
   - 點擊任意產品卡片查看詳情
   - 查看多張產品圖片（支援切換和放大）
   - 閱讀產品規格和評價
   - 調整數量並加入購物車

3. **購物車管理**
   - 點擊右上角購物車圖標
   - 調整商品數量
   - 移除不需要的商品
   - 查看訂單摘要（包含運費和稅金）

4. **願望清單**
   - 點擊產品卡片上的愛心圖標收藏產品
   - 在願望清單頁面查看所有收藏

5. **結帳流程**
   - 從購物車頁面點擊「前往結帳」
   - 填寫個人資料、配送地址和付款資訊
   - 送出訂單（目前為模擬，不會真實扣款）

## 自訂數據

### 修改產品數據

編輯 `lib/mockData.ts` 文件：

```typescript
export const mockProducts: Product[] = [
  {
    id: '1',
    name: '您的產品名稱',
    description: '產品描述',
    price: 9999,
    // ... 其他屬性
  },
  // 添加更多產品
];
```

### 修改分類和標籤

同樣在 `lib/mockData.ts` 中：

```typescript
export const categories = [
  '全部',
  '您的分類1',
  '您的分類2',
  // ...
];

export const tags = [
  '標籤1',
  '標籤2',
  // ...
];
```

## 常見問題

### Q: 如何添加新頁面？

A: 在 `app` 目錄下創建新的目錄和 `page.tsx` 文件。Next.js 會自動處理路由。

### Q: 如何修改樣式？

A: 使用 Tailwind CSS 類名直接在組件中修改，或編輯 `tailwind.config.ts` 自訂主題。

### Q: 購物車數據存在哪裡？

A: 使用 Zustand 的 `persist` 中間件存儲在瀏覽器的 localStorage 中。

### Q: 如何部署到生產環境？

A:
```bash
npm run build
npm start
```

或者部署到 Vercel、Netlify 等平台。

## 技術支援

如有問題，請參考：
- [Next.js 文檔](https://nextjs.org/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Zustand 文檔](https://github.com/pmndrs/zustand)

## 下一步

- 添加更多產品
- 整合真實的 API
- 添加用戶認證
- 整合支付網關
- 添加訂單管理系統
- 優化 SEO

祝您使用愉快！
