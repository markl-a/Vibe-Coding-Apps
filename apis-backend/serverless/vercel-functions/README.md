# Vercel Functions 示例 ⚡
🤖 **AI-Driven Serverless Functions** 🚀

使用 Vercel Functions 構建的無伺服器 API 示例。

## 📋 API 端點

### GET /api/hello
簡單的 Hello World 端點

**回應範例**:
```json
{
  "message": "Hello from Vercel Functions!",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "method": "GET",
  "query": {}
}
```

### GET /api/users
獲取用戶列表

**回應範例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ]
}
```

### POST /api/users
創建新用戶

**請求範例**:
```json
{
  "name": "Alice Johnson",
  "email": "alice@example.com"
}
```

### GET /api/weather
獲取天氣資訊

**查詢參數**:
- `city` - 城市名稱 (預設: London)
- `units` - 溫度單位 (metric/imperial)

### GET /api/posts
獲取文章列表 (支援分頁和標籤過濾)

**查詢參數**:
- `page` - 頁碼
- `limit` - 每頁數量
- `tag` - 標籤過濾
- `id` - 獲取單篇文章

### POST /api/posts
創建新文章

### POST /api/qrcode
生成 QR Code

**請求範例**:
```json
{
  "text": "https://example.com",
  "size": 200
}
```

### POST /api/shorten
縮短網址

**請求範例**:
```json
{
  "url": "https://very-long-url.com/..."
}
```

### POST /api/analytics
追蹤分析事件

**請求範例**:
```json
{
  "event": "page_view",
  "properties": {
    "page": "/home"
  }
}
```

## 🚀 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
# 或
vercel dev
```

伺服器將在 `http://localhost:3000` 啟動

## 📦 部署到 Vercel

```bash
# 首次部署
vercel

# 生產環境部署
vercel --prod
```

## 📂 專案結構

```
vercel-functions/
├── api/
│   ├── hello.js       # GET /api/hello
│   ├── users.js       # GET/POST /api/users
│   ├── weather.js     # GET /api/weather
│   ├── posts.js       # GET/POST /api/posts
│   ├── qrcode.js      # POST /api/qrcode
│   ├── shorten.js     # GET/POST /api/shorten
│   └── analytics.js   # GET/POST /api/analytics
├── package.json
├── .env.example
└── README.md
```

## 🔑 環境變數

在 Vercel Dashboard 或 `.env.local` 中設定：

```
API_KEY=your-api-key
DATABASE_URL=your-database-url
```

在函數中使用：
```javascript
const apiKey = process.env.API_KEY;
```

## 📚 更多資源

- [Vercel Functions 文檔](https://vercel.com/docs/functions)
- [API Routes](https://vercel.com/docs/functions/serverless-functions)

---

**使用 AI 快速開發 Serverless API！** 🚀
