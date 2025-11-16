# 電商平台 REST API

🤖 **AI-Driven | AI-Native** 🚀

一個功能完整的電商平台 REST API，使用 **FastAPI** 和 **PostgreSQL** 構建，支持商品管理、購物車、訂單處理和 Stripe 支付整合。

## ✨ 功能特點

### 用戶管理
- ✅ 用戶註冊與登入 (JWT 認證)
- ✅ 用戶資料管理
- ✅ 管理員權限控制

### 商品管理
- ✅ 商品 CRUD 操作
- ✅ 商品分類系統
- ✅ 庫存管理
- ✅ 商品圖片上傳
- ✅ 商品搜尋與篩選

### 購物車系統
- ✅ 添加商品到購物車
- ✅ 更新購物車數量
- ✅ 刪除購物車商品
- ✅ 購物車總價計算

### 訂單處理
- ✅ 創建訂單
- ✅ 訂單狀態管理
- ✅ 訂單歷史查詢
- ✅ 庫存自動扣減

### 支付整合
- ✅ Stripe 支付整合
- ✅ 支付確認
- ✅ Webhook 處理

### API 文檔
- ✅ 自動生成 Swagger/OpenAPI 文檔
- ✅ 交互式 API 測試

## 🛠️ 技術棧

- **框架**: FastAPI
- **語言**: Python 3.9+
- **資料庫**: PostgreSQL
- **ORM**: SQLAlchemy
- **認證**: JWT (python-jose)
- **密碼加密**: bcrypt (passlib)
- **支付**: Stripe API
- **驗證**: Pydantic

## 📋 需求

- Python >= 3.9
- PostgreSQL >= 13.0
- pip 或 poetry

## 🚀 快速開始

### 1. 克隆專案並安裝依賴

```bash
# 創建虛擬環境
python -m venv venv

# 啟動虛擬環境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt
```

### 2. 設置環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# Application
APP_NAME=E-commerce API
DEBUG=True

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecommerce_db

# Security
SECRET_KEY=your-super-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 3. 創建資料庫

```bash
# 使用 PostgreSQL CLI
createdb ecommerce_db

# 或使用 psql
psql -U postgres
CREATE DATABASE ecommerce_db;
```

### 4. 初始化資料庫

```python
# 創建資料表
python -c "from app.core.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
```

### 5. 啟動開發伺服器

```bash
# 使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 或使用 Python
python main.py
```

伺服器將在 `http://localhost:8000` 啟動。

### 6. 訪問 API 文檔

啟動後訪問：
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`

## 📚 API 端點

### 認證 (Auth)

```
POST   /api/v1/auth/register      # 用戶註冊
POST   /api/v1/auth/login         # 用戶登入 (獲取 JWT Token)
```

### 用戶 (Users)

```
GET    /api/v1/users/me           # 獲取當前用戶資料 (需認證)
```

### 商品 (Products)

```
GET    /api/v1/products           # 獲取商品列表
GET    /api/v1/products/:id       # 獲取單一商品
POST   /api/v1/products           # 創建商品 (需管理員權限)
PUT    /api/v1/products/:id       # 更新商品 (需管理員權限)
DELETE /api/v1/products/:id       # 刪除商品 (需管理員權限)
```

### 購物車 (Cart)

```
POST   /api/v1/cart/add           # 添加商品到購物車 (需認證)
GET    /api/v1/cart               # 獲取購物車內容 (需認證)
DELETE /api/v1/cart/:item_id      # 刪除購物車商品 (需認證)
```

### 訂單 (Orders)

```
POST   /api/v1/orders             # 創建訂單 (需認證)
GET    /api/v1/orders             # 獲取訂單列表 (需認證)
GET    /api/v1/orders/:id         # 獲取單一訂單 (需認證)
```

## 📝 使用範例

### 用戶註冊

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "john_doe",
    "password": "SecurePass123",
    "full_name": "John Doe"
  }'
```

