# 📡 Next.js Social Platform API 文檔

完整的 RESTful API 實現,支援貼文、留言、按讚、追蹤和 AI 推薦功能。

## 🔐 認證

所有需要認證的 API 都使用 NextAuth.js Session 進行驗證。

**認證方式:**
- OAuth 2.0 (Google, GitHub)
- Session Cookie

**未認證時的回應:**
```json
{
  "error": "Unauthorized"
}
```
**HTTP Status:** 401

---

## 📝 貼文 API

### GET /api/posts
取得貼文列表 (支援分頁)

**Query Parameters:**
- `cursor` (optional): 分頁游標
- `limit` (optional): 每頁數量 (預設: 10)
- `userId` (optional): 篩選特定用戶的貼文

**回應範例:**
```json
{
  "posts": [
    {
      "id": "post_123",
      "content": "Hello World!",
      "image": "https://example.com/image.jpg",
      "createdAt": "2025-11-18T10:00:00Z",
      "author": {
        "id": "user_456",
        "name": "John Doe",
        "image": "https://example.com/avatar.jpg"
      },
      "likeCount": 42,
      "commentCount": 15,
      "likes": ["user_789", "user_101"]
    }
  ],
  "nextCursor": "post_456"
}
```

---

### POST /api/posts
建立新貼文 (需認證)

**Request Body:**
```json
{
  "content": "My new post!",
  "image": "https://example.com/image.jpg" // optional
}
```

**驗證規則:**
- `content`: 1-5000 字元
- `image`: 必須是有效的 URL (可選)

**回應:** 201 Created
```json
{
  "id": "post_123",
  "content": "My new post!",
  "image": "https://example.com/image.jpg",
  "createdAt": "2025-11-18T10:00:00Z",
  "author": { ... }
}
```

---

### GET /api/posts/[id]
取得單一貼文詳情

**回應範例:**
```json
{
  "id": "post_123",
  "content": "Hello World!",
  "image": "https://example.com/image.jpg",
  "createdAt": "2025-11-18T10:00:00Z",
  "author": {
    "id": "user_456",
    "name": "John Doe",
    "bio": "Software Developer"
  },
  "likes": [
    {
      "userId": "user_789",
      "user": {
        "id": "user_789",
        "name": "Jane Smith",
        "image": "https://example.com/avatar2.jpg"
      }
    }
  ],
  "comments": [
    {
      "id": "comment_111",
      "content": "Great post!",
      "createdAt": "2025-11-18T10:05:00Z",
      "author": { ... }
    }
  ]
}
```

---

### PATCH /api/posts/[id]
更新貼文 (需認證且為作者)

**Request Body:**
```json
{
  "content": "Updated content", // optional
  "image": "https://example.com/new-image.jpg" // optional
}
```

**回應:** 200 OK

**錯誤回應:**
- 403 Forbidden: 非作者嘗試編輯
- 404 Not Found: 貼文不存在

---

### DELETE /api/posts/[id]
刪除貼文 (需認證且為作者)

**回應:** 200 OK
```json
{
  "message": "Post deleted successfully"
}
```

---

## 👍 按讚 API

### POST /api/posts/[id]/like
按讚/取消按讚貼文 (Toggle, 需認證)

**回應範例:**
```json
{
  "isLiked": true,
  "likeCount": 43,
  "message": "Post liked"
}
```

**功能:**
- 如果未按讚 → 新增按讚
- 如果已按讚 → 取消按讚

---

### GET /api/posts/[id]/like
取得貼文的按讚用戶列表

**回應範例:**
```json
{
  "likes": [
    {
      "id": "user_789",
      "name": "Jane Smith",
      "image": "https://example.com/avatar.jpg",
      "email": "jane@example.com"
    }
  ],
  "count": 42
}
```

---

## 💬 留言 API

### GET /api/posts/[id]/comments
取得貼文的留言列表

**Query Parameters:**
- `limit` (optional): 每頁數量 (預設: 20)

**回應範例:**
```json
{
  "comments": [
    {
      "id": "comment_111",
      "content": "Great post!",
      "createdAt": "2025-11-18T10:05:00Z",
      "updatedAt": "2025-11-18T10:05:00Z",
      "author": {
        "id": "user_789",
        "name": "Jane Smith",
        "image": "https://example.com/avatar.jpg"
      }
    }
  ],
  "count": 15
}
```

---

### POST /api/posts/[id]/comments
新增留言 (需認證)

**Request Body:**
```json
{
  "content": "Nice post!"
}
```

**驗證規則:**
- `content`: 1-1000 字元

**回應:** 201 Created
```json
{
  "id": "comment_111",
  "content": "Nice post!",
  "createdAt": "2025-11-18T10:05:00Z",
  "author": { ... }
}
```

---

## 👥 追蹤 API

### POST /api/users/[id]/follow
追蹤/取消追蹤用戶 (Toggle, 需認證)

**回應範例:**
```json
{
  "isFollowing": true,
  "followerCount": 150,
  "followingCount": 75,
  "message": "User followed"
}
```

**錯誤回應:**
- 400 Bad Request: 嘗試追蹤自己
- 404 Not Found: 目標用戶不存在

