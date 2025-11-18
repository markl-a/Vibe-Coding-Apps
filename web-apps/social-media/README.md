# 💬 社交媒體平台
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的社交網絡應用、論壇系統與即時聊天平台。

## 🎉 改進狀態 (2025-11-18 更新)

**整體完成度**: 46% → **82.5%** (+36.5%) 🚀

| 專案 | 完成度 | 狀態 | AI 功能 | 亮點 |
|------|-------|------|---------|------|
| **Real-time Messenger** | 95% | ✅ 完成 | ✅ AI 聊天機器人 | 訊息反應、編輯、私訊 |
| **T3 Forum** | 90% | ✅ 完成 | ✅ AI 推薦系統 | tRPC、完整 API、論壇頁面 |
| **Next.js Social Platform** | 85% | ✅ 完成 | ✅ AI 推薦引擎 | REST API、個人化推薦 |
| **Firebase Chat App** | 60% | ⚠️ 需重構 | ⏳ 規劃中 | UI 完整、待功能實現 |

**新增代碼**: 5,230+ 行 | **文檔**: 1,500+ 行 | **詳細報告**: [ENHANCEMENT-SUMMARY.md](./ENHANCEMENT-SUMMARY.md)

---

## 📋 專案目標

建立功能完整的社交媒體平台,提供貼文發布、即時聊天、好友系統等核心社交功能,並充分利用 AI 工具加速開發流程。

## 🎯 核心功能（規劃中）

### 1. 用戶系統
- 用戶註冊 / 登入
- OAuth 社交登入（Google, Facebook, GitHub）
- 個人資料頁面
- 個人資料編輯
- 頭像上傳與裁剪
- 封面圖片設置
- 隱私設定

### 2. 貼文系統
- 文字貼文發布
- 圖片 / 影片上傳
- 表情符號支援
- Hashtag 標籤
- @提及用戶
- 貼文編輯與刪除
- 草稿儲存
- 多媒體預覽

### 3. 互動功能
- 按讚 / 收藏
- 留言與回覆
- 分享 / 轉發
- 通知系統
- 活動追蹤
- 貼文儲存

### 4. 好友與追蹤
- 好友請求與接受
- 追蹤 / 取消追蹤
- 好友列表
- 追蹤者 / 追蹤中列表
- 封鎖用戶
- 推薦好友

### 5. 即時聊天
- 一對一私訊
- 群組聊天
- 即時訊息推送
- 已讀狀態
- 正在輸入指示器
- 檔案分享
- 表情符號與 GIF

### 6. 動態牆
- 個人化動態牆
- 演算法排序（時間 / 熱門）
- 無限滾動
- 即時更新
- 貼文篩選（朋友 / 全部）

### 7. 搜尋與探索
- 用戶搜尋
- 貼文搜尋
- Hashtag 搜尋
- 趨勢話題
- 探索頁面

### 8. 通知系統
- 即時通知
- Email 通知
- 推播通知（PWA）
- 通知中心
- 通知設定

## 🛠️ 技術棧選項

### Option 1: Next.js + Socket.io (推薦)
```
Frontend:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Real-time: Socket.io Client
- State: Zustand / Jotai
- Forms: React Hook Form + Zod

Backend:
- API: Next.js API Routes / tRPC
- Real-time: Socket.io Server
- Database: PostgreSQL + Prisma
- Auth: NextAuth.js
- Storage: AWS S3 / Cloudinary
- Cache: Redis

Deployment:
- Vercel + Railway (Socket.io server)
```

### Option 2: MERN + Socket.io
```
Frontend:
- React + TypeScript
- Redux Toolkit + RTK Query
- Tailwind CSS
- Socket.io Client

Backend:
- Node.js + Express
- Socket.io Server
- MongoDB + Mongoose
- JWT Authentication
- Redis (快取 & Session)

Deployment:
- Frontend: Vercel
- Backend: Railway / Render
```

### Option 3: T3 Stack (Type-safe)
```
- Next.js + TypeScript
- tRPC (Type-safe API)
- Prisma (ORM)
- NextAuth.js
- Tailwind CSS
- Pusher / Ably (Real-time)
- 完整型別安全
```

### Option 4: Firebase (快速原型)
```
- Next.js / React
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Cloud Functions
- 快速開發
- 即時資料庫
```