### 用戶登入 (獲取 Token)

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john_doe&password=SecurePass123"
```

回應：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 獲取商品列表

```bash
curl http://localhost:8000/api/v1/products
```

### 添加商品到購物車 (需要 Token)

```bash
curl -X POST http://localhost:8000/api/v1/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": "product-uuid-here",
    "quantity": 2
  }'
```

### 創建訂單 (需要 Token)

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "shipping_address": "123 Main St, City, Country",
    "payment_method": "stripe"
  }'
```

## 🗄️ 資料庫結構

### Users (用戶)
- id (UUID), email, username, hashed_password
- full_name, is_active, is_admin
- created_at, updated_at

### Products (商品)
- id (UUID), name, slug, description
- price, stock, image_url, is_active
- category_id, created_at, updated_at

### Categories (分類)
- id (UUID), name, slug, description

### Cart (購物車)
- id (UUID), user_id, created_at, updated_at

### CartItems (購物車項目)
- id (UUID), cart_id, product_id, quantity

### Orders (訂單)
- id (UUID), user_id, total_amount
- status (pending, processing, shipped, delivered, cancelled)
- shipping_address, payment_method, stripe_payment_id

### OrderItems (訂單項目)
- id (UUID), order_id, product_id, quantity, price

## 🔒 認證流程

1. 用戶註冊或登入獲取 JWT Token
2. 在後續請求的 Header 中包含 Token：
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
3. Token 預設有效期為 30 分鐘

## 💳 Stripe 支付整合

### 設置 Stripe

1. 註冊 [Stripe 帳號](https://stripe.com)
2. 獲取 API 密鑰
3. 在 `.env` 中設置密鑰

### 處理支付

```python
# 範例：創建支付意圖
import stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

payment_intent = stripe.PaymentIntent.create(
    amount=int(total_amount * 100),  # 金額以分為單位
    currency="usd",
    metadata={"order_id": order.id},
)
```

## 🧪 測試

```bash
# 運行測試
pytest

# 測試覆蓋率
pytest --cov=app tests/
```

## 📦 部署

### 使用 Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ecommerce_db
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=ecommerce_db
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 安全考量

- ✅ 密碼使用 bcrypt 加密
- ✅ JWT Token 認證
- ✅ Pydantic 數據驗證
- ✅ CORS 配置
- ✅ SQL 注入防護 (SQLAlchemy ORM)
- ⚠️ 生產環境請使用 HTTPS
- ⚠️ 定期更新依賴套件
- ⚠️ 實作速率限制

## 🤖 AI 輔助開發

這個專案使用 AI 工具開發：

- **GitHub Copilot** - 快速生成程式碼
- **Claude Code** - API 架構設計
- **ChatGPT** - 業務邏輯諮詢

### AI 開發提示範例

```
"幫我創建一個 FastAPI 的電商 API，包含用戶認證、
商品管理、購物車和訂單系統，使用 SQLAlchemy 和 PostgreSQL。"

"為購物車系統添加庫存檢查和自動扣減功能。"

"整合 Stripe 支付 API，包含支付意圖和 Webhook 處理。"
```

## 📖 學習資源

- [FastAPI 官方文檔](https://fastapi.tiangolo.com/)
- [SQLAlchemy 文檔](https://docs.sqlalchemy.org/)
- [Pydantic 文檔](https://docs.pydantic.dev/)
- [Stripe API 文檔](https://stripe.com/docs/api)
- [JWT 介紹](https://jwt.io/introduction)

## 🚀 下一步功能

- [ ] 商品評價系統
- [ ] 商品搜尋 (全文搜尋)
- [ ] 優惠券系統
- [ ] 會員等級與積分
- [ ] Email 通知 (訂單確認)
- [ ] 圖片上傳 (S3)
- [ ] 商品推薦系統
- [ ] 庫存預警
- [ ] 退款處理
- [ ] 管理後台 Dashboard

## 📄 授權

MIT License

---

**使用 AI 工具打造現代化電商 API！** 🛍️🤖✨
