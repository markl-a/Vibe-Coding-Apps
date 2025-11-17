# 銷售指標儀表板 (Sales Metrics Dashboard)

一個功能完整的銷售數據分析儀表板，使用 Next.js 14、TypeScript 和 Tailwind CSS 構建，提供即時數據更新和互動式圖表展示。

## 功能特點

### 核心功能

- **關鍵銷售指標展示**
  - 總收入 (Total Revenue)
  - 訂單數 (Total Orders)
  - 平均訂單價值 (Average Order Value)
  - 轉換率 (Conversion Rate)
  - 即時顯示與上期比較的增長率

- **日期範圍選擇器**
  - 今天 (Today)
  - 本週 (This Week)
  - 本月 (This Month)
  - 自定義範圍 (Custom) - 待實現

- **互動式圖表**
  - 📈 收入趨勢折線圖 - 顯示時間序列的收入變化
  - 📊 產品類別銷售柱狀圖 - 比較不同類別的銷售表現
  - 🥧 銷售地區分佈餅圖 - 展示地理位置的銷售佔比

- **數據表格**
  - 熱銷產品排行榜
  - 包含產品名稱、類別、銷售數量、銷售額和增長率
  - 視覺化排名指標

- **即時數據更新**
  - 每 5 秒自動更新數據
  - 手動重新整理功能
  - 顯示最後更新時間

- **響應式設計**
  - 適配桌面、平板和手機設備
  - 流暢的動畫效果
  - 現代化的 UI 設計

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖表**: Recharts
- **日期處理**: date-fns
- **圖標**: Lucide React

## 專案結構

```
sales-metrics-dashboard/
├── app/
│   ├── globals.css          # 全局樣式
│   ├── layout.tsx           # 根佈局
│   └── page.tsx             # 主頁面（儀表板）
├── components/
│   ├── CategoryChart.tsx    # 產品類別柱狀圖組件
│   ├── DashboardHeader.tsx  # 儀表板標題組件
│   ├── DateRangeSelector.tsx # 日期範圍選擇器組件
│   ├── MetricCard.tsx       # 指標卡片組件
│   ├── RegionChart.tsx      # 地區分佈餅圖組件
│   ├── RevenueChart.tsx     # 收入趨勢折線圖組件
│   └── TopProductsTable.tsx # 熱銷產品表格組件
├── lib/
│   ├── mockData.ts          # 模擬數據生成器
│   └── utils.ts             # 工具函數
├── types/
│   └── index.ts             # TypeScript 類型定義
├── public/                  # 靜態資源目錄
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

## 快速開始

### 環境要求

- Node.js 18.17 或更高版本
- npm 或 yarn 或 pnpm

### 安裝步驟

1. 進入專案目錄：

```bash
cd sales-metrics-dashboard
```

2. 安裝依賴：

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

3. 啟動開發服務器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

4. 在瀏覽器中打開 [http://localhost:3000](http://localhost:3000) 查看應用。

### 構建生產版本

```bash
npm run build
npm start
```

## 數據說明

本專案使用模擬數據來展示儀表板功能。數據包括：

- **銷售指標**: 基於隨機生成的數據，模擬真實業務場景
- **收入趨勢**: 根據選擇的日期範圍動態生成
- **產品類別**: 電子產品、服飾配件、家居生活、運動健身、美妝保養
- **銷售地區**: 台北市、新北市、台中市、台南市、高雄市、其他地區
- **即時更新**: 每 5 秒自動更新數據，模擬 5% 的波動範圍

### 整合真實數據

要整合真實的 API 數據，請修改 `app/page.tsx` 中的數據獲取邏輯：

```typescript
// 替換 generateDashboardData() 為你的 API 調用
const fetchDashboardData = async (dateRange: DateRange) => {
  const response = await fetch(`/api/dashboard?range=${dateRange}`);
  return response.json();
};
```

## 自定義配置

### 修改主題顏色

編輯 `tailwind.config.ts` 文件中的 `primary` 顏色：

```typescript
colors: {
  primary: {
    500: '#0ea5e9', // 修改為你的品牌顏色
    // ...
  },
}
```

### 調整更新頻率

在 `app/page.tsx` 中修改更新間隔：

```typescript
const interval = setInterval(() => {
  setDashboardData((currentData) => simulateRealtimeUpdate(currentData));
}, 5000); // 修改為你想要的毫秒數
```

### 添加新的圖表

1. 在 `components/` 目錄下創建新組件
2. 在 `types/index.ts` 中定義數據類型
3. 在 `lib/mockData.ts` 中添加數據生成函數
4. 在 `app/page.tsx` 中導入並使用新組件

## 功能擴展建議

- [ ] 添加自定義日期範圍選擇器
- [ ] 實現數據導出功能（CSV, Excel, PDF）
- [ ] 添加圖表下鑽功能
- [ ] 整合後端 API
- [ ] 添加用戶認證
- [ ] 實現深色模式
- [ ] 添加數據篩選和搜索功能
- [ ] 多語言支持
- [ ] 添加通知和警報系統
- [ ] 實現數據比較功能（同比、環比）

## 瀏覽器支持

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 授權

MIT License

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 聯繫方式

如有問題或建議，請聯繫專案維護者。

---

**注意**: 本專案使用模擬數據，不包含真實的銷售信息。在生產環境中使用前，請確保整合實際的數據源並實施適當的安全措施。
