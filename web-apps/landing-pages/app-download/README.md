# App 下載著陸頁

專業的 App 下載著陸頁，展示移動應用的功能和優勢，引導用戶下載。

## 特色功能

- 📱 手機 Mockup 展示
- 🎨 現代化設計風格
- 📊 數據統計展示
- ⭐ 用戶評價區塊
- 📸 App 截圖展示
- 🔗 App Store / Google Play 下載按鈕
- 📱 完全響應式設計
- ⚡ 純 HTML + Tailwind CSS

## 技術棧

- **HTML5**: 語義化標記
- **Tailwind CSS**: 通過 CDN 載入
- **無 JavaScript**: 純靜態頁面

## 專案結構

```
app-download/
├── index.html          # 主頁面
└── README.md           # 專案文檔
```

## 頁面區塊

### 1. Header（頂部導航）
- 品牌 Logo
- 導航連結
- 下載按鈕

### 2. Hero Section（首屏）
- 吸引人的標題
- 產品描述
- App Store / Google Play 按鈕
- 手機 Mockup 展示
- 統計數據（下載量、評分等）

### 3. Features（功能介紹）
- 6 個主要功能亮點
- 圖標 + 標題 + 描述
- 網格佈局

### 4. Screenshots（App 截圖）
- 4 個 App 截圖展示
- 圓角卡片設計
- 不同功能頁面預覽

### 5. Reviews（用戶評價）
- 真實用戶評論
- 5 星評分展示
- 用戶頭像和資訊

### 6. Download CTA（下載行動呼籲）
- 醒目的背景顏色
- 再次強調下載按鈕
- 系統版本支援資訊

### 7. Footer（頁尾）
- 網站地圖
- 支援連結
- 版權資訊

## 自訂設定

### 修改 App Store 連結

```html
<!-- iOS App Store -->
<a href="https://apps.apple.com/app/YOUR_APP_ID" ...>

<!-- Google Play Store -->
<a href="https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME" ...>
```

### 修改顏色主題

在 `<script>` 標籤中修改 Tailwind 配置：

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#3b82f6',  // 修改主色調
        }
      }
    }
  }
</script>
```

### 修改統計數據

```html
<div class="grid grid-cols-3 gap-6">
  <div>
    <div class="text-3xl font-bold text-gray-900">500K+</div>
    <div class="text-gray-600 text-sm">下載次數</div>
  </div>
  <!-- 修改這裡的數字和文字 -->
</div>
```

### 添加真實的 App 截圖

將手機 Mockup 中的漸層背景替換為真實截圖：

```html
<div class="aspect-[9/16] bg-white rounded-2xl shadow-lg overflow-hidden">
  <img src="screenshot-1.png" alt="App Screenshot" class="w-full h-full object-cover">
</div>
```

## 部署

### GitHub Pages

1. 上傳到 GitHub 倉庫
2. 在 Settings > Pages 中啟用
3. 選擇分支和目錄

### Netlify

直接拖放文件夾到 [Netlify Drop](https://app.netlify.com/drop)

### Vercel

```bash
npm i -g vercel
vercel
```

## 進階功能建議

### 1. 添加 QR Code

讓桌面用戶掃描下載：

```html
<div class="text-center">
  <img src="qr-code.png" alt="掃描下載" class="w-32 h-32 mx-auto">
  <p class="text-sm text-gray-600 mt-2">掃描 QR Code 下載</p>
</div>
```

### 2. 自動檢測設備

根據用戶設備顯示對應的下載按鈕：

```html
<script>
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  if (isIOS) {
    document.getElementById('androidBtn').style.display = 'none';
  } else if (isAndroid) {
    document.getElementById('iosBtn').style.display = 'none';
  }
</script>
```

### 3. 添加影片展示

嵌入 YouTube 或 Vimeo 影片：

```html
<div class="aspect-video">
  <iframe
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
    class="w-full h-full rounded-lg"
    allowfullscreen
  ></iframe>
</div>
```

### 4. 整合分析工具

添加 Google Analytics 或其他分析工具：

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 5. 追蹤下載按鈕點擊

```html
<a
  href="https://apps.apple.com/..."
  onclick="gtag('event', 'click', {'event_category': 'download', 'event_label': 'ios'});"
>
  App Store
</a>
```

## 設計資源

### 手機 Mockup

- [MockuPhone](https://mockuphone.com/)
- [Smartmockups](https://smartmockups.com/)
- [Device Frames](https://deviceframes.com/)

### App 截圖工具

- [Screenshots.pro](https://screenshots.pro/)
- [AppLaunchpad](https://theapplaunchpad.com/)
- [App Screenshot Builder](https://www.appstorescreenshot.com/)

### 圖標資源

- [Lucide Icons](https://lucide.dev/)
- [Heroicons](https://heroicons.com/)
- [Feather Icons](https://feathericons.com/)

## App Store 優化（ASO）建議

### Meta 標籤

```html
<meta name="description" content="下載 VibeCoding App - 你的移動生產力夥伴">
<meta name="keywords" content="productivity app, mobile app, task manager">

<!-- Open Graph -->
<meta property="og:title" content="VibeCoding App - 下載頁面">
<meta property="og:description" content="...">
<meta property="og:image" content="og-image.jpg">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="VibeCoding App">
```

### Smart App Banner（iOS）

```html
<meta name="apple-itunes-app" content="app-id=YOUR_APP_ID">
```

### Google Play App Install Banner（Android）

```html
<link rel="manifest" href="manifest.json">
```

## 轉換率優化

### A/B 測試建議

- 測試不同的 CTA 按鈕文字
- 測試不同的顏色方案
- 測試不同的截圖排列
- 測試有/無用戶評價的影響

### 信任元素

- 顯示下載數量
- 顯示用戶評分
- 顯示媒體報導
- 顯示獎項徽章

## 瀏覽器支援

- ✅ Chrome (最新)
- ✅ Firefox (最新)
- ✅ Safari (最新)
- ✅ Edge (最新)
- ✅ Mobile Browsers

## 授權

MIT License

---

**最後更新**: 2025-11-16
