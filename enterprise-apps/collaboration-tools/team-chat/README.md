# 團隊即時通訊系統 (Team Chat)

一個功能完整的企業級即時通訊平台，類似 Slack，支持頻道、直接訊息、文件共享、實時通知等功能。

## 功能特性

### 核心功能
- ✅ 實時訊息傳送（WebSocket）
- ✅ 頻道管理（公開/私人頻道）
- ✅ 直接訊息和群組聊天
- ✅ 訊息反應（Emoji）
- ✅ 訊息線程（Thread）
- ✅ 文件上傳和共享
- ✅ @提及用戶功能
- ✅ 訊息編輯和刪除
- ✅ 訊息搜索

### 進階功能
- ✅ 多工作區支持
- ✅ 用戶狀態（在線/離線/忙碌）
- ✅ 打字指示器
- ✅ 已讀回執
- ✅ 訊息固定
- ✅ 頻道歸檔
- ✅ 實時通知
- ✅ 權限管理

### AI 智能功能
- ✅ 智能回覆建議
- ✅ 訊息摘要
- ✅ 語義搜索
- ✅ 自動標籤分類

## 技術架構

### 後端技術棧
- **框架**: NestJS + TypeScript
- **數據庫**: PostgreSQL (主數據) + Redis (快取/會話)
- **實時通訊**: Socket.IO
- **認證**: JWT + Passport
- **文件存儲**: AWS S3 / MinIO
- **搜索引擎**: Elasticsearch
- **消息隊列**: Bull (Redis-based)

### 前端技術棧
- **框架**: React 18 + TypeScript
- **狀態管理**: Zustand
- **UI 組件**: Tailwind CSS + Headless UI
- **實時通訊**: Socket.IO Client
- **HTTP 客戶端**: Axios
- **表單處理**: React Hook Form
- **路由**: React Router v6

## 項目結構

```
team-chat/
├── backend/                 # 後端服務
│   ├── src/
│   │   ├── modules/        # 功能模組
│   │   │   ├── auth/       # 認證模組
│   │   │   ├── user/       # 用戶模組
│   │   │   ├── workspace/  # 工作區模組
│   │   │   ├── channel/    # 頻道模組
│   │   │   ├── message/    # 訊息模組
│   │   │   └── notification/ # 通知模組
│   │   ├── common/         # 共用工具
│   │   ├── config/         # 配置文件
│   │   └── main.ts         # 入口文件
│   ├── test/               # 測試文件
│   └── package.json
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   ├── pages/          # 頁面
│   │   ├── hooks/          # 自定義 Hooks
│   │   ├── services/       # API 服務
│   │   ├── types/          # TypeScript 類型
│   │   └── utils/          # 工具函數
│   └── package.json
├── shared/                 # 共享類型定義
└── docs/                   # 文檔
```

## 快速開始

### 環境要求
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- npm 或 yarn

### 安裝步驟

1. **克隆項目**
```bash
cd team-chat
```

2. **安裝後端依賴**
```bash
cd backend
npm install
```

3. **配置環境變數**
```bash
cp .env.example .env
# 編輯 .env 文件，配置數據庫連接等
```

4. **運行數據庫遷移**
```bash
npm run migration:run
```

5. **啟動後端服務**
```bash
npm run start:dev
```

6. **安裝前端依賴**
```bash
cd ../frontend
npm install
```

7. **啟動前端開發服務器**
```bash
npm run dev
```

8. **訪問應用**
- 前端: http://localhost:3000
- 後端 API: http://localhost:3001
- WebSocket: ws://localhost:3001

## 環境變數配置

### 後端 (.env)
```env
# 數據庫
DATABASE_URL=postgresql://user:password@localhost:5432/teamchat
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# AWS S3 (文件存儲)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=teamchat-files

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# 應用配置
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 前端 (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## API 端點

### 認證
- `POST /api/auth/register` - 用戶註冊
- `POST /api/auth/login` - 用戶登入
- `POST /api/auth/logout` - 用戶登出
- `GET /api/auth/me` - 獲取當前用戶

### 工作區
- `GET /api/workspaces` - 獲取工作區列表
- `POST /api/workspaces` - 創建工作區
- `GET /api/workspaces/:id` - 獲取工作區詳情
- `PATCH /api/workspaces/:id` - 更新工作區
- `DELETE /api/workspaces/:id` - 刪除工作區

### 頻道
- `GET /api/workspaces/:workspaceId/channels` - 獲取頻道列表
- `POST /api/workspaces/:workspaceId/channels` - 創建頻道
- `GET /api/channels/:id` - 獲取頻道詳情
- `PATCH /api/channels/:id` - 更新頻道
- `DELETE /api/channels/:id` - 刪除頻道
- `POST /api/channels/:id/join` - 加入頻道
- `POST /api/channels/:id/leave` - 離開頻道

### 訊息
- `GET /api/channels/:channelId/messages` - 獲取訊息列表
- `POST /api/channels/:channelId/messages` - 發送訊息
- `PATCH /api/messages/:id` - 編輯訊息
- `DELETE /api/messages/:id` - 刪除訊息
- `POST /api/messages/:id/reactions` - 添加反應
- `GET /api/messages/:id/thread` - 獲取線程訊息

### WebSocket 事件

#### 客戶端發送
- `join-channel` - 加入頻道
- `leave-channel` - 離開頻道
- `send-message` - 發送訊息
- `typing-start` - 開始打字
- `typing-stop` - 停止打字

#### 服務器發送
- `message-received` - 收到新訊息
- `message-updated` - 訊息更新
- `message-deleted` - 訊息刪除
- `user-typing` - 用戶正在打字
- `user-status-changed` - 用戶狀態變更

## 數據庫模型

### User (用戶)
```typescript
{
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl?: string
  status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY'
  createdAt: Date
  updatedAt: Date
}
```

### Workspace (工作區)
```typescript
{
  id: string
  name: string
  slug: string
  description?: string
  iconUrl?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}
```

### Channel (頻道)
```typescript
{
  id: string
  workspaceId: string
  name: string
  description?: string
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT' | 'GROUP'
  isArchived: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### Message (訊息)
```typescript
{
  id: string
  channelId: string
  userId: string
  content: string
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM'
  threadId?: string
  replyCount: number
  isEdited: boolean
  isDeleted: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}
```

## 測試

```bash
# 後端單元測試
cd backend
npm run test

# 後端 E2E 測試
npm run test:e2e

# 前端測試
cd frontend
npm run test
```

## 部署

### Docker 部署

```bash
# 構建鏡像
docker-compose build

# 啟動服務
docker-compose up -d
```

### 生產環境配置

1. 設置環境變數
2. 配置反向代理（Nginx）
3. 啟用 HTTPS
4. 配置數據庫備份
5. 設置監控和日誌

## 性能優化

- ✅ Redis 快取熱門數據
- ✅ 訊息分頁加載
- ✅ WebSocket 連接池
- ✅ 數據庫索引優化
- ✅ CDN 加速靜態資源
- ✅ 圖片壓縮和懶加載

## 安全措施

- ✅ JWT 認證
- ✅ 密碼加密（bcrypt）
- ✅ XSS 防護
- ✅ CSRF 防護
- ✅ 速率限制
- ✅ SQL 注入防護
- ✅ 文件上傳驗證

## 未來計劃

- [ ] 語音訊息
- [ ] 視訊通話
- [ ] 屏幕共享
- [ ] 更多集成（GitHub, Jira, etc.）
- [ ] 移動應用
- [ ] 電子郵件通知
- [ ] Webhook 支持
- [ ] API 速率限制

## 貢獻

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License
