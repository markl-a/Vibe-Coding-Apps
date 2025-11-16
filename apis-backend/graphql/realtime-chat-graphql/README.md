# 💬 即時聊天 GraphQL API (Real-time Chat GraphQL API)

使用 **Apollo Server** 和 **WebSocket Subscriptions** 構建的全功能即時聊天系統 GraphQL API。

## ✨ 功能特性

### 🎯 核心功能
- ✅ **即時訊息** - WebSocket 實現毫秒級訊息傳遞
- ✅ **聊天室系統** - 創建/加入/離開聊天室
- ✅ **私人訊息** - 一對一私密聊天
- ✅ **群組聊天** - 多人群組對話
- ✅ **在線狀態** - 即時顯示用戶在線/離線
- ✅ **已讀回執** - 訊息已讀狀態追蹤
- ✅ **輸入指示** - "正在輸入..." 提示
- ✅ **訊息歷史** - 完整聊天記錄查詢
- ✅ **檔案分享** - 支援圖片、文件分享

### 🛠️ 技術棧
- **Apollo Server** - GraphQL 服務器
- **graphql-ws** - WebSocket Subscriptions
- **PostgreSQL** - 資料持久化
- **JWT** - 用戶認證
- **PubSub** - 即時事件發布訂閱

## 📦 安裝

```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 檔案，填入資料庫配置

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
CREATE DATABASE realtime_chat_db;

# 切換到資料庫
\c realtime_chat_db
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
  avatar_url VARCHAR(500),
  online_status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 聊天室表
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'group', -- 'group', 'direct', 'channel'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 聊天室成員表
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- 訊息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file'
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訊息已讀狀態表
CREATE TABLE message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- 輸入狀態表（暫存，用於即時提示）
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- 創建索引
CREATE INDEX idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_users_online_status ON users(online_status);
```

## 🚀 GraphQL Schema

### 查詢 (Queries)

```graphql
type Query {
  # 用戶相關
  me: User
  users: [User!]!
  user(id: ID!): User

  # 聊天室
  myRooms: [Room!]!
  room(id: ID!): Room
  directRoom(userId: ID!): Room

  # 訊息
  messages(roomId: ID!, limit: Int, offset: Int): [Message!]!
  unreadMessagesCount: Int!
}
```

### 變更 (Mutations)

```graphql
type Mutation {
  # 認證
  register(username: String!, email: String!, password: String!): AuthPayload!
  login(email: String!, password: String!): AuthPayload!

  # 聊天室管理
  createRoom(name: String!, description: String, type: String): Room!
  joinRoom(roomId: ID!): Boolean!
  leaveRoom(roomId: ID!): Boolean!

  # 訊息
  sendMessage(roomId: ID!, content: String!, messageType: String, fileUrl: String): Message!
  markMessageAsRead(messageId: ID!): Boolean!
  markRoomAsRead(roomId: ID!): Boolean!

  # 用戶狀態
  setOnlineStatus(status: String!): Boolean!
  setTyping(roomId: ID!, isTyping: Boolean!): Boolean!
}
```

### 訂閱 (Subscriptions)

```graphql
type Subscription {
  # 新訊息
  messageReceived(roomId: ID!): Message!

  # 用戶狀態
  userStatusChanged(userId: ID): UserStatus!

  # 輸入提示
  userTyping(roomId: ID!): TypingIndicator!

  # 聊天室更新
  roomUpdated(roomId: ID!): Room!
}
```

## 📖 使用範例

### 1. 用戶註冊與登入

```graphql
mutation Register {
  register(
    username: "alice"
    email: "alice@example.com"
    password: "securepass123"
  ) {
    token
    user {
      id
      username
      displayName
    }
  }
}
```

### 2. 創建聊天室

```graphql
mutation CreateRoom {
  createRoom(
    name: "General Chat"
    description: "General discussion room"
    type: "group"
  ) {
    id
    name
    description
    members {
      user {
        username
      }
    }
  }
}
```

