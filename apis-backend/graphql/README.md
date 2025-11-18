# GraphQL API 專案 (GraphQL API Projects)
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的 GraphQL API 服務專案集合。

## 🎉 **全新增強！生產級 GraphQL API**

所有專案現已升級為**生產級、AI 驅動**的 GraphQL API，包含：

✨ **自定義 Scalars** - DateTime, Email, URL, PositiveInt 自動驗證
🛡️ **安全增強** - 查詢複雜度限制、深度限制、速率限制
🤖 **AI 功能** - 內容生成、SEO 優化、情感分析、智能推薦
⚡ **性能優化** - DataLoader、Cursor 分頁、智能快取
📊 **監控工具** - 查詢計時、性能分析、錯誤追蹤
🎯 **自定義 Directives** - @auth, @rateLimit, @cacheControl 等

👉 **查看詳細文檔**: [blog-graphql-api/ENHANCED_FEATURES.md](./blog-graphql-api/ENHANCED_FEATURES.md)

---

## 📋 目錄

- [最新功能](#最新功能)
- [什麼是 GraphQL](#什麼是-graphql)
- [GraphQL vs REST](#graphql-vs-rest)
- [技術棧選擇](#技術棧選擇)
- [專案範例](#專案範例)
- [共享工具](#共享工具)
- [開發指南](#開發指南)
- [AI 輔助開發建議](#ai-輔助開發建議)
- [最佳實踐](#最佳實踐)

---

## ✨ 最新功能

### 🚀 生產級增強功能

所有 GraphQL 專案現已包含以下生產級功能：

#### 1. **自定義 Scalars**
```graphql
type User {
  email: Email!        # 自動驗證和格式化
  createdAt: DateTime! # ISO 8601 格式
  avatar: URL          # URL 驗證
}
```

#### 2. **安全性 Directives**
```graphql
type Query {
  me: User @auth                    # 需要認證
  posts: [Post!]! @cacheControl(maxAge: 60)
}

type Mutation {
  register(...): AuthPayload @rateLimit(limit: 3, duration: 3600)
}
```

#### 3. **AI 輔助功能**
- 📝 **內容生成** - 自動摘要、SEO 優化
- 🏷️ **智能標籤** - AI 生成相關標籤
- 😊 **情感分析** - 分析內容情感傾向
- 🔍 **智能搜尋** - 搜尋建議和糾錯
- 💡 **內容推薦** - 個性化推薦系統
- ✍️ **創作輔助** - 大綱生成、內容擴展、校對、翻譯

#### 4. **性能優化**
- ⚡ **DataLoader** - 解決 N+1 查詢問題
- 📄 **Cursor 分頁** - 高效大型列表分頁
- 💾 **智能快取** - 可配置的查詢快取
- 📊 **性能監控** - 查詢計時和慢查詢追蹤

#### 5. **查詢安全**
```javascript
// 配置限制
MAX_QUERY_COMPLEXITY=1000  // 最大查詢複雜度
MAX_QUERY_DEPTH=10         // 最大嵌套深度
MAX_BATCH_SIZE=10          // 最大批次大小
```

### 📦 專案狀態

| 專案 | 基礎功能 | 增強功能 | AI 功能 | 文檔 |
|------|---------|---------|---------|------|
| **blog-graphql-api** | ✅ | ✅ | ✅ | ✅ [詳細文檔](./blog-graphql-api/ENHANCED_FEATURES.md) |
| **ecommerce-graphql** | ✅ | 🔄 | 📝 | ✅ [AI 功能](./ecommerce-graphql/AI_FEATURES.md) |
| **social-media-graphql** | ✅ | 🔄 | 📝 | ✅ [AI 功能](./social-media-graphql/AI_FEATURES.md) |
| **realtime-chat-graphql** | ✅ | 🔄 | 📝 | ✅ [AI 功能](./realtime-chat-graphql/AI_FEATURES.md) |

圖例：✅ 已完成 | 🔄 進行中 | 📝 已規劃

---

## 🛠️ 共享工具

所有專案可共享使用的工具和服務位於 [`shared-utils/`](./shared-utils/) 目錄：

### 可用工具
- **customScalars.js** - DateTime, Email, URL, PositiveInt
- **directives.js** - @auth, @rateLimit, @cacheControl, @validate
- **queryComplexity.js** - 複雜度限制、深度限制、性能監控
- **aiService.js** - AI 服務整合（支援 OpenAI、Anthropic、本地模型）

### 使用方式
```bash
# 複製到你的專案
cp -r blog-graphql-api/src/utils/* your-project/src/utils/
cp blog-graphql-api/src/services/aiService.js your-project/src/services/
```

詳見：[共享工具文檔](./shared-utils/README.md)

---

## 🎯 什麼是 GraphQL

GraphQL 是由 Facebook 開發的一種 API 查詢語言和執行時環境，讓客戶端能夠精確地請求所需的數據。

### GraphQL 的特點

✅ **精確查詢** - 客戶端只獲取需要的數據，避免過度獲取或獲取不足
✅ **單一端點** - 所有查詢都透過一個端點處理
✅ **強型別系統** - Schema 定義清晰的數據結構
✅ **即時文檔** - Schema 即文檔，自動生成 API 文檔
✅ **版本控制友善** - 無需 API 版本管理，可逐步演進
✅ **嵌套查詢** - 一次請求獲取關聯資源
✅ **即時更新** - 支援訂閱 (Subscriptions) 實現即時數據

---

## 🆚 GraphQL vs REST

| 特性 | GraphQL | REST |
|------|---------|------|
| 端點數量 | 單一端點 | 多個端點 |
| 數據獲取 | 精確查詢 | 固定結構 |
| 過度獲取 | ❌ 不會 | ✅ 常發生 |
| 多次請求 | ❌ 一次搞定 | ✅ 需要多次 |
| 文檔 | 自動生成 | 需手動維護 |
| 學習曲線 | 較陡 | 較平緩 |
| 快取 | 複雜 | 簡單 (HTTP) |
| 適用場景 | 複雜數據需求 | 簡單 CRUD |

### 何時使用 GraphQL？

✅ **複雜的數據關聯** - 需要嵌套查詢多層資源
✅ **移動應用** - 減少網路請求次數
✅ **多客戶端** - 不同客戶端有不同數據需求
✅ **快速迭代** - 前端可自主查詢需要的數據
✅ **即時應用** - 需要即時數據更新

### 何時使用 REST？

✅ **簡單 CRUD** - 標準的資源操作
✅ **快取重要** - 需要 HTTP 快取機制
✅ **檔案上傳** - 處理二進位數據
✅ **團隊熟悉度** - 團隊更熟悉 REST

---

## 🛠️ 技術棧選擇

### Node.js 生態系統 ⭐⭐⭐⭐⭐

#### 1. Apollo Server
- **難度**: ⭐⭐⭐
- **特點**: 功能完整、生態豐富、易於擴展
- **適用**: 各種規模的專案
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 2. GraphQL Yoga
- **難度**: ⭐⭐
- **特點**: 開箱即用、全功能、易於使用
- **適用**: 快速原型、中小型專案
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 3. Express + express-graphql
- **難度**: ⭐⭐
- **特點**: 輕量、靈活、與 Express 整合
- **適用**: 簡單專案、學習用途
- **AI 友好度**: ⭐⭐⭐⭐

### Python 生態系統 ⭐⭐⭐⭐

#### 1. Strawberry (推薦)
- **難度**: ⭐⭐
- **特點**: 現代化、型別提示、FastAPI 風格
- **適用**: Python 3.7+、型別安全需求
- **AI 友好度**: ⭐⭐⭐⭐⭐

#### 2. Graphene
- **難度**: ⭐⭐⭐
- **特點**: 成熟、功能完整、Django/Flask 整合
- **適用**: Django/Flask 專案
- **AI 友好度**: ⭐⭐⭐⭐

#### 3. Ariadne
- **難度**: ⭐⭐
- **特點**: Schema-first、ASGI 支援
- **適用**: 現代 Python 應用
- **AI 友好度**: ⭐⭐⭐⭐

### 其他選擇

- **Go (gqlgen)** - 高性能、代碼生成
- **Rust (async-graphql)** - 極致性能、型別安全
- **Java (GraphQL Java)** - 企業級應用
- **C# (.NET Hot Chocolate)** - .NET 生態

---

## 📁 專案範例

### 1️⃣ [blog-graphql-api](./blog-graphql-api)
**技術**: Apollo Server + MongoDB
**功能**: 部落格系統 GraphQL API
- 文章管理 (查詢、創建、更新、刪除)
- 用戶認證 (JWT)
- 評論系統
- 分類與標籤
- 嵌套查詢 (文章 → 作者 → 評論)
- 分頁與排序

**難度**: ⭐⭐⭐

### 2️⃣ [ecommerce-graphql](./ecommerce-graphql)
**技術**: GraphQL Yoga + PostgreSQL
**功能**: 電商平台 GraphQL API
- 商品查詢與管理
- 購物車操作
- 訂單處理
- 用戶系統
- 即時庫存更新 (Subscriptions)
- 複雜篩選與搜尋

**難度**: ⭐⭐⭐⭐

### 3️⃣ [social-media-graphql](./social-media-graphql)
**技術**: Apollo Server + PostgreSQL
**功能**: 社交媒體 GraphQL API
- 用戶關注系統
- 貼文 CRUD
- 按讚與評論
- 即時通知 (Subscriptions)
- 動態流 (Feed)
- 圖片上傳 (Mutation)

**難度**: ⭐⭐⭐⭐⭐

---

## 🚀 開發指南

### 快速開始 - Apollo Server

```bash
# 創建專案
mkdir my-graphql-api && cd my-graphql-api
npm init -y

# 安裝依賴
npm install @apollo/server graphql mongoose dotenv
npm install -D nodemon

# 創建基本結構
mkdir src
mkdir src/schema src/resolvers src/models
```

基本 Apollo Server 設定：

```javascript
// src/index.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const mongoose = require('mongoose');
require('dotenv').config();

// Type Definitions (Schema)
const typeDefs = `#graphql
  type Query {
    hello: String
    users: [User]
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    users: () => [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
    ]
  }
};

// 啟動伺服器
async function startServer() {
  // 連接資料庫
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  // 創建 Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // 啟動伺服器
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
}

startServer();
```

### Schema 定義範例

```graphql
# 類型定義
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  published: Boolean!
  createdAt: String!
  updatedAt: String!
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: String!
}

# 查詢
type Query {
  # 取得所有文章
  posts(limit: Int, offset: Int): [Post!]!

  # 取得單一文章
  post(id: ID!): Post

  # 搜尋文章
  searchPosts(query: String!): [Post!]!

  # 取得用戶
  user(id: ID!): User

  # 取得當前用戶
  me: User
}

# 變更
type Mutation {
  # 用戶註冊
  register(name: String!, email: String!, password: String!): AuthPayload!

  # 用戶登入
  login(email: String!, password: String!): AuthPayload!

  # 創建文章
  createPost(title: String!, content: String!): Post!

  # 更新文章
  updatePost(id: ID!, title: String, content: String): Post!

  # 刪除文章
  deletePost(id: ID!): Boolean!

  # 添加評論
  addComment(postId: ID!, content: String!): Comment!
}

# 訂閱
type Subscription {
  # 新文章通知
  postAdded: Post!

  # 評論通知
  commentAdded(postId: ID!): Comment!
}

# 認證回應
type AuthPayload {
  token: String!
  user: User!
}

# 輸入類型
input CreatePostInput {
  title: String!
  content: String!
  published: Boolean
}
```

### Resolver 範例

```javascript
const resolvers = {
  Query: {
    posts: async (parent, { limit = 10, offset = 0 }, context) => {
      return await Post.find()
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });
    },

    post: async (parent, { id }, context) => {
      return await Post.findById(id);
    },

    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      return await User.findById(context.user.id);
    }
  },

  Mutation: {
    createPost: async (parent, { title, content }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const post = await Post.create({
        title,
        content,
        author: context.user.id
      });

      return post;
    },

    deletePost: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const post = await Post.findById(id);

      if (post.author.toString() !== context.user.id) {
        throw new Error('Not authorized');
      }

      await Post.findByIdAndDelete(id);
      return true;
    }
  },

  // 欄位 Resolver (處理關聯)
  Post: {
    author: async (parent, args, context) => {
      return await User.findById(parent.author);
    },

    comments: async (parent, args, context) => {
      return await Comment.find({ post: parent.id });
    }
  },

  User: {
    posts: async (parent, args, context) => {
      return await Post.find({ author: parent.id });
    }
  }
};
```

---

## 🤖 AI 輔助開發建議

### 1. Schema 設計

**提示範例**:
```
"幫我設計一個電商平台的 GraphQL Schema，包含商品、購物車、
訂單、用戶等類型，並包含查詢、變更和訂閱操作。"
```

AI 可以幫助：
- 設計完整的 Schema
- 定義關聯關係
- 建議 Input 類型
- 設計 Subscription

### 2. Resolver 實作

**提示範例**:
```
"實作這個 GraphQL Mutation 的 Resolver，包含用戶認證、
輸入驗證、錯誤處理，使用 MongoDB。"
```

AI 可以生成：
- Resolver 邏輯
- 認證中間件
- 錯誤處理
- 數據驗證

### 3. N+1 問題解決

**提示範例**:
```
"這個查詢有 N+1 問題，幫我使用 DataLoader 優化，
減少資料庫查詢次數。"
```

AI 可以協助：
- 識別 N+1 問題
- 實作 DataLoader
- 批次查詢優化
- 快取策略

### 4. 訂閱 (Subscriptions) 實作

**提示範例**:
```
"實作即時聊天的 GraphQL Subscription，當有新訊息時
通知所有訂閱的客戶端。"
```

AI 可以幫助：
- PubSub 設定
- Subscription Resolver
- WebSocket 配置
- 即時通信邏輯

---

## 📖 最佳實踐

### 1. Schema 設計原則

#### 使用描述性命名
```graphql
✅ getUserById(id: ID!): User
❌ get(id: ID!): User
```

#### 合理使用 Nullable
```graphql
# ! 表示必填
type User {
  id: ID!              # 總是存在
  name: String!        # 必填
  bio: String          # 可選
  posts: [Post!]!      # 陣列不為 null，元素不為 null
}
```

#### 使用 Input 類型
```graphql
# 好的做法
input CreateUserInput {
  name: String!
  email: String!
  password: String!
}

mutation {
  createUser(input: CreateUserInput!): User!
}

# 避免太多參數
mutation {
  createUser(name: String!, email: String!, password: String!): User!
}
```

### 2. Resolver 最佳實踐

#### 認證與授權
```javascript
const resolvers = {
  Mutation: {
    deletePost: async (parent, { id }, context) => {
      // 認證檢查
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      const post = await Post.findById(id);

      // 授權檢查
      if (post.authorId !== context.user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      await Post.findByIdAndDelete(id);
      return true;
    }
  }
};
```

#### 錯誤處理
```javascript
const { GraphQLError } = require('graphql');

// 自定義錯誤
class ValidationError extends GraphQLError {
  constructor(message, field) {
    super(message, {
      extensions: {
        code: 'VALIDATION_ERROR',
        field
      }
    });
  }
}

// 使用
throw new ValidationError('Email is already taken', 'email');
```

### 3. 使用 DataLoader 解決 N+1 問題

```javascript
const DataLoader = require('dataloader');

// 創建 DataLoader
const userLoader = new DataLoader(async (userIds) => {
  const users = await User.find({ _id: { $in: userIds } });

  // 確保順序與 userIds 一致
  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  return userIds.map(id => userMap[id]);
});

// 在 context 中提供
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    loaders: {
      user: new DataLoader(batchGetUsers)
    }
  })
});

