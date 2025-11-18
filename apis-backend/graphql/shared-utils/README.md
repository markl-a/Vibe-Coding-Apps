# Shared GraphQL Utilities

這個目錄包含所有 Vibe GraphQL 專案共享的工具和服務。

## 📦 包含的工具

### 1. Custom Scalars
- `DateTime` - ISO 8601 日期時間
- `Email` - 電子郵件驗證
- `URL` - URL 驗證
- `PositiveInt` - 正整數驗證

### 2. Custom Directives
- `@auth` - 認證和授權
- `@rateLimit` - 速率限制
- `@cacheControl` - 快取控制
- `@validate` - 輸入驗證
- `@deprecated` - 棄用標記

### 3. Query Complexity Tools
- 查詢複雜度限制
- 查詢深度限制
- 性能監控插件
- 查詢計時

### 4. AI Service
- 內容生成
- SEO 優化
- 標籤生成
- 情感分析
- 智能推薦
- 搜尋增強

## 🚀 使用方式

### 方法 1：直接複製（推薦）

從 `blog-graphql-api` 複製所需文件到你的專案：

```bash
# 複製工具
cp -r blog-graphql-api/src/utils/* your-project/src/utils/

# 複製 AI 服務
cp blog-graphql-api/src/services/aiService.js your-project/src/services/

# 複製增強的 schema 和 resolvers（可選）
cp blog-graphql-api/src/schema/typeDefsEnhanced.js your-project/src/schema/
cp blog-graphql-api/src/resolvers/enhancedResolvers.js your-project/src/resolvers/
```

### 方法 2：符號連結

```bash
cd your-project/src
ln -s ../../shared-utils/src ./shared

# 然後在代碼中
const { DateTimeScalar } = require('./shared/customScalars');
```

### 方法 3：作為 npm 包（未來）

```bash
npm install @vibe-graphql/shared-utils
```

## 📝 示例

### 使用 Custom Scalars

```javascript
const { DateTimeScalar, EmailScalar, URLScalar, PositiveIntScalar } = require('./utils/customScalars');

const resolvers = {
  DateTime: DateTimeScalar,
  Email: EmailScalar,
  URL: URLScalar,
  PositiveInt: PositiveIntScalar,
  // ... 你的其他 resolvers
};
```

### 使用 Directives

```javascript
const { authDirective, rateLimitDirective } = require('./utils/directives');
const { makeExecutableSchema } = require('@graphql-tools/schema');

let schema = makeExecutableSchema({
  typeDefs: [
    authDirective().authDirectiveTypeDefs,
    rateLimitDirective().rateLimitDirectiveTypeDefs,
    yourTypeDefs,
  ],
  resolvers,
});

schema = authDirective().authDirectiveTransformer(schema);
schema = rateLimitDirective().rateLimitDirectiveTransformer(schema);
```

### 使用 AI Service

```javascript
const aiService = require('./services/aiService');

// 在 resolver 中
const summary = await aiService.generateSummary(content, 200);
const tags = await aiService.generateTags(content, 5);
const seo = await aiService.generateSEOContent(title, content);
```

### 使用 Query Complexity

```javascript
const { createPerformancePlugins, createDepthLimitRule } = require('./utils/queryComplexity');

const server = new ApolloServer({
  schema,
  plugins: createPerformancePlugins({
    maxComplexity: 1000,
    maxBatchSize: 10,
  }),
  validationRules: [createDepthLimitRule(10)],
});
```

## 🔧 配置

所有工具都可以通過環境變數配置：

```env
# AI Service
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your-key

# Query Limits
MAX_QUERY_COMPLEXITY=1000
MAX_QUERY_DEPTH=10
MAX_BATCH_SIZE=10
```

## 📚 文檔

詳細文檔請參考 `blog-graphql-api/ENHANCED_FEATURES.md`

## 🤝 貢獻

如果你在某個專案中改進了這些工具，記得同步回這個共享目錄！

---

**使用這些工具讓所有 GraphQL 專案都受益於 AI 增強！** 🚀
