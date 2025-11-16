# Admin Panel with Tremor

使用 Next.js 14、TypeScript 和 Tremor 打造的現代化管理後台面板。

## 功能特色

- ✨ **精美 UI** - 使用 Tremor 組件庫打造專業介面
- 📊 **豐富圖表** - 面積圖、柱狀圖、圓餅圖、條形圖等
- 🎨 **現代設計** - 簡潔優雅的管理介面
- 📱 **響應式佈局** - 完美支援各種螢幕尺寸
- 🚀 **高效能** - Next.js 14 App Router
- 🔍 **直覺導航** - 清晰的側邊欄導航系統
- 📈 **數據視覺化** - 多種圖表展示方式
- 🎯 **TypeScript** - 完整的類型安全

## 主要功能

### 儀表板總覽
- **KPI 指標卡** - 總收入、總訂單、活躍用戶、轉換率
- **銷售趨勢** - 面積圖顯示銷售額與目標對比
- **產品分布** - 圓餅圖展示產品類別佔比
- **地區排名** - 條形圖顯示各地區銷售表現
- **月度對比** - 柱狀圖比較每月銷售數據

### 側邊欄導航
- 總覽儀表板
- 用戶管理
- 產品管理
- 報表分析
- 文檔中心
- 系統設定

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **UI 組件**: Tremor React
- **樣式**: Tailwind CSS
- **圖示**: Lucide React
- **日期**: date-fns
- **工具**: clsx
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

開啟瀏覽器訪問 [http://localhost:3001](http://localhost:3001)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
admin-panel/
├── app/
│   ├── layout.tsx          # 根佈局（含側邊欄）
│   ├── page.tsx            # 主儀表板頁面
│   ├── globals.css         # 全局樣式
│   ├── dashboard/          # 儀表板子頁面
│   ├── users/              # 用戶管理頁面
│   └── settings/           # 設定頁面
├── components/
│   └── Sidebar.tsx         # 側邊欄組件
├── lib/                    # 工具函數
├── public/                 # 靜態資源
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

## Tremor 組件使用範例

### KPI 指標卡

```typescript
import { Card, Text, Metric, Flex } from '@tremor/react'

<Card>
  <Text>總收入</Text>
  <Metric>$ 34,200</Metric>
  <Flex className="mt-4">
    <Text>較上月</Text>
    <Text className="text-green-600">+12.5%</Text>
  </Flex>
</Card>
```

### 面積圖

```typescript
import { Card, Title, AreaChart } from '@tremor/react'

<Card>
  <Title>銷售趨勢分析</Title>
  <AreaChart
    className="mt-4 h-72"
    data={salesData}
    index="date"
    categories={['銷售額', '目標']}
    colors={['blue', 'gray']}
    valueFormatter={valueFormatter}
  />
</Card>
```

### 圓餅圖

```typescript
import { Card, DonutChart } from '@tremor/react'

<Card>
  <DonutChart
    className="mt-4 h-72"
    data={categoryData}
    category="value"
    index="name"
    colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
  />
</Card>
```

### 條形圖

```typescript
import { Card, BarList } from '@tremor/react'

<Card>
  <BarList
    data={regionData}
    valueFormatter={valueFormatter}
  />
</Card>
```

## 客製化指南

### 修改數據源

編輯 `app/page.tsx` 中的數據陣列：

```typescript
const salesData = [
  { date: '2024-01', 銷售額: 2890, 目標: 2400 },
  // ... 新增或修改數據
]
```

### 新增導航項目

編輯 `components/Sidebar.tsx`：

```typescript
const navigation = [
  { name: '總覽', href: '/', icon: LayoutDashboard },
  { name: '新頁面', href: '/new-page', icon: YourIcon },
  // ... 其他項目
]
```

### 修改配色主題

編輯 `tailwind.config.ts` 中的 Tremor 顏色配置：

```typescript
colors: {
  tremor: {
    brand: {
      DEFAULT: '#3b82f6', // 主要品牌色
      // ... 其他色階
    },
  },
}
```

### 新增頁面

在 `app` 目錄下創建新資料夾：

```bash
mkdir app/new-page
touch app/new-page/page.tsx
```

## Tremor 可用圖表類型

1. **AreaChart** - 面積圖
2. **BarChart** - 柱狀圖
3. **LineChart** - 折線圖
4. **DonutChart** - 圓餅圖
5. **BarList** - 條形列表
6. **ScatterChart** - 散點圖
7. **SparkChart** - 迷你圖
8. **Tracker** - 追蹤器

## 進階功能建議

### 1. 整合真實 API

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <AreaChart data={data} ... />
}
```

### 2. 新增用戶認證

```bash
npm install next-auth
```

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// 配置認證邏輯
```

### 3. 數據導出功能

```typescript
import { exportToCSV, exportToPDF } from '@/lib/export'

const handleExport = () => {
  exportToCSV(data, 'report.csv')
  // 或
  exportToPDF(data, 'report.pdf')
}
```

### 4. 數據篩選與搜尋

```typescript
import { DateRangePicker, MultiSelect } from '@tremor/react'

<DateRangePicker
  value={dateRange}
  onValueChange={setDateRange}
/>

<MultiSelect
  value={selectedCategories}
  onValueChange={setSelectedCategories}
  options={categories}
/>
```

## 部署

### Vercel (推薦)

```bash
npm install -g vercel
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### 環境變數

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
```

## 效能優化

- ✅ 使用 Tremor 內建的響應式圖表
- ✅ 實作數據分頁與虛擬化
- ✅ 使用 SWR 進行數據快取
- ✅ 圖片優化（Next.js Image）
- ✅ 程式碼分割與動態載入

## 授權

MIT License

## 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Tremor 文檔](https://www.tremor.so/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

## 範例數據

專案使用模擬數據進行展示，實際使用時請替換為真實 API 數據源。

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**Port**: 3001
