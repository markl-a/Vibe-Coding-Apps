# 🚀 產品著陸頁與宣傳頁面
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的高轉換率產品著陸頁、活動宣傳頁面與 SaaS 產品展示網站。

## 📋 專案目標

建立高效能、高轉換率的著陸頁面，快速展示產品價值、吸引潛在客戶並提升轉換率，並充分利用 AI 工具加速設計與開發流程。

## 🤖 AI 增強功能總覽 (NEW!)

本專案的所有著陸頁都已經過 AI 驅動的增強，提供更智能、更互動的用戶體驗：

### ✨ 已實現的 AI 功能

#### 1. **App Download 頁面**
- 🤖 AI 聊天助手 - 智能回答產品相關問題
- 📱 設備自動檢測 - 智能推薦對應平台下載連結
- ✨ 滾動顯示動畫 - 優雅的元素淡入效果
- 🎯 事件追蹤 - 下載按鈕點擊追蹤
- 💬 快速回復 - 預設常見問題選項

#### 2. **Coming Soon 頁面**
- 🌟 動態粒子背景 - 50+ 個動畫粒子
- 🤖 AI 智能預測 - 基於倒計時的產品洞察
- 📊 實時進度追蹤 - 可視化開發階段
- 📤 智能分享 - Web Share API + 剪貼板
- ✉️ 郵件驗證 - 自動格式檢查
- 📈 進度模擬 - 動態更新百分比

#### 3. **SaaS Landing (Next.js)**
- 🤖 AI 聊天機器人 - 完整的對話系統
- 📊 分析追蹤系統 - 頁面瀏覽、滾動、互動追蹤
- ✨ 動畫組件庫 - FadeIn、StaggerChildren
- 💬 打字指示器 - 真實聊天體驗
- 🎯 多平台分析 - GA4、Plausible、Mixpanel 支援
- 🎨 Framer Motion - 流暢的 UI 動畫

### 🎨 技術亮點

- **智能對話系統** - 基於關鍵詞匹配的 AI 回應引擎
- **無縫動畫** - Framer Motion 和 CSS 動畫結合
- **事件追蹤** - 完整的用戶行為分析系統
- **響應式設計** - 所有功能在移動端完美運作
- **零依賴 AI** - 純前端實現，無需後端 API
- **可擴展架構** - 易於集成真實 AI API（OpenAI、Claude 等）

## 🎯 著陸頁類型

### 1. SaaS 產品著陸頁
- Hero Section（首屏區塊）
- 產品特色介紹
- 價格方案
- 客戶見證
- FAQ 常見問題
- CTA（行動呼籲）按鈕
- 免費試用註冊
- 產品展示影片

### 2. App 下載著陸頁
- App 展示圖
- 功能亮點
- 用戶評價
- App Store / Google Play 按鈕
- 螢幕截圖輪播
- 下載統計
- 媒體報導

### 3. 活動宣傳頁面
- 活動倒數計時
- 活動日程
- 講者介紹
- 贊助商展示
- 票券購買
- 地點資訊
- 社群分享

### 4. 課程銷售頁面
- 課程介紹
- 課程大綱
- 講師簡介
- 學員評價
- 價格與優惠
- 購買 CTA
- 保證與退款政策

### 5. 電子書/資源下載頁
- 資源預覽
- 下載表單
- Email 收集
- 社群證明
- 相關資源推薦

### 6. Coming Soon 頁面
- Logo 與標語
- 倒數計時器
- Email 訂閱表單
- 社群媒體連結
- 背景動畫

## 🛠️ 技術棧選項

### Option 1: Next.js + TypeScript (推薦)
```
Frontend:
- Framework: Next.js 14+ (Static Export)
- Language: TypeScript
- Styling: Tailwind CSS
- Animation: Framer Motion
- Forms: React Hook Form
- SEO: next-seo

Deployment:
- Vercel / Netlify
- 極快載入速度
- CDN 分發
```

