# 📊 數據儀表板與分析工具
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的數據視覺化儀表板、管理後台與分析工具。

## 📋 專案目標

建立功能強大的數據儀表板與分析工具,提供即時數據監控、視覺化圖表、報表生成等功能,並充分利用 AI 工具加速開發流程。

## 🎯 核心功能（規劃中）

### 1. 數據視覺化
- 多種圖表類型（折線、柱狀、圓餅、散點等）
- 即時數據更新
- 互動式圖表
- 自訂圖表配色
- 圖表匯出（PNG, SVG, PDF）
- 響應式圖表設計
- 數據鑽取（Drill-down）

### 2. 儀表板管理
- 可拖曳的儀表板佈局
- 自訂小工具（Widgets）
- 儀表板範本
- 多儀表板支援
- 儀表板分享
- 佈局儲存與載入
- 全屏模式

### 3. 數據來源整合
- REST API 整合
- WebSocket 即時數據
- 資料庫直連（PostgreSQL, MySQL）
- CSV / Excel 匯入
- Google Analytics 整合
- 第三方 API 整合
- 自訂數據轉換

### 4. 報表系統
- 排程報表生成
- PDF 報表匯出
- Email 報表發送
- 報表範本
- 自訂報表格式
- 歷史報表查詢

### 5. 警報與通知
- 數據閾值警報
- Email 通知
- Slack / Discord 整合
- 自訂警報規則
- 警報歷史記錄

### 6. 用戶與權限
- 角色權限管理
- 多租戶支援（Multi-tenant）
- 儀表板訪問控制
- 活動日誌
- SSO 整合

### 7. 效能與優化
- 數據快取（Redis）
- 延遲載入
- 虛擬化長列表
- 數據分頁
- 查詢優化

## 🛠️ 技術棧選項

### Option 1: Next.js + Chart.js (推薦)
```
Frontend:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Charts: Recharts / Chart.js
- State: Zustand / Jotai
- Drag & Drop: dnd-kit / react-grid-layout

Backend:
- API: Next.js API Routes / tRPC
- Database: PostgreSQL + Prisma
- Cache: Redis
- Auth: NextAuth.js

Deployment:
- Vercel
```

### Option 2: React + D3.js (進階)
```
Frontend:
- React + TypeScript
- D3.js (完全客製化視覺化)
- Tailwind CSS
- Redux Toolkit
- react-grid-layout

Backend:
- Node.js + Express
- PostgreSQL / TimescaleDB
- Redis

Deployment:
- Frontend: Vercel
- Backend: Railway
```

### Option 3: Apache Superset (開源 BI)
```
- Python + Flask
- 內建多種資料庫連接器
- 豐富的視覺化選項
- SQL 編輯器
- 快速部署
- 企業級功能
```

### Option 4: Grafana (監控儀表板)
```
- 專注於監控與觀察性
- 多種數據源支援
- 豐富的插件系統
- 警報功能
- 適合 DevOps 場景
```

## 🚀 快速開始

### Option 1: Next.js + Recharts

```bash
# 建立 Next.js 專案
npx create-next-app@latest my-dashboard --typescript --tailwind --app

cd my-dashboard

# 安裝圖表庫
npm install recharts
npm install @tremor/react  # 或使用 tremor

# 安裝 UI 組件
npx shadcn-ui@latest init
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add button

# 安裝拖曳佈局
npm install react-grid-layout
npm install -D @types/react-grid-layout

# 安裝其他依賴
npm install @prisma/client
npm install date-fns
npm install lucide-react

# 開發依賴
npm install -D prisma

# 啟動開發伺服器
npm run dev
```

### Option 2: 使用 Tremor (快速儀表板開發)

```bash
# Tremor 是專為儀表板設計的 React 組件庫
npm install @tremor/react

# 包含現成的圖表組件
import { Card, AreaChart, BarChart, DonutChart } from '@tremor/react'
```

## 📁 專案結構

