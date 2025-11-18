# 電商微服務架構 🛒
🤖 **AI-Driven E-commerce Microservices** 🚀

完整的電商平台微服務架構，集成 AI 功能、斷路器、監控和最佳實踐。

## 🏗️ 架構概覽

```
┌─────────────┐
│   客戶端    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ ← 統一入口、JWT認證
└──────┬──────┘
       │
   ┌───┴────┬────────┬────────┐
   ▼        ▼        ▼        ▼
┌─────┐ ┌────────┐ ┌──────┐ ┌────────┐
│User │ │Product │ │Order │ │Payment │
│Service│Service│ │Service│Service│
└──┬──┘ └───┬───┘ └──┬───┘ └───┬────┘
   │        │        │         │
   ▼        ▼        ▼         ▼
┌──────┐┌──────┐┌──────┐┌──────┐
│MongoDB│MongoDB││MongoDB││MongoDB│
└──────┘└──┬───┘└──────┘└──────┘
           │
           ▼
        ┌─────┐
        │Redis│ ← 緩存層
        └─────┘
```

## 📦 服務列表

### 1. API Gateway (Port 3000)
- 統一入口點
- JWT 認證驗證
- 路由轉發到各微服務
- 速率限制
- 請求日誌

### 2. User Service (Port 3001)
- ✨ 用戶註冊/登入
- ✨ 個人資料管理
- ✨ 地址管理
- ✨ JWT Token 生成
- ✨ 用戶偏好設定
- 📊 Prometheus 監控
- 📚 Swagger API 文檔
- 🔄 斷路器保護

### 3. Product Service (Port 3002)
- ✨ 商品 CRUD 操作
- ✨ 高級搜尋和過濾
- ✨ 庫存管理
- 🤖 **AI 商品推薦**
- 📈 **趨勢商品分析**
- 💾 Redis 緩存層
- 📊 Prometheus 監控
- 📚 Swagger API 文檔

### 4. Order Service (Port 3003)
- ✨ 訂單創建和管理
- ✨ 訂單狀態追蹤
- ✨ 訂單歷史
- ✨ 訂單取消
- 🔄 **服務間通訊（Circuit Breaker）**
- 📊 訂單統計分析
- 📚 Swagger API 文檔
- 💡 自動計算稅費和運費

### 5. Payment Service (Port 3004) ⭐ NEW
- ✨ 支付處理
- ✨ 多種支付方式支持
- ✨ 退款處理
- 🤖 **AI 詐騙檢測**
- 🔄 斷路器保護
- 📊 支付統計
- 📚 Swagger API 文檔
- 💳 支持信用卡、PayPal、Stripe 等

## 🚀 快速開始

### 使用 Docker Compose

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f [service-name]

# 查看特定服務日誌
docker-compose logs -f user-service

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

### 運行測試腳本

```bash
# 給測試腳本執行權限
chmod +x examples/test-ecommerce-services.sh

# 運行測試
./examples/test-ecommerce-services.sh
```

## 🔧 環境變數

### User Service
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ecommerce_users
JWT_SECRET=ecommerce-secret-key-2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Product Service
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/ecommerce_products
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### Order Service
```env
PORT=3003
MONGODB_URI=mongodb://localhost:27017/ecommerce_orders
USER_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
NODE_ENV=development
```

### Payment Service
```env
PORT=3004
MONGODB_URI=mongodb://localhost:27017/ecommerce_payments
NODE_ENV=development
```

## 📖 API 文檔

所有服務都包含 Swagger API 文檔：

- **User Service**: http://localhost:3001/api-docs
- **Product Service**: http://localhost:3002/api-docs
- **Order Service**: http://localhost:3003/api-docs
- **Payment Service**: http://localhost:3004/api-docs

### 主要 API 端點

#### 用戶服務 (3001)
- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `GET /api/users/:id` - 獲取用戶資料
- `PUT /api/users/:id` - 更新用戶資料
- `POST /api/users/:id/addresses` - 添加地址

#### 商品服務 (3002)
- `GET /api/products` - 獲取商品列表（支持搜尋、過濾、分頁）
- `GET /api/products/:id` - 獲取商品詳情
- `POST /api/products` - 創建商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 刪除商品
- `GET /api/products/recommendations/ai` - 🤖 AI 商品推薦
- `GET /api/products/trending` - 📈 熱門商品
- `GET /api/products/categories` - 獲取分類