### Option 2: Astro (極致效能)
```
- Framework: Astro 4+
- Island Architecture
- 零 JavaScript (預設)
- React/Vue (按需載入)
- Tailwind CSS
- 最佳 Lighthouse 分數
```

### Option 3: Webflow / Framer (No-code)
```
- 視覺化設計工具
- 無需編程
- 內建動畫
- CMS 支援
- 快速原型
- 適合非技術團隊
```

### Option 4: HTML + Tailwind (純靜態)
```
- 原生 HTML
- Tailwind CSS
- Alpine.js (輕量互動)
- 零依賴
- 最快載入
- 任意託管
```

## 🚀 快速開始

### Option 1: Next.js 著陸頁

```bash
# 建立 Next.js 專案
npx create-next-app@latest my-landing-page --typescript --tailwind --app

cd my-landing-page

# 安裝依賴
npm install framer-motion
npm install react-hook-form
npm install next-seo
npm install lucide-react
npm install react-intersection-observer

# 啟動開發伺服器
npm run dev
```

### Option 2: 使用 Astro

```bash
# 建立 Astro 專案
npm create astro@latest my-landing-page

cd my-landing-page

# 選擇模板：Blog / Portfolio / Empty
# 安裝 Tailwind CSS
npx astro add tailwind

# 安裝 React（可選）
npx astro add react

# 啟動開發伺服器
npm run dev
```

### Option 3: 使用著陸頁模板

```bash
# 使用 Tailwind UI 或其他模板
git clone https://github.com/cruip/open-react-template.git
cd open-react-template
npm install
npm start
```

## 📁 專案結構（Next.js 範例）

```
landing-pages/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 主著陸頁
│   ├── pricing/
│   │   └── page.tsx                # 價格頁面
│   ├── about/
│   │   └── page.tsx                # 關於我們
│   ├── contact/
│   │   └── page.tsx                # 聯絡頁面
│   └── api/
│       └── subscribe/
│           └── route.ts            # Email 訂閱 API
├── components/
│   ├── sections/
│   │   ├── Hero.tsx                # 首屏區塊
│   │   ├── Features.tsx            # 功能介紹
│   │   ├── Pricing.tsx             # 價格方案
│   │   ├── Testimonials.tsx        # 客戶見證
│   │   ├── FAQ.tsx                 # 常見問題
│   │   ├── CTA.tsx                 # 行動呼籲
│   │   └── Footer.tsx              # 頁尾
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── animations/
│   │   ├── FadeIn.tsx
│   │   ├── SlideIn.tsx
│   │   └── CountUp.tsx
│   └── Header.tsx
├── lib/
│   ├── analytics.ts                # GA / Plausible
│   └── utils.ts
├── public/
│   ├── images/
│   ├── videos/
│   └── favicon.ico
└── styles/
    └── globals.css
```

## 🎨 著陸頁核心區塊

### 1. Hero Section（首屏）

```typescript
// components/sections/Hero.tsx
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 背景圖案 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 標語 */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
          打造你的夢想產品
          <span className="text-blue-600"> 更快更簡單</span>
        </h1>

        {/* 副標題 */}
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          使用 AI 驅動的工具，讓你的想法在幾分鐘內變成現實。
          無需編程經驗，立即開始。
        </p>

        {/* CTA 按鈕 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg px-8 py-4">
            開始免費試用
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-4">
            觀看示範影片
          </Button>
        </div>

        {/* 社群證明 */}
        <p className="mt-8 text-gray-500">
          已有 <span className="font-bold text-gray-900">10,000+</span> 位用戶信賴
        </p>

        {/* 產品截圖 */}
        <div className="mt-16">
          <img
            src="/product-screenshot.png"
            alt="Product Screenshot"
            className="rounded-lg shadow-2xl border border-gray-200"
          />
        </div>
      </div>
    </section>
  )
}
```

