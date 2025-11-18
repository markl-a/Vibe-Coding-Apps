# Coming Soon 頁面

精美的 Coming Soon（即將推出）頁面，包含倒數計時器和 Email 訂閱功能。

## 特色功能

- 🎨 美麗的漸層背景
- ⏱️ 即時倒數計時器
- 📧 Email 訂閱表單
- 🔗 社群媒體連結
- 📱 完全響應式設計
- ✨ 浮動動畫效果
- 🎯 極簡設計風格

### 🤖 AI 增強功能 (NEW!)

- 🌟 **動態粒子背景** - 50+ 個動畫粒子創造沉浸式體驗
- 🤖 **AI 智能預測** - 根據倒計時自動生成個性化產品洞察
- 📊 **實時進度追蹤** - 可視化開發進度（設計、開發、測試、部署）
- 📤 **智能分享** - 支援 Web Share API 和剪貼板複製
- ✉️ **郵件驗證** - 內建 Email 格式驗證
- 📈 **進度模擬** - 動態更新開發進度百分比
- 🎯 **事件追蹤** - 內建分析追蹤系統
- 💫 **入場動畫** - 優雅的頁面載入效果

## 技術棧

- **HTML5**: 語義化標記
- **Tailwind CSS**: 通過 CDN 載入
- **Vanilla JavaScript**: 無依賴

## 專案結構

```
coming-soon/
├── index.html          # 主頁面（包含所有程式碼）
└── README.md           # 專案文檔
```

## 功能說明

### 1. 倒數計時器

顯示距離產品上線的剩餘時間（天、時、分、秒）。

**修改目標日期**：

```javascript
// 在 index.html 中找到這行並修改日期
const targetDate = new Date('2025-12-31T23:59:59').getTime();
```

### 2. Email 訂閱表單

收集訪客的 Email 地址，以便在產品上線時通知他們。

**整合後端 API**：

```javascript
document.getElementById('subscribeForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;

  // 發送到你的後端 API
  const response = await fetch('YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  // 處理回應...
});
```

### 3. 社群媒體連結

在頁面底部顯示社群媒體圖標。

**修改連結**：

```html
<!-- 在 index.html 中找到這些連結並修改 href -->
<a href="https://twitter.com/yourhandle" ...>
<a href="https://github.com/yourusername" ...>
<a href="https://linkedin.com/in/yourprofile" ...>
```

## 自訂設定

### 修改顏色主題

在 `<script>` 標籤中修改 Tailwind 配置：

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#0ea5e9',  // 修改主色調
        }
      }
    }
  }
</script>
```

或直接修改 CSS 中的漸層：

```css
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* 改成你想要的顏色 */
}
```

### 修改文字內容

直接在 HTML 中找到對應的文字並修改：

```html
<h1 class="...">即將推出</h1>
<p class="...">我們正在打造令人驚艷的產品。敬請期待！</p>
```

## 部署

### 方法 1: GitHub Pages

1. 創建 GitHub 倉庫
2. 上傳 `index.html`
3. 在 Settings > Pages 中啟用 GitHub Pages
4. 選擇 main 分支作為來源

### 方法 2: Netlify

1. 將 `index.html` 放在專案根目錄
2. 拖放整個文件夾到 [Netlify Drop](https://app.netlify.com/drop)
3. 立即部署完成

### 方法 3: Vercel

```bash
npm i -g vercel
vercel
```

### 方法 4: 任意 Web 伺服器

直接將 `index.html` 上傳到任何支援靜態網站的伺服器。

## Email 訂閱整合方案

### 選項 1: Mailchimp

```html
<!-- 使用 Mailchimp 嵌入表單 -->
<form action="https://yoursite.us1.list-manage.com/subscribe/post" method="POST">
  <input type="hidden" name="u" value="YOUR_USER_ID">
  <input type="hidden" name="id" value="YOUR_LIST_ID">
  <input type="email" name="MERGE0" placeholder="Email">
  <button type="submit">訂閱</button>
</form>
```

### 選項 2: ConvertKit

整合 ConvertKit 的 API 端點。

### 選項 3: 自建後端

使用 Node.js、Python、PHP 等建立簡單的 API 來儲存 Email 到資料庫。

### 選項 4: Google Sheets

使用 Google Apps Script 將 Email 儲存到 Google Sheets。

## 進階功能建議

### 添加背景粒子效果

使用 [particles.js](https://vincentgarreau.com/particles.js/) 庫。

### 添加視差滾動

使用 [Rellax.js](https://dixonandmoe.com/rellax/) 庫。

### 添加音樂背景

```html
<audio autoplay loop>
  <source src="background-music.mp3" type="audio/mpeg">
</audio>
```

## 瀏覽器支援

- ✅ Chrome (最新)
- ✅ Firefox (最新)
- ✅ Safari (最新)
- ✅ Edge (最新)
- ✅ Mobile Browsers

## 效能優化

- ⚡ 使用 CDN 載入 Tailwind CSS
- ⚡ 單一 HTML 文件，無額外請求
- ⚡ 輕量級 JavaScript
- ⚡ 快速載入時間

## 授權

MIT License

---

**最後更新**: 2025-11-16