#### 訂單服務 (3003)
- `POST /api/orders` - 創建訂單
- `GET /api/orders` - 獲取訂單列表
- `GET /api/orders/:id` - 獲取訂單詳情
- `PUT /api/orders/:id/status` - 更新訂單狀態
- `POST /api/orders/:id/cancel` - 取消訂單
- `GET /api/orders/stats/summary` - 訂單統計

#### 支付服務 (3004)
- `POST /api/payments` - 處理支付
- `GET /api/payments/:transactionId` - 獲取支付詳情
- `GET /api/payments/order/:orderId` - 獲取訂單的支付記錄
- `POST /api/payments/:transactionId/refund` - 退款
- `POST /api/payments/fraud/check` - 🤖 AI 詐騙檢測
- `GET /api/payments/stats/summary` - 支付統計

## 🤖 AI 功能特性

### 1. AI 商品推薦
```bash
GET /api/products/recommendations/ai?userId=xxx&category=Electronics&limit=10
```
基於用戶行為和協同過濾的智能推薦系統。

### 2. 趨勢商品分析
```bash
GET /api/products/trending?limit=10
```
根據瀏覽量和銷售量計算趨勢分數。

### 3. AI 詐騙檢測
```bash
POST /api/payments/fraud/check
{
  "amount": 5000,
  "method": "credit_card",
  "userId": "xxx"
}
```
智能分析支付行為，檢測潛在詐騙。

## 🛡️ 安全特性

- ✅ JWT Token 認證
- ✅ 密碼加密（bcrypt）
- ✅ 輸入驗證（express-validator）
- ✅ Helmet 安全頭
- ✅ CORS 配置
- ✅ SQL 注入防護
- ✅ XSS 防護

## 🔄 斷路器模式

使用 opossum 實現斷路器，保護服務間通訊：
- 自動熔斷失敗的服務調用
- 超時保護
- 錯誤閾值控制
- 自動恢復機制

## 📊 監控和指標

每個服務都提供 Prometheus 指標：

```bash
# User Service
curl http://localhost:3001/metrics

# Product Service
curl http://localhost:3002/metrics

# Order Service
curl http://localhost:3003/metrics

# Payment Service
curl http://localhost:3004/metrics
```

指標包括：
- HTTP 請求時長
- 請求計數
- 緩存命中率
- 訂單/支付計數
- 業務指標

## 💾 數據存儲

- **MongoDB** - User, Product, Order, Payment 數據
- **Redis** - 產品緩存、查詢緩存
- **健康檢查** - 所有數據庫都配置了健康檢查

## 🚀 性能優化

### 緩存策略
- Product 列表緩存 3 分鐘
- Product 詳情緩存 5 分鐘
- Category 緩存 1 小時
- 自動緩存失效

### 數據庫優化
- MongoDB 索引優化
- 全文搜索索引
- 複合索引
- 查詢優化

### 連接池
- MongoDB 連接池
- Redis 連接重試機制

## 📈 可擴展性

- 每個服務可以獨立水平擴展
- Docker Compose 配置易於轉換為 Kubernetes
- 服務發現準備
- 負載均衡支持

## 🧪 測試

運行完整的測試腳本：

```bash
./examples/test-ecommerce-services.sh
```

測試包括：
1. ✅ 健康檢查
2. ✅ 用戶註冊和登入
3. ✅ 商品管理
4. ✅ AI 推薦功能
5. ✅ 訂單創建
6. ✅ 支付處理
7. ✅ AI 詐騙檢測
8. ✅ API 文檔訪問
9. ✅ Prometheus 指標

## 📝 最佳實踐

1. **微服務設計**
   - 單一職責原則
   - 獨立數據庫
   - API First 設計

2. **容錯處理**
   - 斷路器模式
   - 優雅降級
   - 重試機制

3. **安全性**
   - 輸入驗證
   - 認證授權
   - 敏感數據加密

4. **可觀測性**
   - 健康檢查
   - Prometheus 指標
   - 結構化日誌

## 🌟 新增功能亮點

✨ **完整的支付服務**
- 多種支付方式
- AI 詐騙檢測
- 退款處理

✨ **AI 智能功能**
- 商品推薦算法
- 趨勢分析
- 詐騙檢測

✨ **監控和追蹤**
- Prometheus 指標
- 健康檢查端點
- 性能追蹤

✨ **API 文檔**
- Swagger/OpenAPI 3.0
- 互動式文檔
- 完整的 schema 定義

---

**使用 AI 打造現代化電商微服務平台！** 🚀