// 在 Resolver 中使用
const resolvers = {
  Post: {
    author: async (parent, args, { loaders }) => {
      return await loaders.user.load(parent.authorId);
    }
  }
};
```

### 4. 分頁實作

```graphql
type Query {
  posts(page: Int, limit: Int): PostConnection!
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### 5. 快取策略

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: 'bounded',
  plugins: [
    ApolloServerPluginCacheControl({
      defaultMaxAge: 5, // 5 秒
      calculateHttpHeaders: false
    })
  ]
});

// 在 Schema 中設定快取
type Query {
  posts: [Post!]! @cacheControl(maxAge: 60)
  post(id: ID!): Post @cacheControl(maxAge: 300)
}
```

---

## 🔒 安全考量

1. **查詢深度限制** - 防止過深的嵌套查詢
2. **查詢複雜度限制** - 限制查詢成本
3. **速率限制** - 防止濫用
4. **認證與授權** - 保護敏感操作
5. **輸入驗證** - 清理和驗證所有輸入
6. **避免暴露內部錯誤** - 生產環境隱藏詳細錯誤

---

## 📚 學習資源

### 官方文檔
- [GraphQL 官方](https://graphql.org/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)

### 工具
- **Apollo Studio** - GraphQL 開發工具
- **GraphQL Playground** - API 測試工具
- **GraphiQL** - 互動式查詢介面

---

**使用 AI 打造強大的 GraphQL API！** 🚀