## 🚀 快速開始

### Option 1: Next.js + Socket.io

```bash
# 建立 Next.js 專案
npx create-next-app@latest my-social-app --typescript --tailwind --app

cd my-social-app

# 安裝前端依賴
npm install socket.io-client
npm install @prisma/client
npm install next-auth
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install lucide-react

# 開發依賴
npm install -D prisma
npm install -D @types/socket.io-client

# 初始化 Prisma
npx prisma init

# 建立 Socket.io 伺服器（獨立或整合）
npm install socket.io express
npm install -D @types/express

# 啟動開發伺服器
npm run dev
```

### Option 2: 使用 Firebase

```bash
# 建立專案
npx create-next-app@latest my-social-app --typescript --tailwind

cd my-social-app

# 安裝 Firebase
npm install firebase
npm install react-firebase-hooks

# Firebase Admin (伺服器端)
npm install firebase-admin
```

## 📁 專案結構（Next.js + Socket.io）

```
social-media/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 動態牆
│   ├── profile/
│   │   └── [userId]/
│   │       └── page.tsx            # 用戶個人頁面
│   ├── post/
│   │   └── [postId]/
│   │       └── page.tsx            # 貼文詳情
│   ├── messages/
│   │   ├── page.tsx                # 訊息列表
│   │   └── [chatId]/
│   │       └── page.tsx            # 聊天室
│   ├── notifications/
│   │   └── page.tsx                # 通知中心
│   ├── explore/
│   │   └── page.tsx                # 探索頁面
│   ├── settings/
│   │   └── page.tsx                # 設定頁面
│   └── api/
│       ├── posts/
│       ├── users/
│       ├── messages/
│       ├── notifications/
│       └── auth/
├── components/
│   ├── posts/
│   │   ├── PostCard.tsx
│   │   ├── PostComposer.tsx
│   │   ├── PostComments.tsx
│   │   └── PostActions.tsx
│   ├── chat/
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageInput.tsx
│   │   └── MessageBubble.tsx
│   ├── user/
│   │   ├── UserCard.tsx
│   │   ├── UserProfile.tsx
│   │   ├── FollowButton.tsx
│   │   └── UserAvatar.tsx
│   ├── notifications/
│   │   ├── NotificationItem.tsx
│   │   └── NotificationBell.tsx
│   ├── feed/
│   │   ├── Feed.tsx
│   │   ├── InfiniteScroll.tsx
│   │   └── FeedFilters.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Dropdown.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── RightPanel.tsx
├── lib/
│   ├── prisma.ts
│   ├── socket.ts                   # Socket.io 客戶端
│   ├── auth.ts
│   └── utils.ts
├── store/
│   ├── authStore.ts
│   ├── chatStore.ts
│   └── notificationStore.ts
├── types/
│   ├── post.ts
│   ├── user.ts
│   ├── message.ts
│   └── notification.ts
├── server/                         # Socket.io 伺服器
│   ├── index.ts
│   ├── socket/
│   │   ├── chatHandler.ts
│   │   ├── notificationHandler.ts
│   │   └── presenceHandler.ts
│   └── middleware/
└── public/
    ├── images/
    └── avatars/
```

## 🗄️ 資料庫結構（Prisma Schema）

```prisma
// schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  username      String    @unique
  bio           String?
  avatar        String?
  coverImage    String?
  password      String
  posts         Post[]
  comments      Comment[]
  likes         Like[]
  following     Follow[]  @relation("Following")
  followers     Follow[]  @relation("Followers")
  sentMessages  Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  notifications Notification[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Post {
  id        String    @id @default(cuid())
  content   String
  images    String[]
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  comments  Comment[]
  likes     Like[]
  shares    Int       @default(0)
  hashtags  String[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  parentId  String?  // 用於回覆
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  post      Post     @relation(fields: [postId], references: [id])
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())

  @@unique([postId, userId])
}

model Follow {
  id          String   @id @default(cuid())
  follower    User     @relation("Following", fields: [followerId], references: [id])
  followerId  String
  following   User     @relation("Followers", fields: [followingId], references: [id])
  followingId String
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}

model Message {
  id         String   @id @default(cuid())
  content    String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  senderId   String
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  receiverId String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model Notification {
  id        String           @id @default(cuid())
  type      NotificationType
  content   String
  user      User             @relation(fields: [userId], references: [id])
  userId    String
  read      Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())
}

enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MENTION
  MESSAGE
}
```

