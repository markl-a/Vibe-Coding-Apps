# 🛒 電商平台 GraphQL API (E-commerce GraphQL API)

使用 **GraphQL Yoga** 和 **PostgreSQL** 構建的全功能電商平台 GraphQL API。

## ✨ 功能特性

### 🎯 核心功能
- ✅ **商品管理** - 商品 CRUD、分類、庫存管理
- ✅ **購物車系統** - 添加商品、更新數量、清空購物車
- ✅ **訂單處理** - 創建訂單、訂單狀態追蹤
- ✅ **用戶系統** - 註冊、登入、JWT 認證
- ✅ **即時庫存** - GraphQL Subscriptions 實現即時庫存更新
- ✅ **商品搜尋** - 支援關鍵字搜尋、分類篩選、價格範圍
- ✅ **評論系統** - 商品評價與評論

### 🛠️ 技術棧
- **GraphQL Yoga** - 現代化的 GraphQL 服務器
- **PostgreSQL** - 關聯式資料庫
- **JWT** - 用戶認證
- **bcryptjs** - 密碼加密
- **UUID** - 唯一識別碼生成

## 📦 安裝

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 檔案，填入你的資料庫配置

# 啟動開發服務器
npm run dev

# 生產環境啟動
npm start
```

## 🗄️ 資料庫設定

### PostgreSQL 設定

```bash
# 登入 PostgreSQL
psql -U postgres

# 創建資料庫
CREATE DATABASE ecommerce_db;

# 切換到資料庫
\c ecommerce_db

# 創建表格（Tables）
```

### 資料表結構

```sql
-- 用戶表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分類表
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 購物車表
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- 訂單表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單項目表
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品評論表
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引以提升查詢效能
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
```

## 🚀 GraphQL Schema

### 查詢 (Queries)

```graphql
type Query {
  # 商品查詢
  products(
    limit: Int
    offset: Int
    category: String
    minPrice: Float
    maxPrice: Float
    search: String
  ): [Product!]!

  product(id: ID!): Product

  # 分類
  categories: [Category!]!

  # 購物車
  myCart: [CartItem!]!

  # 訂單
  myOrders: [Order!]!
  order(id: ID!): Order

  # 用戶
  me: User
}
```

### 變更 (Mutations)

```graphql
type Mutation {
  # 用戶認證
  register(name: String!, email: String!, password: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!

  # 購物車操作
  addToCart(productId: ID!, quantity: Int!): CartItem!
  updateCartItem(productId: ID!, quantity: Int!): CartItem!
  removeFromCart(productId: ID!): Boolean!
  clearCart: Boolean!

  # 訂單
  createOrder: Order!
  updateOrderStatus(orderId: ID!, status: String!): Order!

  # 商品管理（需管理員權限）
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!

  # 評論
  addReview(productId: ID!, rating: Int!, comment: String): Review!
}
```

### 訂閱 (Subscriptions)

```graphql
type Subscription {
  # 商品庫存更新通知
  productStockUpdated(productId: ID): Product!

  # 新訂單通知（管理員用）
  newOrder: Order!
}
```

## 📖 使用範例

### 1. 用戶註冊

```graphql
mutation {
  register(
    name: "John Doe"
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user {
      id
      name
      email
    }
  }
}
```

### 2. 查詢商品

```graphql
query {
  products(limit: 10, category: "electronics", minPrice: 100) {
    id
    name
    description
    price
    stock
    category {
      name
    }
    reviews {
      rating
      comment
      user {
        name
      }
    }
  }
}
```

### 3. 添加到購物車

```graphql
mutation {
  addToCart(productId: "abc-123", quantity: 2) {
    id
    product {
      name
      price
    }
    quantity
  }
}
```

### 4. 創建訂單

```graphql
mutation {
  createOrder {
    id
    totalAmount
    status
    items {
      product {
        name
      }
      quantity
      price
    }
  }
}
```

### 5. 訂閱庫存更新

```graphql
subscription {
  productStockUpdated(productId: "abc-123") {
    id
    name
    stock
  }
}
```

## 🔐 認證

API 使用 JWT (JSON Web Token) 進行用戶認證。

### 在請求中包含 Token

```javascript
// HTTP Headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### GraphQL Playground 設定

在 GraphQL Playground 的 HTTP HEADERS 區域添加：

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🧪 測試

啟動服務器後，訪問 GraphQL Playground：

```
http://localhost:4001/graphql
```

## 📊 API 端點

- **GraphQL Endpoint**: `http://localhost:4001/graphql`
- **GraphQL Subscriptions**: `ws://localhost:4001/graphql`

## 🎯 資料流程

```
客戶端
  ↓ GraphQL Query/Mutation
GraphQL Yoga Server
  ↓ Resolvers
PostgreSQL Database
  ↓ Data
GraphQL Response
  ↓
客戶端
```

## 🔧 進階配置

### 分頁實作

```graphql
query {
  products(limit: 20, offset: 0) {
    id
    name
    price
  }
}
```

### 複雜搜尋

```graphql
query {
  products(
    search: "laptop"
    category: "electronics"
    minPrice: 500
    maxPrice: 2000
  ) {
    id
    name
    price
    stock
  }
}
```

## 🚨 錯誤處理

API 回傳標準的 GraphQL 錯誤格式：

```json
{
  "errors": [
    {
      "message": "Product not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

## 📝 開發建議

### 使用 AI 輔助開發

```
"幫我擴展這個電商 API，增加優惠券功能，包含 Schema 定義、
Resolver 實作，以及資料庫表格設計。"
```

### N+1 問題優化

考慮使用 DataLoader 來批次載入關聯資料：

```javascript
const productLoader = new DataLoader(async (productIds) => {
  // 批次查詢商品
  const products = await db.query(
    'SELECT * FROM products WHERE id = ANY($1)',
    [productIds]
  );
  return productIds.map(id =>
    products.rows.find(p => p.id === id)
  );
});
```

## 🎨 專案結構

```
ecommerce-graphql/
├── src/
│   ├── schema/
│   │   └── typeDefs.js      # GraphQL Schema 定義
│   ├── resolvers/
│   │   └── index.js         # GraphQL Resolvers
│   ├── models/
│   │   ├── Product.js       # 商品模型
│   │   ├── User.js          # 用戶模型
│   │   ├── Order.js         # 訂單模型
│   │   └── CartItem.js      # 購物車模型
│   ├── utils/
│   │   ├── db.js            # 資料庫連接
│   │   └── auth.js          # 認證工具
│   └── index.js             # 主入口
├── .env.example             # 環境變數範例
├── .gitignore
├── package.json
└── README.md
```

## 🌟 功能擴展建議

- [ ] 商品圖片上傳
- [ ] 優惠券系統
- [ ] 願望清單 (Wishlist)
- [ ] 商品推薦算法
- [ ] 訂單追蹤
- [ ] 退款處理
- [ ] 多貨幣支援
- [ ] 多語言支援

## 📄 授權

MIT License

---

**使用 AI 和 GraphQL Yoga 打造高效能電商 API！** 🚀
