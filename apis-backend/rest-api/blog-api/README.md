# 部落格系統 REST API

🤖 **AI-Driven | AI-Native** 🚀

一個功能完整的部落格系統 REST API，使用 **NestJS** 和 **PostgreSQL** 構建。

## ✨ 功能特點

### 用戶管理
- ✅ 用戶註冊與登入 (JWT 認證)
- ✅ 用戶角色管理 (管理員、編輯、作者、普通用戶)
- ✅ 用戶資料管理

### 文章管理
- ✅ 創建、讀取、更新、刪除文章 (CRUD)
- ✅ 文章狀態管理 (草稿、已發布、已歸檔)
- ✅ 文章瀏覽數統計
- ✅ 文章點讚功能
- ✅ 文章分頁查詢
- ✅ 文章 Slug 路由

### 分類與標籤
- ✅ 文章分類管理
- ✅ 文章標籤系統
- ✅ 多對多關聯

### 評論系統
- ✅ 文章評論功能
- ✅ 評論審核機制
- ✅ 評論管理

### API 文檔
- ✅ Swagger/OpenAPI 文檔
- ✅ 交互式 API 測試

## 🛠️ 技術棧

- **框架**: NestJS 10
- **語言**: TypeScript
- **資料庫**: PostgreSQL
- **ORM**: TypeORM
- **認證**: JWT (Passport.js)
- **驗證**: class-validator & class-transformer
- **API 文檔**: Swagger/OpenAPI
- **密碼加密**: bcrypt

## 📋 需求

- Node.js >= 18.0.0
- PostgreSQL >= 13.0
- npm 或 yarn

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置環境變數

複製 `.env.example` 為 `.env` 並配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=blog_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d
```

### 3. 創建資料庫

```bash
# 使用 PostgreSQL CLI
createdb blog_db

# 或使用 psql
psql -U postgres
CREATE DATABASE blog_db;
```

### 4. 啟動開發伺服器

```bash
# 開發模式 (熱重載)
npm run start:dev

# 生產模式
npm run build
npm run start:prod
```

伺服器將在 `http://localhost:3000` 啟動。

### 5. 訪問 API 文檔

啟動後訪問 Swagger 文檔：
```
http://localhost:3000/api/docs
```

## 📚 API 端點

### 認證 (Auth)

```
POST   /api/v1/auth/register      # 用戶註冊
POST   /api/v1/auth/login         # 用戶登入
```

### 用戶 (Users)

```
GET    /api/v1/users              # 獲取所有用戶
GET    /api/v1/users/:id          # 獲取單一用戶
```

### 文章 (Articles)

```
GET    /api/v1/articles           # 獲取文章列表 (支持分頁)
GET    /api/v1/articles/:id       # 獲取單一文章
POST   /api/v1/articles           # 創建文章 (需認證)
PUT    /api/v1/articles/:id       # 更新文章 (需認證)
DELETE /api/v1/articles/:id       # 刪除文章 (需認證)
POST   /api/v1/articles/:id/like  # 點讚文章
```

### 分類 (Categories)

```
GET    /api/v1/categories         # 獲取所有分類
GET    /api/v1/categories/:id     # 獲取單一分類
POST   /api/v1/categories         # 創建分類 (需認證)
PUT    /api/v1/categories/:id     # 更新分類 (需認證)
DELETE /api/v1/categories/:id     # 刪除分類 (需認證)
```

### 標籤 (Tags)

```
GET    /api/v1/tags               # 獲取所有標籤
GET    /api/v1/tags/:id           # 獲取單一標籤
POST   /api/v1/tags               # 創建標籤 (需認證)
PUT    /api/v1/tags/:id           # 更新標籤 (需認證)
DELETE /api/v1/tags/:id           # 刪除標籤 (需認證)
```

### 評論 (Comments)