### 3. 發送訊息

```graphql
mutation SendMessage {
  sendMessage(
    roomId: "room-id-here"
    content: "Hello everyone! 👋"
    messageType: "text"
  ) {
    id
    content
    sender {
      username
      displayName
    }
    createdAt
  }
}
```

### 4. 訂閱即時訊息

```graphql
subscription OnMessageReceived {
  messageReceived(roomId: "room-id-here") {
    id
    content
    messageType
    sender {
      username
      displayName
      avatarUrl
    }
    isReadByMe
    createdAt
  }
}
```

### 5. 查詢訊息歷史

```graphql
query GetMessages {
  messages(roomId: "room-id-here", limit: 50) {
    id
    content
    messageType
    fileUrl
    sender {
      username
      displayName
      avatarUrl
    }
    readBy {
      user {
        username
      }
      readAt
    }
    createdAt
  }
}
```

### 6. 訂閱用戶輸入狀態

```graphql
subscription OnUserTyping {
  userTyping(roomId: "room-id-here") {
    user {
      username
      displayName
    }
    isTyping
  }
}
```

## 🔐 認證

使用 JWT 進行認證。在 HTTP Headers 和 WebSocket 連接參數中添加：

### HTTP Headers
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

### WebSocket Connection Params
```javascript
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4003/graphql',
  connectionParams: {
    authorization: 'Bearer YOUR_JWT_TOKEN'
  }
}));
```

## 🧪 測試

啟動服務器後訪問：

```
http://localhost:4003/graphql
```

## 📊 API 端點

- **GraphQL Endpoint**: `http://localhost:4003/graphql`
- **WebSocket Subscriptions**: `ws://localhost:4003/graphql`

## 🎯 核心流程

### 即時訊息流程

```
1. 用戶 A 發送訊息 → Mutation: sendMessage
2. 訊息存入資料庫
3. 發布 PubSub 事件
4. 所有訂閱該聊天室的用戶收到即時通知
5. 客戶端更新 UI 顯示新訊息
```

### 已讀回執流程

```
1. 用戶打開聊天室
2. 自動標記訊息為已讀 → Mutation: markRoomAsRead
3. 更新 message_reads 表
4. 發送端收到已讀狀態更新
```

## 🎨 專案結構

```
realtime-chat-graphql/
├── src/
│   ├── schema/
│   │   └── typeDefs.js      # GraphQL Schema
│   ├── resolvers/
│   │   └── index.js         # Resolvers
│   ├── utils/
│   │   ├── db.js            # 資料庫連接
│   │   ├── auth.js          # 認證工具
│   │   └── pubsub.js        # PubSub 管理
│   └── index.js             # 主入口
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🌟 功能擴展建議

- [ ] 語音/視訊通話整合
- [ ] 訊息加密（端到端加密）
- [ ] 訊息搜尋功能
- [ ] 表情符號反應
- [ ] 訊息編輯/刪除
- [ ] 聊天室權限管理
- [ ] 訊息釘選功能
- [ ] 檔案上傳進度顯示
- [ ] 多媒體預覽
- [ ] @ 提及通知

## 💡 客戶端整合範例

### React with Apollo Client

```javascript
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP Link
const httpLink = new HttpLink({
  uri: 'http://localhost:4003/graphql',
  headers: {
    authorization: `Bearer ${token}`
  }
});

// WebSocket Link
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4003/graphql',
  connectionParams: {
    authorization: `Bearer ${token}`
  }
}));

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

## 📝 開發建議

### 使用 AI 輔助開發

```
"幫我擴展這個聊天 API，增加語音訊息功能，
包含 Schema 定義、Resolver 實作、音訊檔案處理和即時播放指示器。"
```

### 性能優化

- 訊息分頁載入
- WebSocket 連接池管理
- 資料庫查詢優化
- 快取熱門聊天室
- 訊息批次發送

## 📄 授權

MIT License

---

**使用 AI 和 GraphQL WebSocket 打造即時聊天系統！** 🚀