```
dashboard-analytics/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 主儀表板
│   ├── dashboard/
│   │   ├── [dashboardId]/
│   │   │   └── page.tsx            # 自訂儀表板
│   │   └── builder/
│   │       └── page.tsx            # 儀表板建構器
│   ├── reports/
│   │   ├── page.tsx                # 報表列表
│   │   └── [reportId]/
│   │       └── page.tsx            # 報表詳情
│   ├── analytics/
│   │   ├── overview/
│   │   ├── traffic/
│   │   ├── users/
│   │   └── revenue/
│   ├── settings/
│   │   ├── page.tsx                # 設定
│   │   ├── data-sources/
│   │   └── alerts/
│   └── api/
│       ├── data/
│       ├── dashboards/
│       ├── reports/
│       └── alerts/
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── AreaChart.tsx
│   │   ├── ScatterChart.tsx
│   │   └── HeatMap.tsx
│   ├── widgets/
│   │   ├── MetricCard.tsx
│   │   ├── TrendCard.tsx
│   │   ├── TableWidget.tsx
│   │   ├── ChartWidget.tsx
│   │   └── CustomWidget.tsx
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx
│   │   ├── WidgetContainer.tsx
│   │   ├── DashboardToolbar.tsx
│   │   └── WidgetPicker.tsx
│   ├── reports/
│   │   ├── ReportBuilder.tsx
│   │   ├── ReportPreview.tsx
│   │   └── ReportExport.tsx
│   ├── filters/
│   │   ├── DateRangePicker.tsx
│   │   ├── FilterBar.tsx
│   │   └── SearchFilter.tsx
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/
│   ├── prisma.ts
│   ├── redis.ts
│   ├── dataFetcher.ts
│   └── utils.ts
├── store/
│   ├── dashboardStore.ts
│   └── filterStore.ts
├── types/
│   ├── dashboard.ts
│   ├── widget.ts
│   ├── chart.ts
│   └── data.ts
├── hooks/
│   ├── useRealTimeData.ts
│   ├── useChartData.ts
│   └── useDashboard.ts
└── public/
    └── assets/
```

## 📊 圖表組件範例

### 使用 Recharts

```typescript
// components/charts/LineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
  date: string
  value: number
}

interface LineChartProps {
  data: DataPoint[]
  color?: string
}

export const CustomLineChart = ({ data, color = '#8884d8' }: LineChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### 使用 Tremor

```typescript
// components/charts/TremorAreaChart.tsx
import { Card, Title, AreaChart } from '@tremor/react'

const chartdata = [
  { date: 'Jan 23', Sales: 2890, Profit: 2400 },
  { date: 'Feb 23', Sales: 2756, Profit: 2260 },
  { date: 'Mar 23', Sales: 3322, Profit: 2800 },
  // ...
]

export const SalesChart = () => {
  return (
    <Card>
      <Title>Sales Performance</Title>
      <AreaChart
        className="h-72 mt-4"
        data={chartdata}
        index="date"
        categories={["Sales", "Profit"]}
        colors={["indigo", "cyan"]}
        valueFormatter={(number) => `$${Intl.NumberFormat("us").format(number).toString()}`}
      />
    </Card>
  )
}
```

## 🗄️ 資料庫結構（Prisma Schema）

```prisma
// schema.prisma