### 2. Features Section（功能介紹）

```typescript
// components/sections/Features.tsx
import { Zap, Shield, Smartphone, Cloud } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: '閃電般快速',
    description: '優化的效能讓你的工作效率提升 10 倍'
  },
  {
    icon: Shield,
    title: '安全可靠',
    description: '企業級安全保護，讓你的資料無憂'
  },
  {
    icon: Smartphone,
    title: '跨平台支援',
    description: '在任何裝置上都能完美運作'
  },
  {
    icon: Cloud,
    title: '雲端同步',
    description: '即時同步，隨時隨地訪問你的資料'
  }
]

export const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            強大功能，簡單易用
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            我們提供你所需的一切工具，讓你專注於最重要的事情
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center p-6 rounded-lg hover:bg-gray-50 transition">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Icon className="text-blue-600" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

### 3. Pricing Section（價格方案）

```typescript
// components/sections/Pricing.tsx
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const plans = [
  {
    name: '個人版',
    price: '$9',
    period: '/月',
    features: [
      '5 個專案',
      '10 GB 儲存空間',
      '基本支援',
      '所有核心功能'
    ],
    highlighted: false
  },
  {
    name: '專業版',
    price: '$29',
    period: '/月',
    features: [
      '無限專案',
      '100 GB 儲存空間',
      '優先支援',
      '所有進階功能',
      '團隊協作',
      'API 訪問'
    ],
    highlighted: true
  },
  {
    name: '企業版',
    price: '客製',
    period: '',
    features: [
      '無限專案',
      '無限儲存空間',
      '專屬客服',
      '所有功能',
      'SSO 整合',
      'SLA 保證',
      '客製化開發'
    ],
    highlighted: false
  }
]

export const Pricing = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            選擇適合你的方案
          </h2>
          <p className="text-xl text-gray-600">
            所有方案都包含 14 天免費試用，無需信用卡
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.highlighted ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  最受歡迎
                </span>
              )}

              <h3 className="text-2xl font-bold text-gray-900 mt-4">
                {plan.name}
              </h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="ml-2 text-gray-600">
                  {plan.period}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="text-green-500 mr-3 flex-shrink-0" size={20} />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full mt-8"
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                開始使用
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

### 4. Testimonials（客戶見證）

