# 社交媒體微服務架構 📱
🤖 **AI-Driven Social Media Platform** 🚀

完整的社交媒體平台微服務架構，展示如何使用微服務構建可擴展的社交應用。

## 🏗️ 架構概覽

```
┌──────────────┐
│   客戶端     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API Gateway  │ ← 統一入口、認證
└──────┬───────┘
       │
   ┌───┴───┬────────┬─────────┐
   ▼       ▼        ▼         ▼
┌──────┐┌──────┐┌─────────┐┌──────────┐
│User  ││Post  ││Comment  ││Notification│
│Service│Service││Service  ││Service   │
└──┬───┘└──┬───┘└────┬────┘└────┬─────┘
   │       │         │           │
   ▼       ▼         ▼           ▼
┌──────┐┌──────┐┌─────────┐┌──────────┐
│MongoDB│MongoDB││PostgreSQL│Redis     │
└──────┘└──────┘└─────────┘└──────────┘
```

## 📦 服務列表

### 1. API Gateway (Port 4000)
- 統一入口點
- JWT 認證驗證
- 路由轉發
- 速率限制
- CORS 配置

### 2. User Service (Port 4001)
- 用戶註冊/登入
- 個人資料管理
- 關注/取消關注
- 用戶搜索
- JWT Token 生成

### 3. Post Service (Port 4002)
- 發布貼文
- 貼文 CRUD
- 點讚/取消點讚
- 時間軸獲取
- 圖片上傳

### 4. Comment Service (Port 4003)
- 評論 CRUD
- 回覆評論
- 評論點讚
- 評論分頁

### 5. Notification Service (Port 4004)
- 即時通知
- 通知推送
- 通知狀態管理
- WebSocket 支持

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

# 停止並刪除數據
docker-compose down -v
```

### 本地開發

每個服務都可以獨立運行：

```bash
cd user-service
npm install
npm run dev
```

## 🔧 環境變數

每個服務都有自己的環境配置，主要變數：

```env
# 通用
PORT=4001
NODE_ENV=development

# 資料庫
MONGODB_URI=mongodb://localhost:27017/social_users
POSTGRES_URL=postgresql://user:pass@localhost:5432/social_comments
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# 服務 URLs (用於服務間通訊)
USER_SERVICE_URL=http://localhost:4001
POST_SERVICE_URL=http://localhost:4002
COMMENT_SERVICE_URL=http://localhost:4003
NOTIFICATION_SERVICE_URL=http://localhost:4004
```

## 📖 API 文檔

所有請求通過 API Gateway: `http://localhost:4000`

### 認證
- POST `/api/auth/register` - 註冊
- POST `/api/auth/login` - 登入

### 用戶
- GET `/api/users/:id` - 獲取用戶資料
- PUT `/api/users/:id` - 更新用戶資料
- POST `/api/users/:id/follow` - 關注用戶
- DELETE `/api/users/:id/follow` - 取消關注

### 貼文
- GET `/api/posts` - 獲取時間軸
- GET `/api/posts/:id` - 獲取單個貼文
- POST `/api/posts` - 創建貼文
- PUT `/api/posts/:id` - 更新貼文
- DELETE `/api/posts/:id` - 刪除貼文
- POST `/api/posts/:id/like` - 點讚貼文
- DELETE `/api/posts/:id/like` - 取消點讚

### 評論
- GET `/api/posts/:postId/comments` - 獲取評論列表
- POST `/api/posts/:postId/comments` - 創建評論
- PUT `/api/comments/:id` - 更新評論
- DELETE `/api/comments/:id` - 刪除評論
- POST `/api/comments/:id/like` - 點讚評論

### 通知
- GET `/api/notifications` - 獲取通知列表
- PUT `/api/notifications/:id/read` - 標記為已讀
- DELETE `/api/notifications/:id` - 刪除通知

## 🛡️ 安全特性

- ✅ JWT Token 認證
- ✅ 密碼加密 (bcrypt)
- ✅ 輸入驗證
- ✅ SQL 注入防護
- ✅ XSS 防護
- ✅ CORS 配置
- ✅ 速率限制

## 🔄 服務間通訊

- **同步通訊**: HTTP/REST API
- **異步通訊**: Redis Pub/Sub (通知服務)
- **數據一致性**: 最終一致性模型

## 📊 技術棧

- **運行時**: Node.js 20
- **框架**: Express.js
- **數據庫**:
  - MongoDB (用戶、貼文)
  - PostgreSQL (評論)
  - Redis (通知、緩存)
- **認證**: JWT
- **容器化**: Docker, Docker Compose

## 🎯 特色功能

1. **微服務架構**: 獨立部署、獨立擴展
2. **多數據庫**: 展示不同場景使用不同數據庫
3. **即時通知**: 使用 Redis Pub/Sub
4. **API Gateway**: 統一入口、認證中間件
5. **容器化**: 完整的 Docker 配置

## 📈 擴展性

- 每個服務可以獨立水平擴展
- 數據庫支持讀寫分離
- Redis 集群支持
- 負載均衡支持

## 🧪 測試

```bash
# 運行單元測試
npm test

# 運行集成測試
npm run test:integration

# 測試覆蓋率
npm run test:coverage
```

## 📝 最佳實踐

- ✅ 單一職責原則
- ✅ 數據庫獨立
- ✅ 容錯處理
- ✅ 日誌記錄
- ✅ 健康檢查
- ✅ 優雅關閉

---

**使用 AI 構建現代化社交媒體平台！** 🚀