model Dashboard {
  id          String   @id @default(cuid())
  name        String
  description String?
  layout      Json     // Grid layout 配置
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  widgets     Widget[]
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Widget {
  id           String    @id @default(cuid())
  type         WidgetType
  title        String
  config       Json      // 圖表配置
  dataSource   String?   // 數據來源 ID
  dashboard    Dashboard @relation(fields: [dashboardId], references: [id])
  dashboardId  String
  position     Json      // 位置與大小
  refreshRate  Int?      // 秒為單位
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model DataSource {
  id          String         @id @default(cuid())
  name        String
  type        DataSourceType
  connection  Json           // 連接配置
  userId      String
  user        User           @relation(fields: [userId], references: [id])
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Report {
  id          String       @id @default(cuid())
  name        String
  description String?
  query       Json
  schedule    String?      // Cron 表達式
  format      ReportFormat
  recipients  String[]
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Alert {
  id          String      @id @default(cuid())
  name        String
  condition   Json        // 警報條件
  threshold   Float
  recipients  String[]
  channels    String[]    // email, slack, discord
  enabled     Boolean     @default(true)
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  name        String
  role        UserRole     @default(USER)
  dashboards  Dashboard[]
  dataSources DataSource[]
  reports     Report[]
  alerts      Alert[]
  createdAt   DateTime     @default(now())
}

enum WidgetType {
  LINE_CHART
  BAR_CHART
  PIE_CHART
  AREA_CHART
  TABLE
  METRIC_CARD
  MAP
  CUSTOM
}

enum DataSourceType {
  REST_API
  POSTGRESQL
  MYSQL
  MONGODB
  CSV
  GOOGLE_ANALYTICS
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
}

enum UserRole {
  ADMIN
  USER
  VIEWER
}
```

## 🤖 AI 輔助開發建議

### 1. 儀表板架構設計

```
提示詞範例：
"請設計一個 Next.js 14 數據儀表板應用的完整架構，包含：
- 可拖曳的儀表板佈局（react-grid-layout）
- 多種圖表類型（Recharts）
- 即時數據更新（WebSocket）
- 報表生成與匯出
- 警報系統
- 資料庫設計（Prisma + PostgreSQL）
使用 TypeScript 和 App Router。"
```

### 2. 圖表組件生成

```
提示詞範例：
"請建立一個可重用的 Recharts 折線圖組件，包含：
- 支援多條線
- 自訂顏色
- Tooltip 格式化
- 響應式設計
- 載入狀態
- 錯誤處理
使用 TypeScript。"
```

### 3. 即時數據更新

```
提示詞範例：
"請實作即時數據更新功能，使用：
1. WebSocket 連接
2. 自動重連機制
3. 數據緩衝
4. 圖表平滑更新
5. 錯誤處理"
```

### 4. 拖曳式儀表板

```
提示詞範例：
"請使用 react-grid-layout 建立拖曳式儀表板，包含：
- 可拖曳與調整大小的小工具
- 佈局持久化（localStorage）
- 新增/刪除小工具
- 響應式佈局
使用 TypeScript 和 Tailwind CSS。"
```

## 🎨 儀表板設計範例

### 指標卡片（Metric Card）

```typescript
// components/widgets/MetricCard.tsx
interface MetricCardProps {
  title: string
  value: number
  change: number
  trend: 'up' | 'down'
  icon?: React.ReactNode
}

export const MetricCard = ({ title, value, change, trend, icon }: MetricCardProps) => {
  const isPositive = trend === 'up'

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-3xl font-bold mt-2">
            {value.toLocaleString()}
          </h3>
          <div className={`flex items-center mt-2 text-sm ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="ml-1">{Math.abs(change)}%</span>
          </div>
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
```

### 拖曳式網格佈局

```typescript
// components/dashboard/DashboardGrid.tsx
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface Widget {
  i: string
  type: string
  x: number
  y: number
  w: number
  h: number
}

export const DashboardGrid = ({ widgets, onLayoutChange }) => {
  const layout = widgets.map(w => ({
    i: w.i,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h
  }))

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={30}
      width={1200}
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag-handle"
    >
      {widgets.map(widget => (
        <div key={widget.i}>
          <WidgetContainer widget={widget} />
        </div>
      ))}
    </GridLayout>
  )
}
```

## 📊 開發路線圖

### Phase 1: 基礎設置
- [x] 技術棧選擇
- [x] 專案架構設計
- [ ] 建立專案骨架
- [ ] 設置資料庫（Prisma）
- [ ] 設置認證

### Phase 2: 圖表組件
- [ ] 折線圖組件
- [ ] 柱狀圖組件
- [ ] 圓餅圖組件
- [ ] 面積圖組件
- [ ] 表格組件

### Phase 3: 儀表板功能
- [ ] 網格佈局系統
- [ ] 小工具容器
- [ ] 拖曳與調整大小
- [ ] 佈局持久化
- [ ] 小工具選擇器

### Phase 4: 數據整合
- [ ] API 數據源
- [ ] WebSocket 即時數據
- [ ] 資料庫連接
- [ ] CSV 匯入
- [ ] 數據快取

### Phase 5: 報表系統
- [ ] 報表建構器
- [ ] PDF 匯出
- [ ] 排程報表
- [ ] Email 發送

### Phase 6: 警報系統
- [ ] 警報規則引擎
- [ ] 通知發送
- [ ] 警報歷史
- [ ] 多通道支援

### Phase 7: 優化與部署
- [ ] 效能優化
- [ ] 快取策略
- [ ] 部署
- [ ] 監控

## 🔥 進階功能建議

### 1. 即時數據串流

```typescript
// hooks/useRealTimeData.ts
import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

export const useRealTimeData = (metric: string) => {
  const [data, setData] = useState([])

  useEffect(() => {
    const socket = getSocket()

    socket.on(`metric:${metric}`, (newData) => {
      setData(prev => [...prev.slice(-100), newData])
    })

    return () => {
      socket.off(`metric:${metric}`)
    }
  }, [metric])

  return data
}
```

### 2. 數據快取策略

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const getCachedData = async (key: string, fetcher: () => Promise<any>, ttl = 300) => {
  const cached = await redis.get(key)

  if (cached) {
    return cached
  }

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))

  return data
}
```

### 3. 自訂查詢建構器

```typescript
// lib/queryBuilder.ts
interface QueryConfig {
  metric: string
  aggregation: 'sum' | 'avg' | 'count'
  groupBy?: string
  filters?: Record<string, any>
  dateRange?: { start: Date; end: Date }
}

export const buildQuery = (config: QueryConfig) => {
  // AI 可協助生成複雜的查詢邏輯
  // 將配置轉換為 SQL / Prisma 查詢
}
```

### 4. PDF 報表生成

```typescript
// lib/reportGenerator.ts
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export const generatePDFReport = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element)
  const imgData = canvas.toDataURL('image/png')

  const pdf = new jsPDF()
  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save(filename)
}
```

## 📱 響應式設計

```typescript
// 響應式網格配置
const responsiveLayouts = {
  lg: 12, // 桌面
  md: 10, // 平板橫向
  sm: 6,  // 平板直向
  xs: 4,  // 手機橫向
  xxs: 2  // 手機直向
}

<ResponsiveGridLayout
  layouts={layouts}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={responsiveLayouts}
>
  {/* widgets */}
</ResponsiveGridLayout>
```

## 🚀 部署建議

### Vercel 部署

```bash
# 環境變數
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
NEXTAUTH_SECRET="..."

# 部署
vercel --prod
```

### Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 🤝 貢獻與改進

歡迎提出改進建議！可以協助的方向：

- 📊 新增圖表類型
- 🎨 UI/UX 改進
- ⚡ 效能優化
- 🔌 新數據源整合
- 📱 移動端優化

## 📄 授權

MIT License

## 🔗 相關資源

### 圖表庫
- [Recharts](https://recharts.org/)
- [Chart.js](https://www.chartjs.org/)
- [Apache ECharts](https://echarts.apache.org/)
- [D3.js](https://d3js.org/)
- [Tremor](https://www.tremor.so/)

### 開源專案參考
- [Apache Superset](https://github.com/apache/superset)
- [Grafana](https://github.com/grafana/grafana)
- [Metabase](https://github.com/metabase/metabase)
- [Redash](https://github.com/getredash/redash)

---

## 🎉 AI 增强功能 - 已完成

### ✅ Analytics Dashboard (Vite + React)

**完成时间**: 2025-11-18

已实现的 AI 功能:
- ✅ **AI 智能洞察 (AIInsights)**: 使用线性回归分析趋势，Z-score 检测异常，生成业务建议
- ✅ **趋势预测图表 (PredictionChart)**: 基于历史数据预测未来 5 期，显示置信区间
- ✅ **异常检测系统 (AnomalyDetection)**: 使用 Z-score 方法（±2σ）识别异常值，分级警报
- ✅ **AI 服务层 (aiService.ts)**: 统计算法库，包括回归分析、异常检测、相关性分析

**技术亮点**:
- R² 系数评估趋势强度
- 皮尔逊相关系数分析
- 智能推荐引擎
- 梯度背景设计 + 加载动画

**文档**: `analytics-dashboard/AI_ENHANCEMENTS.md`

### ✅ Sales Metrics Dashboard (Next.js)

**完成时间**: 2025-11-18

已实现的 AI 功能:
- ✅ **AI 销售预测 (AISalesForecast)**: 7天销售预测，95% 置信区间，R² 评估
- ✅ **智能推荐系统 (SmartRecommendations)**: 业务洞察 + 产品建议，双标签页设计
- ✅ **AI 销售服务层 (aiSalesService.ts)**: 专业销售分析算法

**核心算法**:
- 线性回归 + 时间序列预测
- 产品表现分析（增长/停滞/下降）
- 区域销售优化建议
- 季节性模式检测
- 营销时机推荐

**业务价值**:
- 风险预警（下降产品识别）
- 机会捕捉（高增长产品）
- 区域优化（市场集中度分析）
- 可执行的行动计划

**文档**: `sales-metrics-dashboard/AI_FEATURES.md`

### 📊 AI 功能统计

| 项目 | AI 组件 | 算法数量 | 代码行数 |
|------|---------|---------|---------|
| analytics-dashboard | 3 | 8 | ~1500 |
| sales-metrics-dashboard | 2 | 10 | ~2000 |
| **总计** | **5** | **18** | **~3500** |

### 🤖 使用的 AI 算法

1. **线性回归** - 趋势分析和预测
2. **Z-score 检测** - 异常值识别
3. **皮尔逊相关** - 变量关系分析
4. **时间序列** - 季节性模式检测
5. **置信区间** - 预测不确定性量化

### 🚀 下一步计划

- [ ] NextJS Dashboard - 实时 AI 分析
- [ ] Admin Panel - AI 驱动的用户行为分析
- [ ] 集成真实机器学习 API
- [ ] ARIMA 时间序列模型
- [ ] 多变量回归分析
- [ ] A/B 测试推荐引擎

---

**最後更新**: 2025-11-18
**狀態**: ✅ 部分完成（2/4 项目已集成 AI）