---

### GET /api/users/[id]/follow
取得用戶的追蹤資訊

**Query Parameters:**
- `type` (optional): `followers` | `following` | 無 (預設: 統計數據)

#### Type: followers (追蹤者列表)
```json
{
  "users": [
    {
      "id": "user_789",
      "name": "Jane Smith",
      "image": "https://example.com/avatar.jpg",
      "bio": "Designer"
    }
  ],
  "count": 150
}
```

#### Type: following (追蹤中列表)
```json
{
  "users": [ ... ],
  "count": 75
}
```

#### 無 type (統計數據)
```json
{
  "followerCount": 150,
  "followingCount": 75
}
```

---

## 🤖 AI 推薦 API

### GET /api/ai/recommendations
AI 驅動的內容推薦

**Query Parameters:**
- `type`: `posts` | `users` | `trending`

#### Type: posts (貼文推薦)

**未登入用戶:**
- 返回熱門貼文

**已登入用戶:**
- 優先推薦追蹤用戶的貼文
- 補充熱門貼文

**回應範例:**
```json
{
  "type": "personalized_feed",
  "posts": [
    {
      "id": "post_123",
      "content": "...",
      "author": { ... },
      "_count": {
        "likes": 42,
        "comments": 15
      }
    }
  ]
}
```

---

#### Type: users (用戶推薦)

**未登入用戶:**
- 返回活躍用戶

**已登入用戶:**
- 推薦朋友的朋友
- 補充活躍用戶

**回應範例:**
```json
{
  "type": "suggested_users",
  "users": [
    {
      "id": "user_789",
      "name": "Jane Smith",
      "image": "https://example.com/avatar.jpg",
      "bio": "Designer"
    }
  ]
}
```

---

#### Type: trending (趨勢貼文)

**回應範例:**
```json
{
  "type": "trending",
  "posts": [
    {
      "id": "post_456",
      "content": "Trending post!",
      "score": 126, // 熱度分數 (按讚數*2 + 留言數*3)
      "author": { ... },
      "_count": {
        "likes": 42,
        "comments": 14
      }
    }
  ]
}
```

**熱度分數計算:**
```
score = (按讚數 × 2) + (留言數 × 3)
```

**時間範圍:**
- 僅包含最近 24 小時內的貼文

---

## 🔢 錯誤回應格式

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [
    {
      "path": ["content"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: You can only edit your own posts"
}
```

### 404 Not Found
```json
{
  "error": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create post"
}
```

---

## 📊 API 使用範例

### 建立貼文並按讚

```javascript
// 1. 建立貼文
const createPost = async () => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Hello from API!',
      image: 'https://example.com/image.jpg'
    })
  });
  const post = await response.json();
  return post;
};

// 2. 按讚貼文
const likePost = async (postId) => {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: 'POST',
  });
  const result = await response.json();
  console.log(result.isLiked); // true
};

// 3. 新增留言
const addComment = async (postId, content) => {
  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  return response.json();
};
```

### 取得個人化推薦

```javascript
const getRecommendations = async () => {
  // 取得推薦貼文
  const postsRes = await fetch('/api/ai/recommendations?type=posts');
  const { posts } = await postsRes.json();

  // 取得推薦用戶
  const usersRes = await fetch('/api/ai/recommendations?type=users');
  const { users } = await usersRes.json();

  // 取得趨勢貼文
  const trendingRes = await fetch('/api/ai/recommendations?type=trending');
  const { posts: trending } = await trendingRes.json();

  return { posts, users, trending };
};
```

### 追蹤用戶

```javascript
const followUser = async (userId) => {
  const response = await fetch(`/api/users/${userId}/follow`, {
    method: 'POST',
  });
  const result = await response.json();
  console.log(result.isFollowing); // true or false
  console.log(result.followerCount); // 150
};
```

---

## 🔒 安全性

### 實現的安全措施:
- ✅ NextAuth.js Session 驗證
- ✅ Zod Schema 輸入驗證
- ✅ Prisma ORM (防 SQL Injection)
- ✅ 權限檢查 (僅作者可編輯/刪除)
- ✅ 防止自我追蹤
- ✅ 數據驗證與清理

### 建議補充:
- Rate Limiting (使用 upstash/ratelimit)
- CORS 設定
- XSS 防護
- CSRF Token

---

## 📈 效能優化

### 已實現:
- ✅ 資料庫索引 (Prisma Schema)
- ✅ Cursor-based 分頁
- ✅ 數據關聯優化 (include)
- ✅ 條件查詢 (where, orderBy)

### 建議補充:
- Redis 快取
- CDN 加速
- 資料庫查詢優化
- API Response 壓縮

---

## 🚀 部署

### 環境變數
```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

### 資料庫遷移
```bash
npx prisma migrate deploy
npx prisma generate
```

---

**完成度**: 85% → API 完全實現 ✅

**缺少功能**:
- 檔案上傳 (圖片)
- 即時通知 (WebSocket)
- 訊息系統

**下一步**:
1. 整合前端組件與 API
2. 添加圖片上傳功能
3. 實現即時通知系統
