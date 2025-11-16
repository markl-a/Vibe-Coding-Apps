# 電商微服務架構 🛒
🤖 **AI-Driven Microservices** 🚀

完整的電商平台微服務架構示例，展示如何使用微服務架構構建可擴展的應用。

## 🏗️ 架構概覽

```
┌─────────────┐
│   客戶端    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ ← 統一入口
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   ▼        ▼        ▼        ▼
┌─────┐ ┌────────┐ ┌──────┐ ┌────────┐
│User │ │Product │ │Order │ │Payment │
│Service│Service│ │Service│Service│
└─────┘ └────────┘ └──────┘ └────────┘
   │        │        │        │
   ▼        ▼        ▼        ▼
┌─────┐ ┌────────┐ ┌──────┐ ┌────────┐
│MongoDB│ │MongoDB│PostgreSQL│Redis   │
└─────┘ └────────┘ └──────┘ └────────┘
```

## 📦 服務列表

### 1. API Gateway (Port 3000)
- 統一入口點
- 路由轉發
- 認證驗證
- 速率限制

### 2. User Service (Port 3001)
- 用戶註冊/登入
- 用戶資料管理
- JWT 認證

### 3. Product Service (Port 3002)
- 商品 CRUD
- 商品搜尋
- 庫存管理

### 4. Order Service (Port 3003)
- 訂單創建
- 訂單查詢
- 訂單狀態管理

## 🚀 快速開始

### 使用 Docker Compose

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

### 本地開發

每個服務都可以獨立運行：

```bash
cd user-service
npm install
npm run dev
```

## 🔧 環境變數

每個服務都有自己的 `.env` 文件，參考各服務的 `.env.example`。

## 📖 API 文檔

所有請求通過 API Gateway: `http://localhost:3000`

### 用戶服務
- POST `/api/users/register` - 註冊
- POST `/api/users/login` - 登入

### 商品服務
- GET `/api/products` - 獲取商品列表
- GET `/api/products/:id` - 獲取商品詳情
- POST `/api/products` - 創建商品 (需認證)

### 訂單服務
- POST `/api/orders` - 創建訂單 (需認證)
- GET `/api/orders` - 獲取訂單列表 (需認證)

## 🛡️ 安全特性

- JWT Token 認證
- API Gateway 速率限制
- 輸入驗證
- CORS 配置

---

**AI 輔助開發的微服務範例！** 🚀