```
GET    /api/v1/comments?articleId=xxx  # 獲取文章評論
POST   /api/v1/comments                # 創建評論 (需認證)
POST   /api/v1/comments/:id/approve    # 審核評論 (需認證)
DELETE /api/v1/comments/:id            # 刪除評論 (需認證)
```

## 📝 使用範例

### 用戶註冊

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "displayName": "John Doe"
  }'
```

### 用戶登入

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123"
  }'
```

### 創建文章 (需要 JWT Token)

```bash
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "我的第一篇文章",
    "slug": "my-first-article",
    "content": "這是文章內容...",
    "excerpt": "文章摘要",
    "status": "published"
  }'
```

### 獲取文章列表 (分頁)

```bash
curl http://localhost:3000/api/v1/articles?page=1&limit=10
```

## 🗄️ 資料庫結構

### Users (用戶)
- id, username, email, password, displayName, bio, avatar
- role (admin, editor, author, user)
- isActive, createdAt, updatedAt

### Articles (文章)
- id, title, slug, content, excerpt, coverImage
- status (draft, published, archived)
- viewCount, likeCount, publishedAt
- author (關聯 User)
- categories (多對多)
- tags (多對多)

### Categories (分類)
- id, name, slug, description

### Tags (標籤)
- id, name, slug

### Comments (評論)
- id, content, isApproved
- user (關聯 User)
- article (關聯 Article)

## 🧪 測試

```bash
# 單元測試
npm run test

# E2E 測試
npm run test:e2e

# 測試覆蓋率
npm run test:cov
```

## 📦 構建與部署

```bash
# 構建生產版本
npm run build

# 啟動生產伺服器
npm run start:prod
```

### Docker 部署 (可選)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🔒 安全考量

- ✅ 密碼使用 bcrypt 加密
- ✅ JWT Token 認證
- ✅ 輸入驗證與清理
- ✅ CORS 配置
- ✅ 環境變數管理
- ⚠️ 生產環境請使用 HTTPS
- ⚠️ 定期更新依賴套件

## 🤖 AI 輔助開發

這個專案使用 AI 工具開發：

- **GitHub Copilot** - 程式碼自動完成
- **Claude Code** - 架構設計與程式碼生成
- **ChatGPT** - API 設計諮詢

### AI 開發提示範例

```
"幫我創建一個 NestJS 的文章控制器，包含 CRUD 操作、
分頁查詢、搜尋功能，並使用 TypeORM 和 PostgreSQL。"

"為這個 API 添加 JWT 認證中間件，並實作角色權限控制。"

"生成 Swagger API 文檔註解，包含請求/回應範例。"
```

## 📖 學習資源

- [NestJS 官方文檔](https://docs.nestjs.com/)
- [TypeORM 文檔](https://typeorm.io/)
- [PostgreSQL 教程](https://www.postgresql.org/docs/)
- [JWT 介紹](https://jwt.io/introduction)
- [Swagger/OpenAPI](https://swagger.io/specification/)

## 🔧 常見問題

### Q: 如何重置資料庫？

```bash
# TypeORM 會自動同步 schema (開發模式)
# 或手動刪除資料庫並重新創建
dropdb blog_db
createdb blog_db
```

### Q: 如何修改 JWT 過期時間？

編輯 `.env` 文件：
```env
JWT_EXPIRATION=30d  # 30 天
```

### Q: 如何添加新的 API 端點？

使用 NestJS CLI：
```bash
nest generate resource posts
```

## 🚀 下一步功能

- [ ] 文章搜尋功能 (全文搜尋)
- [ ] 圖片上傳 (Multer)
- [ ] 文章草稿自動儲存
- [ ] 社交媒體分享
- [ ] RSS Feed
- [ ] 文章版本控制
- [ ] 閱讀時間估算
- [ ] 相關文章推薦
- [ ] Email 通知系統
- [ ] 速率限制 (Rate Limiting)

## 📄 授權

MIT License

---

**使用 AI 工具打造現代化 REST API！** 🤖✨