```typescript
// components/sections/Testimonials.tsx
const testimonials = [
  {
    name: '張小明',
    role: 'CEO, TechCorp',
    avatar: '/avatars/user1.jpg',
    content: '這個產品徹底改變了我們的工作流程，效率提升了 300%！'
  },
  {
    name: '李美麗',
    role: '設計師, DesignStudio',
    avatar: '/avatars/user2.jpg',
    content: '介面設計精美，使用起來非常直觀，我的團隊都很喜歡。'
  },
  {
    name: '王大華',
    role: 'CTO, StartupX',
    avatar: '/avatars/user3.jpg',
    content: '強大的功能加上親民的價格，真的是物超所值！'
  }
]

export const Testimonials = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            用戶怎麼說
          </h2>
          <p className="text-xl text-gray-600">
            聽聽真實用戶的使用體驗
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-8">
              <p className="text-gray-700 text-lg mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

## 🤖 AI 輔助開發建議

### 1. 著陸頁架構設計

```
提示詞範例：
"請設計一個 SaaS 產品著陸頁的完整結構，包含：
- Hero Section（首屏）
- Features（功能介紹）
- Pricing（價格方案）
- Testimonials（客戶見證）
- FAQ（常見問題）
- CTA（行動呼籲）
使用 Next.js 14、TypeScript 和 Tailwind CSS。"
```

### 2. 動畫效果生成

```
提示詞範例：
"請使用 Framer Motion 實作以下動畫效果：
1. 首屏元素淡入動畫
2. 功能卡片滾動時的漸現效果
3. 統計數字的計數動畫
4. 按鈕 hover 效果
使用 React + TypeScript。"
```

### 3. Email 訂閱表單

```
提示詞範例：
"請建立一個 Email 訂閱表單組件，包含：
- Email 輸入驗證
- 送出成功/失敗狀態
- 整合 Mailchimp API
- 載入動畫
- 錯誤處理
使用 React Hook Form + Zod。"
```

### 4. SEO 優化

```
提示詞範例：
"請幫我優化著陸頁的 SEO，包含：
1. Meta 標籤設置
2. Open Graph 標籤
3. JSON-LD 結構化資料
4. Sitemap 生成
5. Robots.txt 配置
使用 Next.js next-seo 套件。"
```

## 📊 開發路線圖

### Phase 1: 基礎設置
- [x] 技術棧選擇
- [x] 專案架構設計
- [ ] 建立專案骨架
- [ ] 設置 Tailwind CSS
- [ ] 安裝動畫庫

### Phase 2: 核心區塊
- [ ] Hero Section
- [ ] Features Section
- [ ] Pricing Section
- [ ] Testimonials Section
- [ ] FAQ Section
- [ ] Footer

### Phase 3: 互動功能
- [ ] Email 訂閱表單
- [ ] 聯絡表單
- [ ] CTA 按鈕
- [ ] 動畫效果

### Phase 4: 優化與部署
- [ ] SEO 優化
- [ ] 效能優化（Lighthouse 95+）
- [ ] 響應式設計
- [ ] A/B 測試設置
- [ ] 部署到 Vercel

## 🔥 進階功能建議

### 1. 滾動動畫

```typescript
// components/animations/FadeIn.tsx
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export const FadeIn = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}
```

### 2. 計數動畫

```typescript
// components/animations/CountUp.tsx
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

export const CountUp = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true })

  useEffect(() => {
    if (!inView) return

    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [inView, end, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}
```

### 3. 倒數計時器

```typescript
// components/CountdownTimer.tsx
import { useEffect, useState } from 'react'

export const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="flex gap-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-4xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{unit}</div>
        </div>
      ))}
    </div>
  )
}
```

### 4. A/B 測試

```typescript
// lib/abTest.ts
export const getVariant = (testId: string): 'A' | 'B' => {
  const stored = localStorage.getItem(`ab-test-${testId}`)
  if (stored) return stored as 'A' | 'B'

  const variant = Math.random() < 0.5 ? 'A' : 'B'
  localStorage.setItem(`ab-test-${testId}`, variant)

  // 追蹤事件
  analytics.track('AB Test Assigned', {
    testId,
    variant
  })

  return variant
}

// 使用範例
const variant = getVariant('hero-cta')
const ctaText = variant === 'A' ? '開始免費試用' : '立即體驗'
```

## 📱 響應式設計檢查清單

- [ ] 手機版（320px - 640px）
- [ ] 平板版（640px - 1024px）
- [ ] 桌面版（1024px+）
- [ ] 觸控友善
- [ ] 圖片優化（WebP）
- [ ] 字體大小適配
- [ ] 間距調整

## 🎯 轉換率優化（CRO）

### 1. 優化 CTA 按鈕
- 使用行動導向文字
- 顏色對比鮮明
- 大小適中易點擊
- 放置在關鍵位置

### 2. 社群證明
- 客戶 Logo 牆
- 使用者數量
- 評分與評論
- 媒體報導

### 3. 緊迫感
- 限時優惠
- 剩餘名額
- 倒數計時

### 4. 信任元素
- 安全認證標章
- 退款保證
- 隱私政策
- 聯絡資訊

## 🚀 部署與 SEO

### Vercel 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### SEO 配置

```typescript
// app/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '產品名稱 - 簡短描述',
  description: '產品的詳細描述，包含關鍵字',
  keywords: ['關鍵字1', '關鍵字2', '關鍵字3'],
  openGraph: {
    type: 'website',
    url: 'https://your-domain.com',
    title: '產品名稱',
    description: '產品描述',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: '產品名稱',
    description: '產品描述',
    images: ['https://your-domain.com/twitter-image.jpg']
  }
}
```

### Analytics 整合

```typescript
// lib/analytics.ts
export const trackEvent = (eventName: string, properties?: any) => {
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }

  // Plausible
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props: properties })
  }
}

