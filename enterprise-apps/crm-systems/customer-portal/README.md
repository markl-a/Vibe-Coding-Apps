# Customer Portal

客戶自助服務門戶，讓客戶可以查詢訂單、提交工單、下載文檔等，提升客戶體驗。

## 功能特點

- 🔐 客戶登入系統 - 安全的客戶身份驗證
- 📋 訂單查詢 - 查看歷史訂單和當前訂單狀態
- 🎫 工單系統 - 提交和追蹤支援工單
- 📄 文檔下載 - 下載產品文檔、發票等
- 💬 即時聊天 - 與客服即時溝通
- 📊 使用分析 - 查看產品使用情況
- 📧 通知中心 - 接收重要更新通知
- 📱 響應式設計 - 支援桌面和移動設備

## 技術棧

### 前端
- **框架**: React 18 + TypeScript
- **UI 庫**: Material-UI (MUI)
- **狀態管理**: Redux Toolkit
- **路由**: React Router v6
- **HTTP 客戶端**: Axios
- **表單**: React Hook Form

### 後端
- **運行時**: Node.js + Express
- **資料庫**: MongoDB + Mongoose
- **認證**: JWT + bcrypt
- **檔案上傳**: Multer
- **即時通訊**: Socket.io

## 快速開始

### 前置要求

- Node.js 18+
- MongoDB 5+
- npm 或 yarn

### 安裝

```bash
# 安裝前端依賴
npm install

# 安裝後端依賴
cd server && npm install
```

### 配置

```bash
# 後端配置
cp server/.env.example server/.env
# 編輯 server/.env 設置資料庫連接等

# 前端配置
cp .env.example .env
# 編輯 .env 設置 API 端點
```

### 啟動開發環境

```bash
# 啟動後端
cd server
npm run dev

# 啟動前端 (新終端)
npm run dev
```

前端訪問: http://localhost:3000
後端 API: http://localhost:5000

### 生產構建

```bash
# 構建前端
npm run build

# 啟動生產環境
cd server
npm start
```

## 專案結構

```
customer-portal/
├── src/                    # 前端源代碼
│   ├── components/         # React 組件
│   │   ├── Layout/        # 佈局組件
│   │   ├── Dashboard/     # 儀表板
│   │   ├── Orders/        # 訂單管理
│   │   ├── Tickets/       # 工單系統
│   │   └── Chat/          # 聊天組件
│   ├── pages/             # 頁面組件
│   ├── store/             # Redux store
│   ├── services/          # API 服務
│   ├── hooks/             # 自定義 hooks
│   ├── utils/             # 工具函數
│   └── App.tsx            # 應用入口
├── server/                # 後端源代碼
│   ├── models/            # Mongoose 模型
│   ├── routes/            # API 路由
│   ├── middleware/        # 中間件
│   ├── controllers/       # 控制器
│   ├── services/          # 業務邏輯
│   └── server.js          # 服務器入口
├── public/                # 靜態文件
└── package.json
```

## API 文檔

### 客戶認證

#### 登入
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

響應:
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "customer": {
    "id": "123",
    "name": "張三",
    "email": "customer@example.com",
    "company": "ABC 公司"
  }
}
```

### 訂單管理

#### 獲取訂單列表
```http
GET /api/orders?status=active&page=1&limit=10
Authorization: Bearer {token}
```

#### 獲取訂單詳情
```http
GET /api/orders/:orderId
Authorization: Bearer {token}
```

### 工單系統

#### 提交工單
```http
POST /api/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject": "產品使用問題",
  "category": "技術支援",
  "priority": "中",
  "description": "詳細問題描述...",
  "attachments": ["file1.pdf", "screenshot.png"]
}
```

#### 獲取工單列表
```http
GET /api/tickets?status=open
Authorization: Bearer {token}
```

#### 更新工單
```http
PATCH /api/tickets/:ticketId
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "resolved",
  "customerResponse": "問題已解決，謝謝！"
}
```

### 文檔中心

#### 獲取文檔列表
```http
GET /api/documents?category=user-guide
Authorization: Bearer {token}
```

#### 下載文檔
```http
GET /api/documents/:documentId/download
Authorization: Bearer {token}
```

### 即時聊天

WebSocket 連接:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'Bearer token'
  }
});

socket.emit('join-room', customerId);
socket.on('message', (data) => {
  console.log('New message:', data);
});
```

## 主要功能模組

### 1. 儀表板

顯示客戶關鍵信息：
- 最近訂單
- 待處理工單
- 重要通知
- 快速操作入口

### 2. 訂單管理

- 訂單列表（支援篩選、排序）
- 訂單詳情
- 訂單追蹤
- 發票下載

### 3. 工單系統

- 提交新工單
- 工單列表
- 工單詳情和對話
- 附件上傳
- 滿意度評分

### 4. 文檔中心

- 產品文檔
- 用戶手冊
- FAQ
- 影片教程
- 發票和收據

### 5. 個人資料

- 基本資料編輯
- 密碼修改
- 聯絡人管理
- 通知設置

### 6. 即時聊天

- 與客服即時對話
- 聊天歷史記錄
- 檔案傳輸
- 離線留言

## 環境變數

### 前端 (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_UPLOAD_MAX_SIZE=10485760
```

### 後端 (server/.env)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/customer_portal
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 部署

### Docker 部署

```bash
# 構建並運行
docker-compose up -d

# 查看日誌
docker-compose logs -f
```

### Vercel 部署 (前端)

```bash
npm install -g vercel
vercel --prod
```

### Heroku 部署 (後端)

```bash
cd server
heroku create your-app-name
git push heroku main
```

## 測試

```bash
# 前端測試
npm test

# 後端測試
cd server
npm test

# E2E 測試
npm run test:e2e
```

## 安全性

- JWT 身份驗證
- 密碼加密 (bcrypt)
- HTTPS 強制
- CORS 配置
- XSS 防護
- CSRF 保護
- 檔案上傳驗證
- 速率限制

## 性能優化

- React.lazy 代碼分割
- 圖片懶加載
- API 響應緩存
- MongoDB 索引優化
- Gzip 壓縮
- CDN 靜態資源

## 開發計劃

- [x] 基礎架構
- [x] 客戶認證
- [x] 訂單查詢
- [x] 工單系統
- [x] 文檔中心
- [x] 即時聊天
- [ ] 多語言支援
- [ ] 暗黑模式
- [ ] 移動應用
- [ ] 進階分析
- [ ] 自定義主題
- [ ] SSO 整合

## 授權

MIT License

## 支援

如有問題，請聯繫：support@example.com
