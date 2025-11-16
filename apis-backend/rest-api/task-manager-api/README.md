# Task Manager API 📝
🤖 **AI-Driven REST API** 🚀

功能完整的任務管理系統 REST API，使用 Express.js 和 MongoDB 構建。

## ✨ 功能特點

- ✅ 用戶註冊與登入 (JWT 認證)
- ✅ 任務 CRUD 操作
- ✅ 任務分類與優先級
- ✅ 任務狀態管理 (待辦、進行中、已完成)
- ✅ 任務搜尋與篩選
- ✅ 用戶權限控制
- ✅ 輸入驗證
- ✅ 錯誤處理
- ✅ 速率限制
- ✅ API 文檔

## 🛠️ 技術棧

- **框架**: Express.js
- **資料庫**: MongoDB with Mongoose
- **認證**: JWT (JSON Web Tokens)
- **驗證**: express-validator
- **安全**: bcryptjs, CORS, Rate Limiting

## 📋 API 端點

### 認證 (Auth)
```
POST   /api/auth/register    # 用戶註冊
POST   /api/auth/login       # 用戶登入
GET    /api/auth/me          # 取得當前用戶資訊
```

### 任務 (Tasks)
```
GET    /api/tasks            # 取得所有任務 (支援篩選、搜尋、分頁)
GET    /api/tasks/:id        # 取得單一任務
POST   /api/tasks            # 創建新任務
PUT    /api/tasks/:id        # 更新任務
DELETE /api/tasks/:id        # 刪除任務
PATCH  /api/tasks/:id/status # 更新任務狀態
```

### 健康檢查
```
GET    /api/health           # API 健康狀態
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境配置

複製 `.env.example` 為 `.env` 並配置：

```bash
cp .env.example .env
```

編輯 `.env` 設定你的環境變數：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your-secret-key
```

### 3. 啟動 MongoDB

確保 MongoDB 正在運行：
```bash
# 使用 Docker
docker run -d -p 27017:27017 --name mongodb mongo

# 或使用本地安裝
mongod
```

### 4. 運行開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動

### 5. 測試 API

使用 Postman 或 curl 測試：

```bash
# 健康檢查
curl http://localhost:3000/api/health

# 註冊用戶
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# 登入
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 創建任務 (需要 JWT Token)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "完成專案文檔",
    "description": "撰寫 API 使用說明",
    "priority": "high",
    "dueDate": "2025-12-31"
  }'
```

## 📖 資料模型

### User (用戶)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
```

### Task (任務)
```javascript
{
  title: String,
  description: String,
  status: String (pending|in_progress|completed),
  priority: String (low|medium|high),
  category: String,
  dueDate: Date,
  userId: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 認證流程

1. 用戶註冊或登入，獲得 JWT Token
2. 在後續請求中，將 Token 放入 Authorization Header：
   ```
   Authorization: Bearer <your-jwt-token>
   ```
3. API 會驗證 Token 並識別用戶身份

## 📝 API 使用範例

### 註冊並創建任務

```javascript
// 1. 註冊用戶
const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'securepass123'
  })
});

const { token } = await registerResponse.json();

// 2. 創建任務
const taskResponse = await fetch('http://localhost:3000/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: '學習 REST API 開發',
    description: '使用 Express.js 建立完整的 API',
    priority: 'high',
    category: '學習',
    dueDate: '2025-12-31'
  })
});

const task = await taskResponse.json();
console.log(task);
```

### 查詢任務 (帶篩選)

```bash
# 查詢高優先級的待辦任務
GET /api/tasks?status=pending&priority=high

# 搜尋標題包含 "API" 的任務
GET /api/tasks?search=API

# 分頁查詢 (每頁 10 條，第 2 頁)
GET /api/tasks?page=2&limit=10

# 按截止日期排序
GET /api/tasks?sortBy=dueDate&order=asc
```

## 🧪 測試

```bash
npm test
```

## 📂 專案結構

```
task-manager-api/
├── src/
│   ├── index.js              # 應用程式入口
│   ├── config/
│   │   └── database.js       # 數據庫配置
│   ├── models/
│   │   ├── User.js           # 用戶模型
│   │   └── Task.js           # 任務模型
│   ├── controllers/
│   │   ├── authController.js # 認證控制器
│   │   └── taskController.js # 任務控制器
│   ├── routes/
│   │   ├── authRoutes.js     # 認證路由
│   │   └── taskRoutes.js     # 任務路由
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT 認證中間件
│   │   ├── errorHandler.js   # 錯誤處理中間件
│   │   └── validator.js      # 輸入驗證中間件
│   └── utils/
│       └── helpers.js        # 輔助函數
├── .env.example              # 環境變數範例
├── .gitignore
├── package.json
└── README.md
```

## 🔧 環境變數說明

| 變數 | 說明 | 預設值 |
|-----|------|--------|
| PORT | 伺服器端口 | 3000 |
| MONGODB_URI | MongoDB 連接字串 | mongodb://localhost:27017/task-manager |
| JWT_SECRET | JWT 簽名密鑰 | - |
| JWT_EXPIRE | JWT 過期時間 | 7d |
| NODE_ENV | 運行環境 | development |

## 🛡️ 安全特性

- ✅ 密碼使用 bcryptjs 加密
- ✅ JWT Token 認證
- ✅ CORS 保護
- ✅ 速率限制 (防止濫用)
- ✅ 輸入驗證與清理
- ✅ MongoDB 注入防護
- ✅ HTTP Headers 安全

## 🚀 部署

### 部署到 Railway

1. 安裝 Railway CLI
2. 登入 Railway: `railway login`
3. 初始化: `railway init`
4. 添加 MongoDB: `railway add`
5. 部署: `railway up`

### 部署到 Heroku

```bash
# 登入 Heroku
heroku login

# 創建應用
heroku create your-app-name

# 添加 MongoDB (使用 Atlas)
heroku addons:create mongolab

# 設定環境變數
heroku config:set JWT_SECRET=your-secret-key

# 部署
git push heroku main
```

## 📚 學習資源

- [Express.js 官方文檔](https://expressjs.com/)
- [Mongoose 文檔](https://mongoosejs.com/)
- [JWT 介紹](https://jwt.io/introduction)
- [REST API 設計最佳實踐](https://restfulapi.net/)

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📄 授權

MIT License

---

**使用 AI 輔助開發，快速構建高質量 REST API！** 🚀
