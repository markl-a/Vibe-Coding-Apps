# 內容管理系統微服務架構 📝
🤖 **AI-Driven CMS Platform** 🚀

完整的內容管理系統微服務架構，展示如何構建可擴展的 CMS 平台。

## 🏗️ 架構概覽

```
┌─────────────┐
│   客戶端    │ ← Web/Mobile/API
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ ← 統一入口、認證
└──────┬──────┘
       │
   ┌───┴───┬────────┬────────┐
   ▼       ▼        ▼        ▼
┌───────┐┌───────┐┌────────┐┌───────┐
│Content││Media  ││Search  ││Cache  │
│Service││Service││Service ││Service│
└───┬───┘└───┬───┘└────┬───┘└───┬───┘
    │        │         │         │
    ▼        ▼         ▼         ▼
┌───────┐┌───────┐┌────────┐┌───────┐
│MongoDB││S3/Minio│Elasticsearch│Redis  │
└───────┘└───────┘└────────┘└───────┘
```

## 📦 服務列表

### 1. API Gateway (Port 6000)
- 統一入口點
- JWT 認證
- 路由轉發
- 速率限制
- CORS 配置

### 2. Content Service (Port 6001)
- 文章 CRUD
- 頁面管理
- 分類與標籤
- 版本控制
- 內容發布流程

### 3. Media Service (Port 6002)
- 文件上傳
- 圖片處理
- 視頻管理
- 文件存儲 (S3/MinIO)
- CDN 集成

### 4. Search Service (Port 6003)
- 全文搜索
- 內容索引
- 搜索建議
- 高級過濾
- Elasticsearch 集成

### 5. Cache Service (Port 6004)
- 內容緩存
- 查詢緩存
- 會話管理
- Redis 緩存策略

## 🚀 快速開始

### 使用 Docker Compose

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f [service-name]

# 停止服務
docker-compose down
```

### 本地開發

```bash
cd content-service
npm install
npm run dev
```

## 🔧 環境變數

```env
# API Gateway
PORT=6000
JWT_SECRET=your-jwt-secret

# Content Service
MONGODB_URI=mongodb://localhost:27017/cms_content

# Media Service
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=media

# Search Service
ELASTICSEARCH_URL=http://localhost:9200

# Cache Service
REDIS_URL=redis://localhost:6379
```

## 📖 API 文檔

所有請求通過 API Gateway: `http://localhost:6000`

### 認證
- POST `/api/auth/login` - 登入獲取 JWT

### 內容管理
- GET `/api/content` - 獲取內容列表
- GET `/api/content/:id` - 獲取單個內容
- POST `/api/content` - 創建內容
- PUT `/api/content/:id` - 更新內容
- DELETE `/api/content/:id` - 刪除內容
- POST `/api/content/:id/publish` - 發布內容

### 媒體管理
- POST `/api/media/upload` - 上傳文件
- GET `/api/media/:id` - 獲取文件信息
- DELETE `/api/media/:id` - 刪除文件
- GET `/api/media/list` - 獲取文件列表

### 搜索
- GET `/api/search?q=keyword` - 搜索內容
- GET `/api/search/suggest?q=key` - 搜索建議

### 緩存
- GET `/api/cache/:key` - 獲取緩存
- POST `/api/cache/:key` - 設置緩存
- DELETE `/api/cache/:key` - 刪除緩存

## 🛡️ 安全特性

- ✅ JWT 認證
- ✅ 角色權限控制
- ✅ 輸入驗證
- ✅ XSS 防護
- ✅ SQL 注入防護
- ✅ CSRF 保護
- ✅ 文件類型驗證

## 📊 內容類型

1. **文章 (Article)**
   - 標題、內容、摘要
   - 作者、分類、標籤
   - SEO 元數據
   - 發布狀態

2. **頁面 (Page)**
   - 靜態頁面
   - 自定義模板
   - URL 路徑

3. **媒體 (Media)**
   - 圖片、視頻、文檔
   - 元數據、標籤
   - 訪問權限

## 💾 數據存儲

- **MongoDB**: 內容、頁面、用戶數據
- **MinIO/S3**: 媒體文件存儲
- **Elasticsearch**: 全文搜索索引
- **Redis**: 緩存、會話

## 📈 功能特性

- ✅ 多語言支持
- ✅ 版本控制
- ✅ 內容排程發布
- ✅ SEO 優化
- ✅ 響應式圖片
- ✅ CDN 支持
- ✅ 內容審核流程
- ✅ 權限管理

## 🧪 測試

```bash
# 運行測試
npm test

# 運行集成測試
npm run test:integration

# 測試覆蓋率
npm run test:coverage
```

## 📝 最佳實踐

1. **內容管理**
   - 使用草稿功能
   - 定期備份
   - 版本控制

2. **媒體管理**
   - 圖片優化
   - 懶加載
   - CDN 加速

3. **性能優化**
   - 緩存策略
   - 數據庫索引
   - 查詢優化

4. **安全性**
   - 定期更新依賴
   - 安全審計
   - 訪問日誌

## 🔌 客戶端集成示例

### JavaScript/React

```javascript
const API_URL = 'http://localhost:6000';
const token = 'your-jwt-token';

// 獲取文章列表
async function getArticles() {
  const response = await fetch(`${API_URL}/api/content?type=article`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// 創建文章
async function createArticle(data) {
  const response = await fetch(`${API_URL}/api/content`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

// 上傳圖片
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return await response.json();
}
```

## 📚 擴展功能

- [ ] 多站點管理
- [ ] A/B 測試
- [ ] 個性化推薦
- [ ] 評論系統
- [ ] 社交媒體集成
- [ ] 電子郵件通知
- [ ] 工作流引擎
- [ ] 數據分析儀表板

## 🎨 支持的內容格式

- **文本**: Markdown, HTML, Plain Text
- **圖片**: JPEG, PNG, GIF, WebP, SVG
- **視頻**: MP4, WebM, OGV
- **文檔**: PDF, DOCX, XLSX

## 🌐 多語言支持

```javascript
// 內容結構示例
{
  "title": {
    "en": "Welcome",
    "zh": "歡迎",
    "ja": "ようこそ"
  },
  "content": {
    "en": "Welcome to our website",
    "zh": "歡迎來到我們的網站",
    "ja": "私たちのウェブサイトへようこそ"
  }
}
```

---

**使用 AI 構建現代化內容管理系統！** 🚀
