# Next.js Dashboard with Recharts

使用 Next.js 14、TypeScript、Tailwind CSS 和 Recharts 打造的現代化數據儀表板。

## 功能特色

- ✨ **現代化設計** - 使用 Tailwind CSS 打造精美 UI
- 📊 **豐富圖表** - 整合 Recharts 提供多種圖表類型
- 🚀 **高效能** - Next.js 14 App Router 與 Server Components
- 📱 **響應式設計** - 完美支援各種螢幕尺寸
- 🎨 **深色模式** - 支援深色/淺色主題
- ⚡ **即時更新** - 模擬即時數據更新功能
- 📈 **數據視覺化** - 折線圖、柱狀圖、指標卡片等
- 🎯 **TypeScript** - 完整的類型安全

## 主要組件

### 指標卡片（Metric Cards）
- 總收入、總用戶數、總訂單、活躍用戶
- 顯示變化趨勢與百分比
- 圖標與視覺化呈現

### 圖表組件
1. **銷售趨勢圖** - 折線圖顯示銷售額與訂單數趨勢
2. **月收入統計** - 柱狀圖顯示收入與支出對比

### 活動記錄
- 即時顯示最近的系統活動
- 訂單、註冊、付款等事件追蹤

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖表**: Recharts
- **圖示**: Lucide React
- **日期**: date-fns
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

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
nextjs-dashboard/
├── app/
│   ├── layout.tsx          # 根佈局
│   ├── page.tsx            # 主儀表板頁面
│   └── globals.css         # 全局樣式
├── components/
│   ├── charts/
│   │   ├── SalesChart.tsx  # 銷售趨勢圖
│   │   └── RevenueChart.tsx # 收入統計圖
│   └── widgets/
│       └── MetricCard.tsx   # 指標卡片組件
├── lib/                     # 工具函數
├── public/                  # 靜態資源
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

## 組件使用範例

### MetricCard

```typescript
<MetricCard
  title="總收入"
  value="$45,231"
  change={12.5}
  trend="up"
  icon={<DollarSign className="w-6 h-6" />}
/>
```

### SalesChart

```typescript
import SalesChart from '@/components/charts/SalesChart'

<div className="bg-white rounded-lg p-6">
  <h2 className="text-lg font-semibold mb-4">銷售趨勢</h2>
  <SalesChart />
</div>
```

### RevenueChart

```typescript
import RevenueChart from '@/components/charts/RevenueChart'

<div className="bg-white rounded-lg p-6">
  <h2 className="text-lg font-semibold mb-4">月收入統計</h2>
  <RevenueChart />
</div>
```

## 客製化指南

### 修改數據源

編輯 `app/page.tsx` 中的數據生成邏輯：

```typescript
const generateRandomData = () => ({
  totalRevenue: Math.floor(Math.random() * 100000) + 45000,
  totalUsers: Math.floor(Math.random() * 5000) + 2000,
  // ... 自訂數據邏輯
})
```

### 修改圖表數據

編輯各圖表組件中的 `data` 陣列：

```typescript
const data = [
  { name: '一月', sales: 4000, orders: 2400 },
  // ... 新增或修改數據
]
```

### 新增圖表類型

使用 Recharts 提供的其他圖表類型：

```typescript
import { AreaChart, Area, PieChart, Pie, ... } from 'recharts'
```

### 修改配色

編輯 `tailwind.config.ts` 中的 primary 顏色：

```typescript
colors: {
  primary: {
    500: '#3b82f6', // 主色調
    // ... 其他色階
  },
}
```

## 進階功能建議

### 1. 整合真實 API

```typescript
// 替換模擬數據為真實 API 調用
const fetchDashboardData = async () => {
  const response = await fetch('/api/dashboard')
  return response.json()
}
```

### 2. WebSocket 即時數據

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://your-server.com')
  ws.onmessage = (event) => {
    setMetrics(JSON.parse(event.data))
  }
  return () => ws.close()
}, [])
```

### 3. 數據導出

```bash
npm install jspdf html2canvas
```

```typescript
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const exportToPDF = async () => {
  const element = document.getElementById('dashboard')
  const canvas = await html2canvas(element)
  const pdf = new jsPDF()
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0)
  pdf.save('dashboard.pdf')
}
```

### 4. 數據篩選

```typescript
// 新增日期範圍選擇器
import { DateRangePicker } from '@/components/DateRangePicker'

const [dateRange, setDateRange] = useState({ start: null, end: null })
```

## 部署

### Vercel (推薦)

```bash
npm install -g vercel
vercel --prod
```

或使用 Vercel GitHub 整合自動部署。

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 效能優化

- ✅ 使用 Next.js Image 組件優化圖片
- ✅ 實作數據快取策略（Redis）
- ✅ 使用 React.memo 優化組件渲染
- ✅ 實作虛擬化長列表
- ✅ 使用 SWR 或 React Query 管理數據獲取

## 授權

MIT License

## 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Recharts 文檔](https://recharts.org/)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
