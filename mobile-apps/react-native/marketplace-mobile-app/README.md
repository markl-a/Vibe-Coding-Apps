# Marketplace Mobile App 🛒

一個使用 **AI 輔助開發**的 React Native 電商應用。

## 功能特點

- 🏠 商品首頁 - 瀏覽精選商品
- 📂 商品分類 - 依類別瀏覽
- 🛒 購物車 - 管理購買商品
- 👤 個人中心 - 訂單和設定管理

## 技術棧

- **框架**: React Native + Expo
- **導航**: React Navigation (Bottom Tabs)
- **狀態管理**: Zustand (持久化到 AsyncStorage)
- **語言**: TypeScript
- **圖標**: @expo/vector-icons (Ionicons)

## 專案結構

```
marketplace-mobile-app/
├── src/
│   ├── screens/              # 頁面組件
│   │   ├── HomeScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   ├── CartScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/           # 可重用組件
│   ├── navigation/           # 導航配置
│   ├── store/                # Zustand 狀態管理
│   │   └── cartStore.ts
│   ├── services/             # API 服務
│   ├── utils/                # 工具函數
│   └── types/                # TypeScript 類型定義
│       └── index.ts
├── App.tsx                   # 應用入口
├── app.json                  # Expo 配置
├── package.json
├── tsconfig.json
└── babel.config.js
```

## 開始使用

### 安裝依賴

```bash
npm install
# 或
yarn install
```

### 運行應用

```bash
# 啟動開發服務器
npm start

# 在 iOS 上運行
npm run ios

# 在 Android 上運行
npm run android

# 在網頁上運行
npm run web
```

## 主要功能

### 1. 商品首頁

- 搜尋商品
- 輪播廣告
- 精選商品展示
- 快速加入購物車
- 商品評分顯示

### 2. 商品分類

- 10 大分類導航
- 圖標化分類顯示
- 快速分類篩選

### 3. 購物車

- 商品數量調整
- 刪除商品
- 即時計算總價
- 購物車徽章顯示數量
- 持久化儲存（重啟應用後保留）
- 清空購物車功能

### 4. 個人中心

- 訂單狀態統計
- 我的收藏
- 收貨地址管理
- 付款方式設定
- 優惠券中心
- 客服中心
- 設定選項

## 狀態管理

使用 Zustand 進行購物車狀態管理，支持持久化：

```typescript
import { useCartStore } from './store/cartStore';

// 使用狀態
const items = useCartStore((state) => state.items);
const addItem = useCartStore((state) => state.addItem);
const getTotalPrice = useCartStore((state) => state.getTotalPrice);

// 添加商品
addItem(product);

// 獲取總價
const total = getTotalPrice();
```

## 數據模型

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}
```

## 未來改進

- [ ] 整合真實的電商 API
- [ ] 商品詳情頁面
- [ ] 商品搜尋和篩選
- [ ] 用戶認證系統
- [ ] 訂單管理系統
- [ ] 支付整合
- [ ] 商品評價系統
- [ ] 推薦算法
- [ ] 優惠券系統
- [ ] 推送通知
- [ ] 多語言支持

## AI 開發經驗

這個專案使用 AI 工具開發，展示了：

- 電商應用標準功能
- 購物車狀態管理與持久化
- Tab 導航實現
- 商品列表和卡片設計
- 響應式 UI 設計
- TypeScript 最佳實踐

## 授權

MIT License
