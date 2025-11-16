# Analytics Dashboard with React & Chart.js

使用 React 18、TypeScript、Vite 和 Chart.js 打造的現代化分析儀表板。

## 功能特色

- ⚡ **極速開發** - 使用 Vite 提供閃電般的開發體驗
- 📊 **強大圖表** - 整合 Chart.js 提供豐富的圖表類型
- 🎨 **精美設計** - 現代化 UI 設計與動畫效果
- 📱 **完全響應式** - 完美支援各種裝置與螢幕尺寸
- 🚀 **高效能** - React 18 與 TypeScript
- 📈 **多種圖表** - 折線圖、柱狀圖、圓餅圖等
- 🎯 **類型安全** - 完整的 TypeScript 支援
- 🔥 **熱更新** - Vite HMR 快速開發

## 主要功能

### 指標卡片（Metrics）
- **總收入** - 顯示當前總收入與變化趨勢
- **總用戶數** - 用戶增長統計
- **總訂單** - 訂單數量追蹤
- **轉換率** - 轉換率分析

### 圖表展示
1. **銷售趨勢圖** - 折線圖顯示銷售額與目標對比
2. **月收入統計** - 柱狀圖展示收入與支出
3. **產品分布** - 圓餅圖顯示產品類別佔比
4. **活動記錄** - 即時系統活動追蹤

## 技術棧

- **框架**: React 18
- **建置工具**: Vite 5
- **語言**: TypeScript
- **圖表**: Chart.js + react-chartjs-2
- **圖示**: React Icons
- **日期**: date-fns
- **樣式**: CSS Modules
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

開啟瀏覽器訪問 [http://localhost:3002](http://localhost:3002)

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
analytics-dashboard/
├── src/
│   ├── components/           # React 組件
│   │   ├── MetricCard.tsx   # 指標卡片
│   │   ├── LineChartComponent.tsx    # 折線圖
│   │   ├── BarChartComponent.tsx     # 柱狀圖
│   │   └── DoughnutChartComponent.tsx # 圓餅圖
│   ├── pages/
│   │   └── Dashboard.tsx    # 主儀表板頁面
│   ├── styles/
│   │   ├── index.css        # 全局樣式
│   │   └── App.css          # 應用樣式
│   ├── utils/               # 工具函數
│   ├── App.tsx              # 根組件
│   └── main.tsx             # 入口文件
├── public/                  # 靜態資源
├── index.html               # HTML 模板
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── package.json
```

## Chart.js 組件使用

### 折線圖（Line Chart）

```typescript
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, ... } from 'chart.js'

ChartJS.register(...)

const data = {
  labels: ['一月', '二月', '三月', ...],
  datasets: [{
    label: '銷售額',
    data: [4000, 3000, 5000, ...],
    borderColor: 'rgb(59, 130, 246)',
  }]
}

<Line data={data} options={options} />
```

### 柱狀圖（Bar Chart）

```typescript
import { Bar } from 'react-chartjs-2'

<Bar data={data} options={options} />
```

### 圓餅圖（Doughnut Chart）

```typescript
import { Doughnut } from 'react-chartjs-2'

<Doughnut data={data} options={options} />
```

## 客製化指南

### 修改圖表數據

編輯各圖表組件中的 `data` 物件：

```typescript
const data = {
  labels: ['一月', '二月', ...],
  datasets: [{
    data: [4000, 3000, ...], // 修改這裡的數據
  }]
}
```

### 修改顏色主題

編輯 `src/styles/index.css` 中的 CSS 變數：

```css
:root {
  --primary-color: #3b82f6;
  --secondary-color: #10b981;
  /* ... 其他顏色 */
}
```

### 新增圖表類型

Chart.js 支援多種圖表類型：

```typescript
import { Pie, Radar, PolarArea, Scatter } from 'react-chartjs-2'
```

### 新增指標卡片

在 `Dashboard.tsx` 中新增：

```typescript
<MetricCard
  title="新指標"
  value="100"
  change={5.0}
  trend="up"
  icon={<YourIcon />}
  iconColor="blue"
/>
```

## 進階功能

### 1. 整合真實 API

```typescript
import { useEffect, useState } from 'react'

const Dashboard = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('https://api.example.com/analytics')
      .then(res => res.json())
      .then(setData)
  }, [])

  return <LineChartComponent data={data} />
}
```

### 2. 即時數據更新

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchLatestData().then(setData)
  }, 5000) // 每 5 秒更新

  return () => clearInterval(interval)
}, [])
```

### 3. 圖表互動

```typescript
const options = {
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index
      console.log('Clicked:', data.labels[index])
    }
  }
}
```

### 4. 數據導出

```bash
npm install file-saver
```

```typescript
import { saveAs } from 'file-saver'

const exportToCSV = () => {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: 'text/csv' })
  saveAs(blob, 'analytics-data.csv')
}
```

## 可用圖表類型

Chart.js 支援以下圖表類型：

1. **Line** - 折線圖
2. **Bar** - 柱狀圖
3. **Doughnut** - 圓餅圖
4. **Pie** - 餅圖
5. **Radar** - 雷達圖
6. **PolarArea** - 極區圖
7. **Bubble** - 氣泡圖
8. **Scatter** - 散點圖

## 部署

### Vercel

```bash
npm install -g vercel
vercel --prod
```

或直接在 Vercel 網站上連接 GitHub 倉庫。

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 效能優化

- ✅ Vite 的快速 HMR
- ✅ 按需載入圖表組件
- ✅ React.memo 優化重複渲染
- ✅ useMemo 緩存計算結果
- ✅ 圖表數據分頁與虛擬化

## 開發建議

### 使用 React DevTools

安裝 React Developer Tools 瀏覽器擴展來調試組件。

### 圖表配置

查閱 [Chart.js 文檔](https://www.chartjs.org/docs/) 了解更多配置選項。

### TypeScript 支援

所有組件都有完整的類型定義，享受 IDE 的自動完成和類型檢查。

## 授權

MIT License

## 相關資源

- [React 文檔](https://react.dev/)
- [Chart.js 文檔](https://www.chartjs.org/)
- [Vite 文檔](https://vitejs.dev/)
- [TypeScript 文檔](https://www.typescriptlang.org/)
- [React Icons](https://react-icons.github.io/react-icons/)

## 疑難排解

### 圖表不顯示

確保已正確註冊所有必要的 Chart.js 組件：

```typescript
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  // ... 其他必要組件
)
```

### 建置錯誤

清除緩存並重新安裝依賴：

```bash
rm -rf node_modules package-lock.json
npm install
```

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**Port**: 3002