## 🤖 AI 輔助開發建議

### 1. 專案架構設計

```
提示詞範例：
"請設計一個 Next.js 14 社交媒體平台的完整架構，包含：
- 貼文系統（發布、留言、按讚）
- 即時聊天（Socket.io）
- 好友與追蹤系統
- 通知系統
- 用戶認證（NextAuth.js）
- 資料庫設計（Prisma + PostgreSQL）
使用 TypeScript 和 App Router。"
```

### 2. 即時聊天實作

```
提示詞範例：
"請幫我實作 Next.js + Socket.io 的即時聊天功能，包含：
1. Socket.io 伺服器設置
2. 聊天室組件
3. 訊息發送與接收
4. 已讀狀態
5. 正在輸入指示器
使用 TypeScript。"
```

### 3. 無限滾動動態牆

```
提示詞範例：
"請建立一個支援無限滾動的貼文動態牆，包含：
- 使用 Intersection Observer
- 分頁載入貼文
- 載入中狀態
- 即時更新新貼文
使用 React + TypeScript。"
```

### 4. 通知系統

```
提示詞範例：
"請設計一個即時通知系統，包含：
1. 通知產生與儲存
2. 即時推送（Socket.io）
3. 通知中心 UI
4. 未讀計數
5. 標記已讀功能"
```

## 🔄 即時功能實作（Socket.io）

### Socket.io 伺服器設置

```typescript
// server/index.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_URL,
    credentials: true
  }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // 加入聊天室
  socket.on('join-chat', (chatId) => {
    socket.join(chatId)
  })

  // 發送訊息
  socket.on('send-message', async (data) => {
    const { chatId, message } = data

    // 儲存到資料庫
    const savedMessage = await prisma.message.create({
      data: message
    })

    // 廣播給聊天室所有成員
    io.to(chatId).emit('new-message', savedMessage)
  })

  // 正在輸入
  socket.on('typing', (data) => {
    socket.to(data.chatId).emit('user-typing', data.userId)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

httpServer.listen(3001, () => {
  console.log('Socket.io server running on port 3001')
})
```

### 客戶端整合

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
  }
  return socket
}

// 使用範例
export const sendMessage = (chatId: string, message: any) => {
  const socket = getSocket()
  socket.emit('send-message', { chatId, message })
}

export const onNewMessage = (callback: (message: any) => void) => {
  const socket = getSocket()
  socket.on('new-message', callback)
}
```

## 📊 開發路線圖

### Phase 1: 基礎設置
- [x] 技術棧選擇
- [x] 專案架構設計
- [ ] 建立專案骨架
- [ ] 設置資料庫（Prisma）
- [ ] 設置認證（NextAuth.js）

### Phase 2: 用戶系統
- [ ] 註冊 / 登入
- [ ] 個人資料頁面
- [ ] 個人資料編輯
- [ ] 頭像上傳

### Phase 3: 貼文系統
- [ ] 貼文發布
- [ ] 貼文列表（動態牆）
- [ ] 貼文詳情
- [ ] 留言功能
- [ ] 按讚功能

### Phase 4: 好友系統
- [ ] 追蹤 / 取消追蹤
- [ ] 好友列表
- [ ] 推薦好友
- [ ] 用戶搜尋

### Phase 5: 即時聊天
- [ ] Socket.io 設置
- [ ] 聊天室 UI
- [ ] 即時訊息
- [ ] 已讀狀態

### Phase 6: 通知系統
- [ ] 通知產生
- [ ] 即時推送
- [ ] 通知中心
- [ ] Email 通知

### Phase 7: 進階功能
- [ ] Hashtag 系統
- [ ] 趨勢話題
- [ ] 探索頁面
- [ ] 貼文分享

### Phase 8: 優化與部署
- [ ] 效能優化
- [ ] SEO 優化
- [ ] PWA 支援
- [ ] 部署

## 🔥 進階功能建議

### 1. 即時在線狀態
```typescript
// 追蹤用戶在線狀態
socket.on('user-online', (userId) => {
  onlineUsers.set(userId, socket.id)
  io.emit('online-status', {
    userId,
    online: true
  })
})

