# 🚀 Enhanced Blog GraphQL API - 完整功能指南

這是一個生產級的、AI 驅動的 GraphQL API，包含現代 GraphQL 應用的所有最佳實踐和進階功能。

## 📋 目錄

- [功能概覽](#功能概覽)
- [快速開始](#快速開始)
- [核心增強功能](#核心增強功能)
- [AI 輔助功能](#ai-輔助功能)
- [安全性功能](#安全性功能)
- [性能優化](#性能優化)
- [使用範例](#使用範例)
- [配置選項](#配置選項)
- [部署指南](#部署指南)

---

## 🎯 功能概覽

### ✅ 已實現的功能

#### 1. **自定義 Scalars**
- `DateTime` - ISO 8601 日期時間格式，自動驗證
- `Email` - 電子郵件地址驗證和格式化
- `URL` - URL 驗證
- `PositiveInt` - 正整數驗證

#### 2. **自定義 Directives**
- `@auth(requires: Role)` - 認證和授權控制
- `@rateLimit(limit: Int, duration: Int)` - 速率限制
- `@cacheControl(maxAge: Int, scope: CacheControlScope)` - 快取控制
- `@validate(...)` - 輸入驗證
- `@deprecated(reason: String)` - 棄用標記

#### 3. **AI 輔助功能**
- 🤖 智能內容摘要生成
- 🎯 SEO 元數據自動生成
- 🏷️ 智能標籤生成
- 😊 情感分析
- 💡 內容改進建議
- 🔍 智能搜尋增強
- 📊 個性化推薦
- ✍️ 內容創作輔助（大綱生成、內容擴展）
- 📝 文字校對和翻譯

#### 4. **安全性功能**
- 🔐 JWT 認證
- 🛡️ 查詢複雜度限制
- 📏 查詢深度限制
- ⏱️ 速率限制（防止 API 濫用）
- 🔒 角色權限控制（ADMIN, USER, GUEST）
- 🚫 批次查詢大小限制

#### 5. **性能優化**
- ⚡ DataLoader N+1 問題解決
- 💾 智能快取策略
- 📄 Cursor-based 分頁
- 📊 查詢性能監控
- 🎯 數據庫索引優化
- ⏲️ 查詢計時追蹤

#### 6. **進階查詢功能**
- 🔍 全文搜尋
- 🎯 複雜篩選和排序
- 📄 Offset 和 Cursor 雙分頁支援
- 🔗 深度嵌套查詢（受控）
- 📊 統計和分析查詢

#### 7. **內容管理**
- 📝 完整的 CRUD 操作
- 🏷️ 標籤系統
- 📊 瀏覽數和按讚統計
- 💬 嵌套評論（支援回覆）
- 🔖 文章 slug 自動生成
- 📱 發布狀態管理

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd apis-backend/graphql/blog-graphql-api
npm install
```

### 2. 配置環境變數

複製 `.env.example` 到 `.env` 並配置：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# 基本配置
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/blog-graphql

# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# AI 服務（測試時可以使用 Mock 模式）
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your-api-key-here
```

### 3. 啟動服務器

**使用增強版服務器（推薦）：**

```bash
# 開發模式
node src/index.enhanced.js

# 或者配置 package.json
npm run dev:enhanced
```

**使用基本服務器：**

```bash
npm run dev
```

### 4. 訪問 GraphQL Playground

打開瀏覽器訪問：`http://localhost:4000/graphql`

---

## 🔧 核心增強功能

### 1. 自定義 Scalars

#### DateTime Scalar

自動處理日期時間的序列化、反序列化和驗證：

```graphql
type Post {
  createdAt: DateTime!  # 自動轉換為 ISO 8601 格式
  updatedAt: DateTime!
}

# 查詢時自動格式化
query {
  posts {
    createdAt  # 輸出: "2024-01-15T10:30:00.000Z"
  }
}
```

#### Email Scalar

自動驗證和格式化電子郵件：

```graphql
mutation {
  register(
    name: "John"
    email: "JOHN@EXAMPLE.COM"  # 自動轉為小寫
    password: "pass123"
  ) {
    user {
      email  # 輸出: "john@example.com"
    }
  }
}
```

#### URL Scalar

驗證 URL 格式：

```graphql
mutation {
  updateProfile(
    avatar: "https://example.com/avatar.jpg"  # 必須是有效 URL
  ) {
    avatar
  }
}
```

#### PositiveInt Scalar

只接受正整數：

```graphql
query {
  posts(limit: 10) {  # 必須 > 0，否則報錯
    id
  }
}
```

### 2. 自定義 Directives

#### @auth Directive

保護需要認證的操作：

```graphql
type Query {
  me: User @auth  # 需要登入
  adminPanel: Admin @auth(requires: ADMIN)  # 需要 ADMIN 權限
}
```

使用時需要在 HTTP Headers 中提供 token：

```json
{
  "Authorization": "Bearer your-jwt-token-here"
}
```

#### @rateLimit Directive

防止 API 濫用：

```graphql
type Mutation {
  # 每小時最多註冊 3 次
  register(...): AuthPayload @rateLimit(limit: 3, duration: 3600)

  # 每分鐘最多發送 10 封郵件
  sendEmail(...): Boolean @rateLimit(limit: 10, duration: 60)
}
```

#### @cacheControl Directive

控制查詢結果的快取時間：

```graphql
type Query {
  # 快取 60 秒
  posts: [Post!]! @cacheControl(maxAge: 60, scope: PUBLIC)

  # 快取 300 秒（5分鐘）
  trendingPosts: [Post!]! @cacheControl(maxAge: 300)
}
```

### 3. 查詢複雜度限制

防止過於複雜的查詢消耗過多資源：

```javascript
// 配置在 .env
MAX_QUERY_COMPLEXITY=1000
MAX_QUERY_DEPTH=10
```

**複雜度計算範例：**

```graphql
# 這個查詢的複雜度約為 40
query {
  posts(limit: 10) {    # 10
    title               # 10
    author {            # 10
      name              # 10
    }
  }
}
```

如果查詢超過限制，會收到錯誤：

```json
{
  "errors": [{
    "message": "Query is too complex: 1200. Maximum allowed complexity: 1000",
    "extensions": {
      "code": "QUERY_TOO_COMPLEX",
      "complexity": 1200,
      "maxComplexity": 1000
    }
  }]
}
```

### 4. DataLoader（N+1 問題解決）

自動批次處理和快取關聯數據查詢：

```graphql
# 這個查詢不會造成 N+1 問題
query {
  posts {
    title
    author {    # DataLoader 自動批次查詢所有作者
      name
    }
    comments {  # DataLoader 批次查詢所有評論
      content
      author {  # 再次批次查詢評論作者
        name
      }
    }
  }
}
```

**沒有 DataLoader：**
- 1 次查詢獲取文章
- N 次查詢獲取每篇文章的作者
- M 次查詢獲取所有評論
- P 次查詢獲取所有評論的作者
- **總計：1 + N + M + P 次查詢**

**有 DataLoader：**
- 1 次查詢獲取文章
- 1 次批次查詢獲取所有作者
- 1 次批次查詢獲取所有評論
- 1 次批次查詢獲取評論作者
- **總計：4 次查詢**

---

## 🤖 AI 輔助功能

### 配置 AI 服務

#### Mock 模式（無需 API Key）

```env
AI_MOCK_MODE=true
```

Mock 模式會返回預設的示範數據，適合開發和測試。

#### 真實 AI 服務

**使用 OpenAI：**

```env
AI_MOCK_MODE=false
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-3.5-turbo
```

**使用 Anthropic Claude：**

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_MODEL=claude-3-sonnet-20240229
```

**使用本地模型（Ollama）：**

```env
AI_PROVIDER=local
AI_MODEL=llama2
```

### AI 功能詳解

#### 1. 智能內容摘要

自動生成文章摘要（200 字以內）：

```graphql
mutation {
  generatePostSummary(postId: "post-id") # 返回摘要文字
}
```

**或在創建文章時自動生成：**

```graphql
mutation {
  createPost(input: {
    title: "My Post"
    content: "Long content..."
    generateSummary: true  # 自動生成摘要
  }) {
    excerpt  # 已經生成好了
  }
}
```

#### 2. SEO 元數據生成

自動生成 SEO 友好的標題、描述和關鍵字：

```graphql
mutation {
  generatePostSEO(postId: "post-id") {
    title          # 優化的標題（50-60 字符）
    description    # Meta 描述（150-160 字符）
    keywords       # 主要關鍵字列表
    slug           # URL slug
  }
}
```

#### 3. 智能標籤生成

基於內容自動生成相關標籤：

```graphql
mutation {
  generatePostTags(postId: "post-id")  # 返回: ["GraphQL", "API", "教程"]
}
```

#### 4. 情感分析

分析文章或評論的情感傾向：

```graphql
mutation {
  analyzePostSentiment(postId: "post-id") {
    overall      # POSITIVE, NEGATIVE, NEUTRAL, MIXED
    score        # 0-1 之間的分數
    emotions {
      joy
      trust
      surprise
      sadness
      anger
    }
    keywords     # 情感關鍵字
  }
}
```

#### 5. 內容改進建議

獲取 AI 的內容改進建議：

```graphql
mutation {
  suggestContentImprovements(postId: "post-id") {
    type         # content, structure, seo, etc.
    suggestion   # 具體建議
    priority     # 1-5，優先級
  }
}
```

#### 6. 內容創作輔助

**生成文章大綱：**

```graphql
mutation {
  generateOutline(
    topic: "GraphQL 最佳實踐"
    keywords: ["GraphQL", "性能", "安全"]
  )
}
```

**擴展內容：**

```graphql
mutation {
  expandContent(
    outline: "生成的大綱..."
    section: "性能優化"
  )
}
```

**校對內容：**

```graphql
mutation {
  proofreadContent(content: "需要校對的文字...")
}
```

**翻譯內容：**

```graphql
mutation {
  translateContent(
    content: "Hello, world!"
    targetLanguage: "繁體中文"
  )
}
```

#### 7. 智能推薦

基於內容相似度和用戶行為推薦文章：

```graphql
query {
  # 基於特定文章推薦
  recommendedPosts(postId: "post-id", limit: 5) {
    id
    title
  }

  # 或者在查詢文章時自動獲取推薦
  post(id: "post-id") {
    title
    aiRecommendations {  # Field resolver 自動處理
      id
      title
    }
  }
}
```

#### 8. 智能搜尋增強

當搜尋結果較少時，AI 會提供搜尋建議：

```graphql
query {
  enhancedSearch(query: "GraphQL") {
    query
    suggestions      # AI 生成的搜尋建議
    correctedQuery   # 拼寫糾正（如果需要）
  }
}
```

---

## 🔒 安全性功能

### 1. JWT 認證

**註冊：**

```graphql
mutation {
  register(
    name: "John Doe"
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token      # JWT token
    user {
      id
      name
      email
    }
    expiresAt  # Token 過期時間
  }
}
```

**登入：**

```graphql
mutation {
  login(
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user { id name }
    expiresAt
  }
}
```

**使用 Token：**

在所有需要認證的請求中，添加 HTTP Header：

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. 角色權限控制

系統支援三種角色：

- `ADMIN` - 管理員（完全權限）
- `USER` - 普通用戶
- `GUEST` - 訪客（受限權限）

```graphql
type Query {
  # 所有人都可以訪問
  posts: [Post!]!

  # 需要登入（任何角色）
  me: User @auth

  # 需要 ADMIN 角色
  allUsers: [User!]! @auth(requires: ADMIN)
}
```

### 3. 速率限制

防止 API 濫用：

| 操作 | 限制 | 時間窗口 |
|------|------|----------|
| 註冊 | 3 次 | 1 小時 |
| 登入 | 5 次 | 5 分鐘 |
| 創建文章 | 10 次 | 1 小時 |
| AI 操作 | 20 次 | 1 分鐘 |
| 評論 | 30 次 | 1 分鐘 |
| 按讚 | 100 次 | 1 分鐘 |

超過限制會收到錯誤：

```json
{
  "errors": [{
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "extensions": {
      "code": "RATE_LIMIT_EXCEEDED",
      "retryAfter": 45
    }
  }]
}
```

### 4. 查詢複雜度和深度限制

```env
MAX_QUERY_COMPLEXITY=1000  # 最大查詢複雜度
MAX_QUERY_DEPTH=10         # 最大嵌套深度
MAX_BATCH_SIZE=10          # 最大批次請求數
```

### 5. 輸入驗證

所有輸入都會經過嚴格驗證：

- Email 格式驗證
- URL 格式驗證
- 正整數驗證
- 字串長度限制
- 必填欄位檢查

---

## ⚡ 性能優化

### 1. Cursor-based 分頁

比 offset 分頁更高效，適合大型列表：

```graphql
query {
  postsConnection(first: 10) {
    edges {
      node {
        id
        title
      }
      cursor  # 用於下一頁
    }
    pageInfo {
      hasNextPage
      endCursor  # 傳給下一次查詢的 after 參數
      totalCount
    }
  }
}

# 獲取下一頁
query {
  postsConnection(first: 10, after: "cursor-from-previous-query") {
    ...
  }
}
```

### 2. 快取策略

使用 `@cacheControl` directive：

```graphql
type Query {
  # 快取 60 秒
  posts: [Post!]! @cacheControl(maxAge: 60, scope: PUBLIC)

  # 快取 120 秒
  post(id: ID!): Post @cacheControl(maxAge: 120)

  # 快取 5 分鐘
  trendingPosts: [Post!]! @cacheControl(maxAge: 300)

  # 私有快取（不同用戶有不同快取）
  me: User @cacheControl(maxAge: 0, scope: PRIVATE)
}
```

### 3. 數據庫索引

已優化的索引：

**Post Model：**
- 全文搜尋索引：`{ title: 'text', content: 'text' }`
- 查詢優化：`{ published: 1, createdAt: -1 }`
- 作者查詢：`{ author: 1, createdAt: -1 }`
- 熱門排序：`{ views: -1, likes: -1 }`
- 標籤查詢：`{ tags: 1 }`
- Slug 查詢：`{ slug: 1 }`（唯一）

**User Model：**
- Email 查詢：`{ email: 1 }`（唯一）

**Comment Model：**
- 文章評論：`{ post: 1, createdAt: -1 }`
- 作者評論：`{ author: 1 }`
- 嵌套評論：`{ parentComment: 1 }`

### 4. 查詢性能監控

每個查詢都會記錄執行時間：

```json
{
  "data": { ... },
  "extensions": {
    "timing": {
      "duration": 45  # 毫秒
    }
  }
}
```

慢查詢（>1 秒）會在開發環境中自動警告。

---

## 📝 使用範例

詳細的使用範例請參考：[examples/advanced-queries.md](./examples/advanced-queries.md)

### 完整工作流程範例

```graphql
# 1. 註冊用戶
mutation Step1Register {
  register(
    name: "Jane Blogger"
    email: "jane@blog.com"
    password: "secure123"
  ) {
    token
    user { id name }
  }
}

# 2. 創建文章（啟用 AI 增強）
mutation Step2CreatePost {
  createPost(input: {
    title: "GraphQL 性能優化指南"
    content: "詳細的文章內容..."
    generateSummary: true
    generateSEO: true
  }) {
    id
    title
    excerpt
  }
}

# 3. 獲取 AI 推薦和統計
query Step3GetPost($id: ID!) {
  post(id: $id) {
    title
    views
    likes

    # AI 自動推薦
    aiRecommendations {
      title
    }

    # AI 摘要
    aiSummary
  }
}

# 4. 分析情感
mutation Step4Analyze($id: ID!) {
  analyzePostSentiment(postId: $id) {
    overall
    score
  }
}
```

---

## ⚙️ 配置選項

### 環境變數完整列表

```env
# ========== 基本配置 ==========
PORT=4000
NODE_ENV=development

# ========== 資料庫 ==========
MONGODB_URI=mongodb://localhost:27017/blog-graphql

# ========== JWT 認證 ==========
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d

# ========== AI 服務 ==========
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=gpt-3.5-turbo

# ========== 查詢限制 ==========
MAX_QUERY_COMPLEXITY=1000
MAX_QUERY_DEPTH=10
MAX_BATCH_SIZE=10

# ========== 快取（可選）==========
REDIS_URL=redis://localhost:6379

# ========== CORS ==========
CORS_ORIGIN=http://localhost:3000

# ========== 日誌 ==========
LOG_LEVEL=info
```

### package.json Scripts

添加到 `package.json`：

```json
{
  "scripts": {
    "start": "node src/index.js",
    "start:enhanced": "node src/index.enhanced.js",
    "dev": "nodemon src/index.js",
    "dev:enhanced": "nodemon src/index.enhanced.js",
    "test": "node examples/test-queries.js"
  }
}
```

---

## 🚢 部署指南

### 生產環境配置

```env
NODE_ENV=production
PORT=4000

# 使用真實的資料庫
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/blog

# 強密碼
JWT_SECRET=use-a-very-strong-random-secret-here

# 配置 AI 服務
AI_MOCK_MODE=false
AI_PROVIDER=openai
AI_API_KEY=your-real-api-key

# 安全限制
MAX_QUERY_COMPLEXITY=500
MAX_QUERY_DEPTH=5
```

### Docker 部署（即將支援）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 4000
CMD ["node", "src/index.enhanced.js"]
```

---

## 🎓 最佳實踐

### 1. 查詢優化

✅ **好的做法：**
```graphql
query {
  posts(limit: 10) {  # 使用分頁
    id
    title
    excerpt  # 只請求需要的欄位
  }
}
```

❌ **避免：**
```graphql
query {
  posts {  # 沒有限制，可能返回太多數據
    id
    title
    content  # 大欄位
    author {
      posts {  # 過深的嵌套
        comments {
          author {
            posts {  # 更深的嵌套！
              ...
            }
          }
        }
      }
    }
  }
}
```

### 2. 使用變數

✅ **好的做法：**
```graphql
query GetPost($id: ID!) {
  post(id: $id) { title }
}
```

❌ **避免：**
```graphql
query {
  post(id: "hardcoded-id") { title }
}
```

### 3. 錯誤處理

總是檢查錯誤：

```javascript
const response = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({ query, variables }),
  headers: { 'Content-Type': 'application/json' }
});

const { data, errors } = await response.json();

if (errors) {
  errors.forEach(error => {
    console.error(`[${error.extensions?.code}] ${error.message}`);
  });
}
```

---

## 📚 相關文件

- [進階查詢範例](./examples/advanced-queries.md)
- [主README](./README.md)
- [GraphQL 官方文檔](https://graphql.org/)
- [Apollo Server 文檔](https://www.apollographql.com/docs/apollo-server/)

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**使用 AI 打造更智能、更強大的 GraphQL API！** 🚀