// 使用範例
trackEvent('cta_clicked', { location: 'hero' })
```

## 🤝 貢獻與改進

歡迎提出改進建議！可以協助的方向：

- 🎨 設計優化
- 📊 轉換率提升
- ⚡ 效能優化
- 📱 移動端體驗
- 🔍 SEO 改善

## 📄 授權

MIT License

## 🔗 相關資源

### 設計靈感
- [Dribbble - Landing Pages](https://dribbble.com/tags/landing_page)
- [Awwwards](https://www.awwwards.com/)
- [Land-book](https://land-book.com/)
- [SaaS Landing Page](https://saaslandingpage.com/)

### 開源模板
- [Cruip Templates](https://cruip.com/)
- [Tailwind UI](https://tailwindui.com/)
- [Flowbite](https://flowbite.com/)
- [HyperUI](https://www.hyperui.dev/)

### 工具
- [v0.dev](https://v0.dev/) - AI 生成 UI
- [Framer](https://www.framer.com/) - 設計工具
- [Figma](https://www.figma.com/) - 設計協作
- [Webflow](https://webflow.com/) - No-code 建站

## 🚀 快速開始使用 AI 功能

### App Download 頁面

1. 打開 `app-download/index.html`
2. AI 聊天助手會在右下角自動顯示
3. 點擊聊天圖標開始對話
4. 設備檢測會在頁面載入後 1.5 秒自動觸發

### Coming Soon 頁面

1. 打開 `coming-soon/index.html`
2. 粒子背景會自動生成
3. AI 預測會在 2 秒後顯示
4. 修改 `targetDate` 變量設置上線日期

### SaaS Landing (Next.js)

```bash
cd saas-landing
npm install
npm run dev
```

1. AI 聊天機器人在右下角
2. 所有互動自動追蹤到控制台
3. 可在 `src/lib/analytics.ts` 配置真實分析服務

## 🔧 自定義 AI 功能

### 集成真實 AI API

將模擬的 AI 回應替換為真實 API：

```javascript
// 示例：集成 OpenAI
async function getAIResponse(message) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }]
    })
  });
  return await response.json();
}
```

### 自定義 AI 回應

編輯各頁面中的 `aiResponses` 或 `AI_RESPONSES` 對象：

```javascript
const aiResponses = {
  '你的關鍵詞': '你的自定義回應',
  // 添加更多...
}
```

## 📊 分析配置

在 `saas-landing/src/lib/analytics.ts` 中啟用你的分析服務：

```typescript
// Google Analytics
if (window.gtag) {
  window.gtag('event', eventName, properties)
}

// Plausible
if (window.plausible) {
  window.plausible(eventName, { props: properties })
}
```

## 🎯 最佳實踐

### AI 聊天助手
- ✅ 保持回應簡潔（2-5 句話）
- ✅ 提供快速回復選項
- ✅ 包含行動呼籲（CTA）
- ✅ 追蹤對話流程

### 動畫效果
- ✅ 使用 `prefers-reduced-motion` 尊重用戶偏好
- ✅ 保持動畫時長在 0.3-0.6 秒
- ✅ 使用 easing 函數讓動畫更自然
- ✅ 避免過度動畫影響效能

### 事件追蹤
- ✅ 追蹤關鍵用戶行為
- ✅ 保護用戶隱私
- ✅ 遵守 GDPR/CCPA 規範
- ✅ 提供退出選項

---

**最後更新**: 2025-11-18
**狀態**: ✅ AI 增強版已完成
