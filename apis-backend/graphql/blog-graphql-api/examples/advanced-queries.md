# Blog GraphQL API - 進階查詢範例

這個文件展示了所有增強功能的使用方法，包括自定義 Scalars、Directives、AI 功能等。

## 📋 目錄

- [基本查詢](#基本查詢)
- [AI 輔助功能](#ai-輔助功能)
- [智能搜尋和推薦](#智能搜尋和推薦)
- [分頁查詢](#分頁查詢)
- [自定義 Scalars 使用](#自定義-scalars-使用)
- [進階 Mutations](#進階-mutations)

---

## 🔍 基本查詢

### 1. 獲取文章列表（使用快取控制）

```graphql
query GetPosts {
  posts(limit: 10, offset: 0) {
    id
    title
    excerpt
    author {
      id
      name
      email  # Email scalar - 自動驗證和格式化
    }
    tags
    views
    likes
    createdAt  # DateTime scalar - ISO 8601 格式
    updatedAt
  }
}
```

### 2. 獲取單一文章（完整詳情）

```graphql
query GetPost($id: ID!) {
  post(id: $id) {
    id
    title
    content
    excerpt
    slug
    author {
      id
      name
      email
      avatar  # URL scalar - 自動驗證
      bio
    }
    comments {
      id
      content
      author {
        name
      }
      createdAt
    }
    tags
    published
    views
    likes
    createdAt
    updatedAt
  }
}
```

變數：
```json
{
  "id": "your-post-id-here"
}
```

### 3. 獲取當前用戶（需要認證）

```graphql
query GetMe {
  me {
    id
    name
    email
    bio
    role
    posts {
      id
      title
      published
    }
    createdAt
  }
}
```

HTTP Headers：
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 🤖 AI 輔助功能

### 1. 生成文章摘要

```graphql
mutation GenerateSummary($postId: ID!) {
  generatePostSummary(postId: $postId)
}
```

變數：
```json
{
  "postId": "your-post-id"
}
```

### 2. 生成 SEO 元數據

```graphql
mutation GenerateSEO($postId: ID!) {
  generatePostSEO(postId: $postId) {
    title
    description
    keywords
    slug
    ogImage
  }
}
```

### 3. 自動生成標籤

```graphql
mutation GenerateTags($postId: ID!) {
  generatePostTags(postId: $postId)
}
```

### 4. 情感分析

```graphql
mutation AnalyzeSentiment($postId: ID!) {
  analyzePostSentiment(postId: $postId) {
    overall
    score
    emotions {
      joy
      trust
      surprise
      sadness
      anger
    }
    keywords
  }
}
```

### 5. 內容改進建議

```graphql
mutation GetImprovements($postId: ID!) {
  suggestContentImprovements(postId: $postId) {
    type
    suggestion
    priority
  }
}
```

### 6. 生成文章大綱

```graphql
mutation GenerateOutline($topic: String!, $keywords: [String!]) {
  generateOutline(topic: $topic, keywords: $keywords)
}
```

變數：
```json
{
  "topic": "GraphQL 最佳實踐指南",
  "keywords": ["GraphQL", "API", "最佳實踐", "性能優化"]
}
```

### 7. 擴展內容

```graphql
mutation ExpandContent($outline: String!, $section: String!) {
  expandContent(outline: $outline, section: $section)
}
```

### 8. 校對內容

```graphql
mutation ProofreadContent($content: String!) {
  proofreadContent(content: $content)
}
```

### 9. 翻譯內容

```graphql
mutation TranslateContent($content: String!, $targetLanguage: String!) {
  translateContent(content: $content, targetLanguage: $targetLanguage)
}
```

變數：
```json
{
  "content": "Hello, this is a test content.",
  "targetLanguage": "繁體中文"
}
```

---

## 🔎 智能搜尋和推薦

### 1. 基本搜尋

```graphql
query SearchPosts($query: String!) {
  searchPosts(query: $query) {
    id
    title
    excerpt
    author {
      name
    }
    createdAt
  }
}
```

### 2. 增強搜尋（AI 輔助）

```graphql
query EnhancedSearch($query: String!) {
  enhancedSearch(query: $query) {
    query
    suggestions
    correctedQuery
  }
}
```

### 3. 推薦文章

```graphql
query GetRecommendations($postId: ID, $limit: PositiveInt) {
  recommendedPosts(postId: $postId, limit: $limit) {
    id
    title
    excerpt
    author {
      name
    }
    tags
  }
}
```

### 4. 趨勢文章

```graphql
query GetTrendingPosts($limit: PositiveInt) {
  trendingPosts(limit: $limit) {
    id
    title
    views
    likes
    author {
      name
    }
    createdAt
  }
}
```

### 5. 文章的 AI 推薦（Field Resolver）

```graphql
query GetPostWithRecommendations($id: ID!) {
  post(id: $id) {
    id
    title
    content

    # AI 自動推薦相關文章
    aiRecommendations {
      id
      title
      excerpt
    }

    # AI 生成的摘要
    aiSummary

    # AI 情感分析
    aiSentiment {
      overall
      score
    }
  }
}
```

---

## 📄 分頁查詢

### 1. Offset-based 分頁（簡單）

```graphql
query GetPostsPaginated($limit: PositiveInt, $offset: Int) {
  posts(limit: $limit, offset: $offset) {
    id
    title
    createdAt
  }
}
```

變數：
```json
{
  "limit": 10,
  "offset": 20
}
```

### 2. Cursor-based 分頁（推薦）

```graphql
query GetPostsConnection($first: PositiveInt, $after: String) {
  postsConnection(first: $first, after: $after) {
    edges {
      node {
        id
        title
        excerpt
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
      totalCount
    }
    totalCount
  }
}
```

變數（首頁）：
```json
{
  "first": 10
}
```

變數（下一頁）：
```json
{
  "first": 10,
  "after": "cursor-from-previous-query"
}
```

### 3. 帶篩選和排序的分頁

```graphql
query GetFilteredPosts(
  $first: PositiveInt
  $after: String
  $filter: PostFilter
  $sort: PostSort
) {
  postsConnection(
    first: $first
    after: $after
    filter: $filter
    sort: $sort
  ) {
    edges {
      node {
        id
        title
        tags
        views
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
      totalCount
    }
  }
}
```

變數：
```json
{
  "first": 10,
  "filter": {
    "published": true,
    "tags": ["GraphQL", "教程"],
    "dateFrom": "2024-01-01T00:00:00Z"
  },
  "sort": {
    "field": "VIEWS",
    "order": "DESC"
  }
}
```

---

## 🎨 自定義 Scalars 使用

### DateTime Scalar

```graphql
# 查詢時使用
query GetRecentPosts {
  posts(limit: 5) {
    title
    createdAt  # 返回: "2024-01-15T10:30:00.000Z"
  }
}

# Mutation 時使用
mutation CreateScheduledPost {
  createPost(input: {
    title: "Scheduled Post"
    content: "This is a scheduled post"
    publishAt: "2024-12-31T23:59:59Z"  # DateTime scalar
  }) {
    id
    title
  }
}
```

### Email Scalar

```graphql
# 自動驗證和格式化email
mutation Register {
  register(
    name: "John Doe"
    email: "JOHN@EXAMPLE.COM"  # 自動轉為小寫
    password: "securepass123"
  ) {
    token
    user {
      email  # 返回: "john@example.com"
    }
  }
}
```

### URL Scalar

```graphql
# 自動驗證 URL 格式
mutation UpdateProfile {
  updateProfile(
    avatar: "https://example.com/avatar.jpg"  # 必須是有效的 URL
  ) {
    avatar
  }
}
```

### PositiveInt Scalar

```graphql
# 只接受正整數
query GetPosts {
  posts(limit: 10) {  # 必須 > 0
    id
  }
}
```

---

## ✏️ 進階 Mutations

### 1. 創建文章（帶 AI 增強）

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    content
    excerpt  # 如果 generateSummary: true，會自動生成
    tags     # 如果沒提供，AI 可以生成
    slug
    aiSEO {  # 如果 generateSEO: true
      title
      description
      keywords
    }
  }
}
```

變數：
```json
{
  "input": {
    "title": "GraphQL 完整指南",
    "content": "這是一篇關於 GraphQL 的詳細教程...",
    "tags": ["GraphQL", "API", "教程"],
    "published": true,
    "generateSEO": true,
    "generateSummary": true
  }
}
```

### 2. 更新文章

```graphql
mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
  updatePost(id: $id, input: $input) {
    id
    title
    updatedAt
  }
}
```

### 3. 刪除文章

```graphql
mutation DeletePost($id: ID!) {
  deletePost(id: $id)
}
```

### 4. 添加評論（帶嵌套回覆）

```graphql
mutation AddComment($postId: ID!, $content: String!, $parentId: ID) {
  addComment(postId: $postId, content: $content, parentId: $parentId) {
    id
    content
    author {
      name
    }
    parentComment {
      id
      content
    }
    createdAt
  }
}
```

### 5. 按讚文章

```graphql
mutation LikePost($postId: ID!) {
  likePost(postId: $postId) {
    id
    likes
  }
}
```

### 6. 更新個人資料

```graphql
mutation UpdateProfile($name: String, $bio: String, $avatar: URL) {
  updateProfile(name: $name, bio: $bio, avatar: $avatar) {
    id
    name
    bio
    avatar
    updatedAt
  }
}
```

---

## 🔐 認證範例

### 1. 註冊

```graphql
mutation Register {
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
      role
    }
    expiresAt
  }
}
```

### 2. 登入

```graphql
mutation Login {
  login(
    email: "john@example.com"
    password: "securepassword123"
  ) {
    token
    user {
      id
      name
      email
    }
    expiresAt
  }
}
```

### 3. 修改密碼

```graphql
mutation ChangePassword {
  changePassword(
    oldPassword: "oldpassword123"
    newPassword: "newpassword456"
  )
}
```

---

## 📊 統計查詢

```graphql
query GetStats {
  stats {
    totalPosts
    totalUsers
    totalComments
    postsToday
  }
}
```

---

## 🔧 測試 Directives

### @auth Directive

```graphql
# 這個查詢需要認證
query GetMyPosts {
  me {  # @auth directive
    posts {
      title
    }
  }
}
```

### @rateLimit Directive

```graphql
# 註冊受到速率限制：每小時最多 3 次
mutation Register {
  register(  # @rateLimit(limit: 3, duration: 3600)
    name: "Test"
    email: "test@example.com"
    password: "pass123"
  ) {
    token
  }
}
```

### @cacheControl Directive

```graphql
# 這個查詢的結果會被快取 60 秒
query GetCachedPosts {
  posts {  # @cacheControl(maxAge: 60)
    title
  }
}
```

---

## 🧪 完整工作流程範例

### 完整的內容創作流程

```graphql
# 1. 生成文章大綱
mutation Step1_GenerateOutline {
  generateOutline(
    topic: "GraphQL 性能優化"
    keywords: ["GraphQL", "性能", "優化", "DataLoader"]
  )
}

# 2. 創建文章
mutation Step2_CreatePost {
  createPost(input: {
    title: "GraphQL 性能優化完全指南"
    content: "您的文章內容..."
    generateSEO: true
    generateSummary: true
  }) {
    id
  }
}

# 3. 生成標籤
mutation Step3_GenerateTags($postId: ID!) {
  generatePostTags(postId: $postId)
}

# 4. 分析情感
mutation Step4_AnalyzeSentiment($postId: ID!) {
  analyzePostSentiment(postId: $postId) {
    overall
    score
  }
}

# 5. 獲取改進建議
mutation Step5_GetSuggestions($postId: ID!) {
  suggestContentImprovements(postId: $postId) {
    type
    suggestion
    priority
  }
}

# 6. 發布並查看推薦
query Step6_ViewPost($postId: ID!) {
  post(id: $postId) {
    title
    excerpt
    aiSEO {
      title
      description
      keywords
    }
    aiRecommendations {
      title
    }
  }
}
```

---

## 💡 提示和最佳實踐

1. **使用變數**：總是使用 GraphQL 變數而不是字串插值
2. **請求所需欄位**：只請求你需要的欄位以優化性能
3. **利用 AI 功能**：在創建內容時使用 AI 輔助功能提高質量
4. **使用 Cursor 分頁**：對於大型列表，使用 cursor-based pagination
5. **快取查詢**：利用 @cacheControl directive 優化響應時間
6. **錯誤處理**：總是檢查 GraphQL 錯誤響應
7. **認證**：敏感操作務必帶上 JWT token

---

**使用 AI 打造更智能的 GraphQL API！** 🚀
