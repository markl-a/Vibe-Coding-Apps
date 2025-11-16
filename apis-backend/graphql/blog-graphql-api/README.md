# Blog GraphQL API 📝
🤖 **AI-Driven GraphQL API** 🚀

功能完整的部落格系統 GraphQL API，使用 Apollo Server 和 MongoDB 構建。

## ✨ 功能特點

- ✅ 用戶註冊與登入 (JWT 認證)
- ✅ 文章 CRUD 操作
- ✅ 評論系統
- ✅ 分類與標籤
- ✅ 嵌套查詢 (文章 → 作者 → 評論)
- ✅ 分頁與排序
- ✅ 搜尋功能
- ✅ DataLoader (解決 N+1 問題)
- ✅ 強型別 Schema
- ✅ 錯誤處理

## 🛠️ 技術棧

- **GraphQL**: Apollo Server 4
- **資料庫**: MongoDB with Mongoose
- **認證**: JWT (JSON Web Tokens)
- **優化**: DataLoader

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境配置

```bash
cp .env.example .env
```

編輯 `.env`:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/blog-graphql
JWT_SECRET=your-secret-key
```

### 3. 啟動 MongoDB

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### 4. 運行開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:4000` 啟動，並提供 Apollo Sandbox 介面。

## 📖 GraphQL Schema

### 查詢 (Queries)

```graphql
# 取得所有文章
query {
  posts(limit: 10, offset: 0) {
    id
    title
    content
    author {
      id
      name
      email
    }
    comments {
      id
      content
      author {
        name
      }
    }
    createdAt
  }
}

# 取得單一文章
query {
  post(id: "123") {
    id
    title
    content
    author {
      name
    }
  }
}

# 搜尋文章
query {
  searchPosts(query: "GraphQL") {
    id
    title
  }
}

# 取得當前用戶
query {
  me {
    id
    name
    email
    posts {
      id
      title
    }
  }
}
```

### 變更 (Mutations)

```graphql
# 註冊
mutation {
  register(
    name: "John Doe"
    email: "john@example.com"
    password: "password123"
  ) {
    token
    user {
      id
      name
      email
    }
  }
}

# 登入
mutation {
  login(
    email: "john@example.com"
    password: "password123"
  ) {
    token
    user {
      id
      name
    }
  }
}

# 創建文章
mutation {
  createPost(
    title: "GraphQL 入門指南"
    content: "GraphQL 是一種強大的 API 查詢語言..."
    published: true
  ) {
    id
    title
    author {
      name
    }
  }
}

# 更新文章
mutation {
  updatePost(
    id: "123"
    title: "更新後的標題"
    content: "更新後的內容"
  ) {
    id
    title
  }
}

# 刪除文章
mutation {
  deletePost(id: "123")
}

# 添加評論
mutation {
  addComment(
    postId: "123"
    content: "很棒的文章！"
  ) {
    id
    content
    author {
      name
    }
  }
}
```

## 🔐 認證

所有需要認證的操作都需要在 HTTP Header 中提供 JWT Token：

```
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

在 Apollo Sandbox 中設定：
1. 點擊底部的 "Headers"
2. 添加 Authorization header
3. 值為 `Bearer <token>`

## 📊 資料模型

### User
```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  createdAt: String!
}
```

### Post
```graphql
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
```

### Comment
```graphql
type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: String!
}
```

## 📂 專案結構

```
blog-graphql-api/
├── src/
│   ├── index.js              # 應用程式入口
│   ├── schema/
│   │   └── typeDefs.js       # GraphQL Schema 定義
│   ├── resolvers/
│   │   ├── index.js          # Resolver 整合
│   │   ├── userResolvers.js  # 用戶 Resolvers
│   │   ├── postResolvers.js  # 文章 Resolvers
│   │   └── commentResolvers.js # 評論 Resolvers
│   ├── models/
│   │   ├── User.js           # 用戶模型
│   │   ├── Post.js           # 文章模型
│   │   └── Comment.js        # 評論模型
│   └── utils/
│       ├── auth.js           # 認證工具
│       └── dataLoaders.js    # DataLoader 配置
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🎯 範例查詢

### 取得文章及其作者和評論

```graphql
query GetPostWithDetails {
  post(id: "123") {
    id
    title
    content
    author {
      id
      name
      email
      posts {
        id
        title
      }
    }
    comments {
      id
      content
      author {
        name
      }
      createdAt
    }
    createdAt
  }
}
```

### 創建文章並返回完整資訊

```graphql
mutation CreatePostComplete {
  createPost(
    title: "AI 輔助開發 GraphQL API"
    content: "使用 AI 工具可以大幅提升開發效率..."
  ) {
    id
    title
    content
    author {
      name
      email
    }
    createdAt
  }
}
```

## 🚀 部署

### Railway

```bash
railway login
railway init
railway add # 選擇 MongoDB
railway up
```

### Heroku

```bash
heroku create your-app-name
heroku addons:create mongolab
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

## 📚 學習資源

- [Apollo Server 文檔](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL 官方教程](https://graphql.org/learn/)
- [Mongoose 文檔](https://mongoosejs.com/)

---

**使用 AI 輔助開發，快速構建 GraphQL API！** 🚀