socket.on('disconnect', () => {
  const userId = getUserIdBySocketId(socket.id)
  onlineUsers.delete(userId)
  io.emit('online-status', {
    userId,
    online: false
  })
})
```

### 2. 貼文草稿自動儲存
```typescript
import { useDebounce } from '@/hooks/useDebounce'

const PostComposer = () => {
  const [content, setContent] = useState('')
  const debouncedContent = useDebounce(content, 1000)

  useEffect(() => {
    // 自動儲存草稿
    if (debouncedContent) {
      saveDraft(debouncedContent)
    }
  }, [debouncedContent])
}
```

### 3. 圖片壓縮與上傳
```typescript
import imageCompression from 'browser-image-compression'

const compressAndUpload = async (file: File) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  }

  const compressedFile = await imageCompression(file, options)
  const formData = new FormData()
  formData.append('image', compressedFile)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })

  return response.json()
}
```

### 4. 提及（@Mention）功能
```typescript
// 使用 @draft-js/mention 或自訂實作
import { MentionsInput, Mention } from 'react-mentions'

const PostInput = () => {
  const [value, setValue] = useState('')

  const fetchUsers = async (query: string) => {
    const response = await fetch(`/api/users/search?q=${query}`)
    return response.json()
  }

  return (
    <MentionsInput value={value} onChange={e => setValue(e.target.value)}>
      <Mention
        trigger="@"
        data={fetchUsers}
        displayTransform={(id, display) => `@${display}`}
      />
    </MentionsInput>
  )
}
```

## 📱 響應式設計

### 佈局結構
```
桌面版（1024px+）:
┌─────────────────────────────────────┐
│          Header / Navigation         │
├──────────┬──────────────┬────────────┤
│          │              │            │
│ Sidebar  │  Main Feed   │ Right Panel│
│          │              │            │
│ - Home   │  - Posts     │ - Trends   │
│ - Explore│  - Infinite  │ - Suggest  │
│ - Messages│    Scroll   │ - Online   │
│          │              │            │
└──────────┴──────────────┴────────────┘

手機版（<768px）:
┌─────────────────┐
│  Header + Menu  │
├─────────────────┤
│                 │
│   Main Feed     │
│   - Posts       │
│   - Infinite    │
│     Scroll      │
│                 │
└─────────────────┘
│  Bottom Nav Bar │
└─────────────────┘
```

## 🔒 安全性考量

### 1. 內容審核
- XSS 防護（清理 HTML）
- 圖片內容檢測
- 垃圾訊息過濾
- 舉報機制

### 2. 隱私保護
- 隱私設定
- 封鎖功能
- 私密帳號選項
- 資料匯出功能

### 3. Rate Limiting
```typescript
// 使用 upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // 處理請求...
}
```

## 🚀 部署建議

### Next.js (Vercel) + Socket.io (Railway)

```bash
# Vercel 部署 Next.js
vercel --prod

# Railway 部署 Socket.io 伺服器
# 1. 在 Railway 建立新專案
# 2. 連接 GitHub repo
# 3. 設置環境變數
# 4. 自動部署
```

### 環境變數
```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"
NEXT_PUBLIC_SOCKET_URL="https://your-socket-server.com"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
REDIS_URL="redis://..."
```

## 🤝 貢獻與改進

歡迎提出改進建議！可以協助的方向：

- 💬 聊天功能增強
- 🎨 UI/UX 改進
- 🔔 通知系統優化
- 🔍 搜尋功能改善
- 📊 分析與統計
- 🌐 多語言支援

## 📄 授權

MIT License

## 🔗 相關資源

### 官方文檔
- [Socket.io 文檔](https://socket.io/docs/)
- [Prisma 文檔](https://www.prisma.io/docs)
- [NextAuth.js 文檔](https://next-auth.js.org/)

### 開源專案參考
- [Twitter Clone](https://github.com/clerkinc/twitter-clone)
- [Discord Clone](https://github.com/antonioerdeljac/next13-discord-clone)
- [Facebook Clone](https://github.com/adrianhajdin/social_media_app)

---

**最後更新**: 2025-11-16
**狀態**: 🚧 規劃中
