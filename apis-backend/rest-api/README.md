# REST API 專案 (RESTful API Projects)
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的 RESTful API 服務專案集合。

## 📋 目錄

- [什麼是 REST API](#什麼是-rest-api)
- [🆕 AI 增強功能](#-ai-增強功能)
- [技術棧選擇](#技術棧選擇)
- [專案範例](#專案範例)
- [開發指南](#開發指南)
- [AI 輔助開發建議](#ai-輔助開發建議)
- [最佳實踐](#最佳實踐)

---

## 🆕 AI 增強功能

我們的 REST API 專案已經整合了強大的 AI 功能，讓你的 API 更智能、更實用！

### ✨ 已實現的 AI 功能

#### 🌤️ Weather API - 智能天氣助手
- **智能建議系統**: 根據天氣提供穿衣、活動、健康、出行建議
- **空氣質量監測**: AQI 指數分析和健康建議
- **舒適度計算**: 綜合溫濕度的智能舒適度評分
- **完整報告**: 一次性獲取天氣 + AI 建議 + 空氣質量

```python
# 範例：獲取 AI 天氣建議
GET /api/v1/ai/weather-advice?city=Taipei
```

#### 📝 Task Manager API - 智能任務管理
- **優先級建議**: 基於內容和截止日期的智能優先級推薦
- **分類建議**: 自動識別任務類別
- **任務統計**: 完成率、生產力洞察、過期任務分析
- **每日推薦**: Must/Should/Can Do 智能分類
- **時間估算**: 預估任務所需時間

```javascript
// 範例：分析任務
POST /api/ai/analyze-task
{
  "title": "緊急修復bug",
  "description": "生產環境系統崩潰"
}
```

### 📊 功能對比

| 功能 | Weather API | Task Manager API |
|-----|-------------|-----------------|
| AI 建議 | ✅ | ✅ |
| 統計分析 | ✅ | ✅ |
| 智能推薦 | ✅ | ✅ |
| 測試套件 | ✅ | ✅ |
| 生產就緒 | ✅ | ✅ |

### 🚀 快速開始使用 AI 功能

1. **配置 AI 功能**（可選）
   ```env
   ENABLE_AI_FEATURES=true
   OPENAI_API_KEY=your_key  # 可選：啟用 GPT
   ```

2. **運行 AI 測試**
   ```bash
   # Weather API
   python examples/test-ai-features.py

   # Task Manager API
   node examples/test-ai-features.js
   ```

3. **查看完整文檔**
   - [AI 增強功能詳細文檔](./ENHANCEMENTS.md)

---

## 🎯 什麼是 REST API

REST (Representational State Transfer) 是一種軟體架構風格，用於設計網路應用程式的 API。RESTful API 使用 HTTP 方法來執行 CRUD 操作：

- **GET** - 讀取資源
- **POST** - 創建資源
- **PUT/PATCH** - 更新資源
- **DELETE** - 刪除資源

### REST API 的特點

✅ **無狀態 (Stateless)** - 每個請求都包含所需的所有資訊
✅ **可快取 (Cacheable)** - 回應可以被快取以提高性能
✅ **統一介面 (Uniform Interface)** - 標準化的 HTTP 方法
✅ **分層系統 (Layered System)** - 可以使用中介層如負載平衡器
✅ **客戶端-伺服器分離** - 前後端解耦

---

## 🛠️ 技術棧選擇

### Node.js 生態系統 ⭐⭐⭐⭐⭐

#### 1. Express.js
- **難度**: ⭐⭐
- **特點**: 輕量、靈活、生態豐富
- **適用**: 中小型專案、快速原型
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 2. NestJS
- **難度**: ⭐⭐⭐
- **特點**: TypeScript、模組化、企業級
- **適用**: 大型專案、團隊協作
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 3. Fastify
- **難度**: ⭐⭐⭐
- **特點**: 高性能、低開銷、Schema 驗證
- **適用**: 性能要求高的應用
- **AI 友好度**: ⭐⭐⭐⭐

### Python 生態系統 ⭐⭐⭐⭐⭐

#### 1. FastAPI
- **難度**: ⭐⭐
- **特點**: 快速、現代、自動文檔、型別提示
- **適用**: 數據 API、ML 模型服務
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 2. Flask
- **難度**: ⭐⭐
- **特點**: 微框架、輕量、靈活
- **適用**: 小型專案、快速開發
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 3. Django REST Framework
- **難度**: ⭐⭐⭐
- **特點**: 全功能、ORM、管理後台
- **適用**: 複雜業務邏輯、內容管理
- **AI 友好度**: ⭐⭐⭐⭐

### Go 生態系統 ⭐⭐⭐⭐

#### 1. Gin
- **難度**: ⭐⭐⭐
- **特點**: 高性能、輕量、快速
- **適用**: 高併發、微服務
- **AI 友好度**: ⭐⭐⭐⭐

#### 2. Echo / Fiber
- **難度**: ⭐⭐⭐
- **特點**: Express 風格、易用
- **適用**: 快速開發、性能優先
- **AI 友好度**: ⭐⭐⭐⭐

### 其他選擇

- **Rust (Actix-web)** - 極致性能、記憶體安全
- **Java (Spring Boot)** - 企業級、成熟生態
- **Ruby (Rails/Sinatra)** - 開發效率高

---

## 📁 專案範例

> 📖 **查看完整的 AI 增強功能**: [ENHANCEMENTS.md](./ENHANCEMENTS.md)

### 1️⃣ [task-manager-api](./task-manager-api) ✨ **AI Enhanced**
**技術**: Express.js + MongoDB
**功能**: 任務管理系統 API
- 用戶註冊 / 登入 (JWT 認證)
- 任務 CRUD 操作
- 任務分類與標籤
- 任務搜尋與篩選
- 用戶權限管理
- 🤖 **AI 功能**:
  - 智能優先級建議
  - 任務統計和洞察
  - 每日任務推薦
  - 任務分類建議
  - 生產力分析

**難度**: ⭐⭐⭐
**狀態**: ✅ 生產就緒

### 2️⃣ [blog-api](./blog-api)
**技術**: NestJS + PostgreSQL
**功能**: 部落格系統後端 API
- 文章管理 (CRUD)
- 分類與標籤系統
- 評論系統
- 用戶權限 (作者、編輯、管理員)
- 文章搜尋與分頁
- 圖片上傳

**難度**: ⭐⭐⭐⭐

### 3️⃣ [ecommerce-api](./ecommerce-api)
**技術**: FastAPI + PostgreSQL
**功能**: 電商平台後端 API
- 商品管理
- 購物車系統
- 訂單處理
- 用戶認證
- 支付整合 (Stripe)
- 庫存管理

**難度**: ⭐⭐⭐⭐⭐

### 4️⃣ [weather-api](./weather-api) ✨ **AI Enhanced**
**技術**: Flask + Redis
**功能**: 天氣資訊聚合 API
- 第三方 API 整合
- 資料快取 (Redis)
- 地理位置查詢
- 歷史數據記錄
- 速率限制
- 🤖 **AI 功能**:
  - 智能天氣建議（穿衣、活動、健康、出行）
  - 空氣質量指數 (AQI) 分析
  - 舒適度指數計算
  - 完整天氣報告

**難度**: ⭐⭐
**狀態**: ✅ 生產就緒

### 5️⃣ [file-storage-api](./file-storage-api)
**技術**: Go (Gin) + S3
**功能**: 檔案儲存服務 API
- 檔案上傳 / 下載
- 檔案分享連結
- 存儲空間管理
- 圖片縮圖生成
- 檔案加密

**難度**: ⭐⭐⭐⭐

---

## 🚀 開發指南

### 快速開始

#### Express.js 範例

```bash
# 創建專案
mkdir my-rest-api && cd my-rest-api
npm init -y

# 安裝依賴
npm install express cors dotenv mongoose
npm install -D nodemon

# 創建基本結構
mkdir src
mkdir src/routes src/controllers src/models src/middleware
```

基本 Express 伺服器：

```javascript
// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());

// 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### FastAPI 範例

```bash
# 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝 FastAPI
pip install fastapi uvicorn sqlalchemy pydantic

# 創建專案結構
mkdir app
mkdir app/models app/routes app/schemas
```

基本 FastAPI 伺服器：

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="My REST API")

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/api/health")
def health_check():
    return {"status": "OK"}

# 運行: uvicorn app.main:app --reload
```

---

## 🤖 AI 輔助開發建議

### 1. 專案架構設計

**提示範例**:
```
"幫我設計一個任務管理 API 的架構，使用 Express.js 和 MongoDB，
包含用戶認證、任務 CRUD、權限管理。請提供資料夾結構和主要模組說明。"
```

AI 可以幫助：
- 設計資料庫 Schema
- 規劃 API 端點
- 建議中間件使用
- 推薦最佳實踐

### 2. 快速生成程式碼

**提示範例**:
```
"幫我創建一個 Express.js 的 User Controller，包含註冊、登入、
取得個人資料的功能，使用 JWT 進行認證。"
```

AI 可以生成：
- Controller 邏輯
- Model 定義
- 路由設定
- 驗證中間件

### 3. 錯誤處理與驗證

**提示範例**:
```
"為這個 API 端點添加輸入驗證和錯誤處理，
使用 express-validator，並提供清晰的錯誤訊息。"
```

AI 可以協助：
- 輸入驗證邏輯
- 錯誤處理中間件
- 統一錯誤回應格式
- 日誌記錄

### 4. 數據庫操作優化

**提示範例**:
```
"優化這個 MongoDB 查詢，添加索引和分頁，
避免 N+1 問題，提升性能。"
```

AI 可以幫助：
- 查詢優化
- 索引建議
- 關聯查詢處理
- 資料庫連接池設定

### 5. API 文檔生成

**提示範例**:
```
"為這些 API 端點生成 Swagger/OpenAPI 文檔，
包含請求參數、回應格式、錯誤碼說明。"
```

AI 可以生成：
- OpenAPI/Swagger 規格
- API 使用範例
- 錯誤碼文檔
- Postman Collection

---

## 📖 最佳實踐

### 1. API 設計原則

#### 使用正確的 HTTP 方法
```
GET    /api/users          # 取得用戶列表
GET    /api/users/:id      # 取得單一用戶
POST   /api/users          # 創建用戶
PUT    /api/users/:id      # 完整更新用戶
PATCH  /api/users/:id      # 部分更新用戶
DELETE /api/users/:id      # 刪除用戶
```

#### 使用有意義的資源名稱
✅ `/api/users` (複數名詞)
❌ `/api/getUsers` (動詞)

#### 版本控制
```
/api/v1/users
/api/v2/users
```

### 2. 回應格式標準化

#### 成功回應
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe"
  },
  "message": "User retrieved successfully"
}
```

#### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with id 123 not found",
    "details": {}
  }
}
```

### 3. 認證與授權

#### JWT Token 認證
```javascript
// 中間件範例
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    next();
  });
};
```

### 4. 輸入驗證

```javascript
// 使用 express-validator
const { body, validationResult } = require('express-validator');

app.post('/api/users',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 處理請求...
  }
);
```

### 5. 錯誤處理

```javascript
// 全域錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});
```

### 6. 速率限制

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 限制 100 次請求
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 7. 資料庫連接

```javascript
// MongoDB 連接範例
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
```

### 8. 環境變數管理

```bash
# .env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/mydb
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 9. 日誌記錄

```javascript
const morgan = require('morgan');
const winston = require('winston');

// HTTP 請求日誌
app.use(morgan('combined'));

// 應用程式日誌
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 10. 測試

```javascript
// 使用 Jest + Supertest
const request = require('supertest');
const app = require('../app');

describe('User API', () => {
  test('GET /api/users should return users list', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

---

## 🔒 安全考量

1. **輸入驗證** - 永遠驗證和清理用戶輸入
2. **參數化查詢** - 防止 SQL/NoSQL 注入
3. **HTTPS** - 使用 SSL/TLS 加密傳輸
4. **CORS 設定** - 適當配置跨域請求
5. **速率限制** - 防止濫用和 DDoS
6. **敏感資料** - 加密密碼、Token 等敏感資訊
7. **依賴更新** - 定期更新套件以修補安全漏洞
8. **環境變數** - 不要在程式碼中硬編碼密鑰

---

## 📚 學習資源

### 官方文檔
- [Express.js](https://expressjs.com/)
- [NestJS](https://nestjs.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Flask](https://flask.palletsprojects.com/)

### 推薦教程
- [RESTful API 設計指南](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [JWT 介紹](https://jwt.io/introduction)

### 工具
- **Postman** - API 測試工具
- **Insomnia** - API 客戶端
- **Swagger Editor** - API 文檔編輯器
- **MongoDB Compass** - MongoDB GUI

---

## 🎯 專案檢查清單

創建 REST API 時，確保包含：

- [ ] 清晰的資料夾結構
- [ ] 環境變數配置 (.env)
- [ ] 數據庫連接與模型
- [ ] 路由與控制器分離
- [ ] 輸入驗證
- [ ] 錯誤處理中間件
- [ ] 認證與授權
- [ ] API 文檔 (Swagger/OpenAPI)
- [ ] 日誌記錄
- [ ] 單元測試
- [ ] README 說明文檔
- [ ] .gitignore (排除 node_modules, .env 等)

---

## 🚀 下一步

1. 選擇一個技術棧 (推薦初學者: Express.js 或 FastAPI)
2. 從簡單專案開始 (如 Task Manager API)
3. 利用 AI 工具加速開發
4. 逐步增加功能複雜度
5. 學習最佳實踐和安全原則
6. 部署到雲端平台 (Heroku, Railway, Vercel)

---

**開始使用 AI 打造你的第一個 REST API 吧！** 🚀
