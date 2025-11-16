# 📱 社交媒體 GraphQL API (Social Media GraphQL API)

使用 **Apollo Server** 和 **PostgreSQL** 構建的全功能社交媒體平台 GraphQL API，支援即時通知和動態流。

## ✨ 功能特性

### 🎯 核心功能
- ✅ **用戶系統** - 註冊、登入、個人資料管理
- ✅ **關注系統** - 關注/取消關注用戶、粉絲列表
- ✅ **貼文管理** - 創建、編輯、刪除貼文
- ✅ **互動功能** - 按讚、評論、分享
- ✅ **動態流** - 個人化動態消息流
- ✅ **即時通知** - GraphQL Subscriptions 實現即時推播
- ✅ **搜尋功能** - 搜尋用戶和貼文
- ✅ **標籤系統** - Hashtags 支援

### 🛠️ 技術棧
- **Apollo Server** - 強大的 GraphQL 服務器
- **PostgreSQL** - 關聯式資料庫
- **GraphQL Subscriptions** - 即時通知
- **JWT** - 用戶認證
- **bcryptjs** - 密碼加密

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
CREATE DATABASE social_media_db;

# 切換到資料庫
\c social_media_db
```

### 資料表結構

```sql
-- 用戶表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 關注關係表
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 貼文表
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 按讚表
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- 評論表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 標籤表
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 貼文標籤關聯表
CREATE TABLE post_hashtags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID REFERENCES hashtags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, hashtag_id)
);

-- 通知表
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

## 🚀 GraphQL Schema

### 查詢 (Queries)

```graphql
type Query {
  # 用戶相關
  me: User
  user(username: String!): User
  searchUsers(query: String!, limit: Int): [User!]!

  # 貼文相關
  post(id: ID!): Post
  feed(limit: Int, offset: Int): [Post!]!
  userPosts(username: String!, limit: Int): [Post!]!
  searchPosts(query: String!, limit: Int): [Post!]!

  # 動態流
  timeline(limit: Int, offset: Int): [Post!]!

  # 標籤
  trendingHashtags(limit: Int): [Hashtag!]!

  # 通知
  myNotifications(limit: Int): [Notification!]!
  unreadNotificationCount: Int!
}
```

### 變更 (Mutations)

```graphql
type Mutation {
  # 用戶認證
  register(username: String!, email: String!, password: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!
  updateProfile(displayName: String, bio: String, avatarUrl: String): User!

  # 關注系統
  followUser(username: String!): Boolean!
  unfollowUser(username: String!): Boolean!

  # 貼文管理
  createPost(content: String!, imageUrl: String, hashtags: [String!]): Post!
  updatePost(id: ID!, content: String): Post!
  deletePost(id: ID!): Boolean!

  # 互動
  likePost(postId: ID!): Boolean!
  unlikePost(postId: ID!): Boolean!
  addComment(postId: ID!, content: String!): Comment!
  deleteComment(id: ID!): Boolean!

  # 通知
  markNotificationAsRead(id: ID!): Boolean!
  markAllNotificationsAsRead: Boolean!
}
```

### 訂閱 (Subscriptions)

```graphql
type Subscription {
  # 新通知
  notificationReceived: Notification!

  # 新貼文（來自關注的用戶）
  newPostFromFollowing: Post!

  # 貼文互動
  postLiked(postId: ID!): Like!
  commentAdded(postId: ID!): Comment!
}
```

## 📖 使用範例

### 1. 用戶註冊與登入

```graphql
mutation Register {
  register(
    username: "johndoe"
    email: "john@example.com"
    password: "securepass123"
  ) {
    token
    user {
      id
      username
      email
    }
  }
}

mutation Login {
  login(email: "john@example.com", password: "securepass123") {
    token
    user {
      id
      username
      displayName
    }
  }
}
```

### 2. 發布貼文

```graphql
mutation CreatePost {
  createPost(
    content: "Hello from GraphQL! #graphql #coding"
    hashtags: ["graphql", "coding"]
  ) {
    id
    content
    author {
      username
      displayName
    }
    hashtags {
      tag
    }
    createdAt
  }
}
```

### 3. 查看動態流

```graphql
query GetFeed {
  feed(limit: 20) {
    id
    content
    imageUrl
    author {
      username
      displayName
      avatarUrl
    }
    likes {
      user {
        username
      }
    }
    likesCount
    commentsCount
    isLikedByMe
    createdAt
  }
}
```

### 4. 關注用戶

```graphql
mutation FollowUser {
  followUser(username: "janedoe")
}

query GetUserProfile {
  user(username: "janedoe") {
    username
    displayName
    bio
    followersCount
    followingCount
    isFollowedByMe
    posts(limit: 10) {
      id
      content
      likesCount
    }
  }
}
```

### 5. 訂閱即時通知

```graphql
subscription OnNotification {
  notificationReceived {
    id
    type
    content
    isRead
    createdAt
  }
}
```

## 🔐 認證

使用 JWT 進行認證。在 HTTP Headers 中添加：

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## 🧪 測試

啟動服務器後訪問：

```
http://localhost:4002/graphql
```

## 📊 API 端點

- **GraphQL Endpoint**: `http://localhost:4002/graphql`
- **GraphQL Subscriptions**: `ws://localhost:4002/graphql`

## 🎯 核心流程

### 動態流算法

```
1. 獲取當前用戶關注的所有用戶
2. 查詢這些用戶的貼文
3. 按時間倒序排列
4. 分頁返回結果
```

### 通知系統

當發生以下事件時自動創建通知：
- 有人關注你
- 有人喜歡你的貼文
- 有人評論你的貼文
- 有人提到你（@username）

## 🎨 專案結構

```
social-media-graphql/
├── src/
│   ├── schema/
│   │   └── typeDefs.js      # GraphQL Schema
│   ├── resolvers/
│   │   └── index.js         # Resolvers
│   ├── utils/
│   │   ├── db.js            # 資料庫連接
│   │   ├── auth.js          # 認證工具
│   │   └── pubsub.js        # 訂閱管理
│   └── index.js             # 主入口
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🌟 功能擴展建議

- [ ] 私訊功能
- [ ] 群組/社團
- [ ] 限時動態（Stories）
- [ ] 貼文分享/轉發
- [ ] 多媒體上傳
- [ ] 用戶驗證徽章
- [ ] 貼文推薦算法
- [ ] 內容審核系統
- [ ] 資料分析儀表板

## 📝 開發建議

### 使用 AI 輔助開發

```
"幫我擴展這個社交媒體 API，增加私訊功能，
包含 Schema、Resolver 和資料庫設計，並支援即時訊息。"
```

### 性能優化

- 使用 DataLoader 解決 N+1 問題
- 實作快取機制
- 資料庫查詢優化
- 分頁載入

## 📄 授權

MIT License

---

**使用 AI 和 GraphQL 打造現代化社交媒體平台！** 🚀
