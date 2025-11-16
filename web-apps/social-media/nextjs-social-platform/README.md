# Next.js 社交平台

使用 Next.js 14、TypeScript、Tailwind CSS 和 Socket.io 打造的現代化即時社交媒體平台。

## 功能特色

- ✨ **現代化設計** - 使用 Tailwind CSS 打造精美 UI
- 🚀 **高效能** - Next.js 14 App Router 與 Server Components
- 💬 **即時聊天** - Socket.io 驅動的即時訊息系統
- 📱 **響應式設計** - 完美支援各種螢幕尺寸
- 🔐 **用戶認證** - NextAuth.js 完整認證系統
- 📝 **貼文系統** - 發布、按讚、留言、分享
- 👥 **好友系統** - 追蹤、好友請求、推薦好友
- 🔔 **即時通知** - 即時推送所有互動通知
- 🔍 **搜尋功能** - 搜尋用戶、貼文、Hashtag
- 🎯 **個人化** - 個人資料頁面、頭像上傳

## 核心功能

### 1. 貼文系統
- 文字貼文發布
- 圖片/影片上傳
- Hashtag 標籤支援
- @提及用戶功能
- 貼文編輯與刪除
- 草稿自動儲存

### 2. 互動功能
- 按讚/收藏貼文
- 留言與回覆
- 分享/轉發
- 即時通知推送
- 活動追蹤

### 3. 好友與追蹤
- 好友請求與接受
- 追蹤/取消追蹤
- 好友列表管理
- 推薦好友功能
- 封鎖用戶

### 4. 即時聊天
- 一對一私訊
- 群組聊天
- 即時訊息推送
- 已讀狀態顯示
- 正在輸入指示器
- 檔案分享

### 5. 動態牆
- 個人化內容推薦
- 演算法排序（時間/熱門）
- 無限滾動載入
- 即時更新
- 內容篩選

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **即時通訊**: Socket.io
- **資料庫**: PostgreSQL + Prisma ORM
- **認證**: NextAuth.js
- **狀態管理**: Zustand
- **表單處理**: React Hook Form + Zod
- **圖示**: Lucide React
- **日期處理**: date-fns
- **部署**: Vercel (推薦)

## 快速開始

### 安裝依賴

```bash
npm install
```

### 環境變數設定

建立 `.env.local` 檔案：

```bash
# 資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/social_platform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Socket.io 伺服器
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# 檔案上傳（Cloudinary 或 S3）
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Redis（快取與 Session）
REDIS_URL="redis://localhost:6379"
```

### 資料庫設置

```bash
# 初始化 Prisma
npx prisma init

# 執行資料庫遷移
npx prisma migrate dev

# 產生 Prisma Client
npx prisma generate

# 開啟 Prisma Studio（視覺化管理）
npx prisma studio
```

### 開發模式

```bash
# 啟動 Next.js 開發伺服器
npm run dev

# 在另一個終端機啟動 Socket.io 伺服器（如果需要）
# npm run socket-server
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 專案結構

```
nextjs-social-platform/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # 根佈局
│   ├── page.tsx               # 首頁
│   ├── globals.css            # 全局樣式
│   ├── feed/                  # 動態牆頁面
│   │   └── page.tsx
│   ├── profile/               # 用戶個人頁面
│   │   └── [userId]/
│   │       └── page.tsx
│   ├── messages/              # 訊息頁面
│   │   ├── page.tsx
│   │   └── [chatId]/
│   │       └── page.tsx
│   └── api/                   # API Routes
│       ├── posts/
│       ├── users/
│       ├── messages/
│       └── auth/
├── components/                # React 組件
│   ├── posts/
│   │   ├── PostCard.tsx      # 貼文卡片
│   │   ├── PostComposer.tsx  # 發文編輯器
│   │   └── PostComments.tsx  # 留言區
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   ├── ui/
│   │   ├── Sidebar.tsx       # 側邊欄
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   └── user/
│       ├── UserCard.tsx
│       └── UserProfile.tsx
├── lib/                       # 工具函式
│   ├── prisma.ts             # Prisma 客戶端
│   ├── socket.ts             # Socket.io 客戶端
│   ├── auth.ts               # 認證工具
│   └── utils.ts
├── types/                     # TypeScript 型別定義
│   ├── post.ts
│   ├── user.ts
│   └── message.ts
├── public/                    # 靜態資源
├── package.json
├── next.config.js
├── tsconfig.json
└── tailwind.config.ts
```

## 主要頁面

### 首頁 (`/`)
- 平台介紹
- 功能展示
- 註冊/登入入口

### 動態牆 (`/feed`)
- 個人化貼文串流
- 發布新貼文
- 即時互動
- 趨勢話題

### 個人資料 (`/profile/[userId]`)
- 用戶資訊
- 貼文歷史
- 追蹤者/追蹤中列表
- 編輯個人資料

### 訊息 (`/messages`)
- 聊天列表
- 即時對話
- 群組聊天

### 通知 (`/notifications`)
- 即時通知中心
- 未讀計數
- 通知分類

## Socket.io 即時功能

### 客戶端使用

```typescript
import { getSocket } from '@/lib/socket';

// 建立連接
const socket = getSocket();

// 發送訊息
socket.emit('send-message', {
  chatId: '123',
  message: 'Hello!'
});

// 接收訊息
socket.on('new-message', (message) => {
  console.log('新訊息:', message);
});

// 正在輸入
socket.emit('typing', { chatId: '123', userId: 'user1' });

// 監聽正在輸入
socket.on('user-typing', (userId) => {
  console.log(`${userId} 正在輸入...`);
});
```

## 資料庫結構

主要資料表：
- `User` - 用戶資訊
- `Post` - 貼文內容
- `Comment` - 留言
- `Like` - 按讚
- `Follow` - 追蹤關係
- `Message` - 訊息
- `Notification` - 通知

詳細 Schema 請參考 `prisma/schema.prisma`

## API Routes

### 貼文相關
- `POST /api/posts` - 建立貼文
- `GET /api/posts` - 取得貼文列表
- `GET /api/posts/[id]` - 取得單一貼文
- `PUT /api/posts/[id]` - 更新貼文
- `DELETE /api/posts/[id]` - 刪除貼文

### 用戶相關
- `GET /api/users` - 取得用戶列表
- `GET /api/users/[id]` - 取得用戶資料
- `PUT /api/users/[id]` - 更新用戶資料
- `POST /api/users/follow` - 追蹤用戶

### 訊息相關
- `GET /api/messages` - 取得聊天列表
- `POST /api/messages` - 發送訊息
- `GET /api/messages/[chatId]` - 取得聊天記錄

## 部署

### Vercel 部署（推薦）

1. 將專案推送到 GitHub
2. 在 Vercel 中匯入專案
3. 設定環境變數
4. 自動部署完成

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Socket.io 伺服器部署

Socket.io 伺服器需要獨立部署到支援 WebSocket 的平台：

**選項 1: Railway**
```bash
# 在 Railway 建立新專案並連接 GitHub
# 自動偵測並部署 Node.js 應用
```

**選項 2: Render**
```bash
# 在 Render 建立新 Web Service
# 選擇 Node 環境
# 設定啟動命令
```

### 環境變數設定

記得在部署平台設定所有必要的環境變數。

## 開發指南

### 新增貼文類型

1. 更新 `types/post.ts`
2. 修改 Prisma Schema
3. 執行資料庫遷移
4. 更新 PostCard 組件

### 新增通知類型

1. 在 Prisma Schema 新增通知類型
2. 更新通知產生邏輯
3. 建立對應的 UI 組件

### 實作新功能

1. 設計資料結構（Prisma Schema）
2. 建立 API Routes
3. 開發 UI 組件
4. 整合 Socket.io（如需即時功能）
5. 測試與優化

## 效能優化

- ✅ 使用 Next.js Image 組件
- ✅ Server Components 減少客戶端 JavaScript
- ✅ 實作無限滾動分頁
- ✅ Redis 快取熱門內容
- ✅ CDN 加速靜態資源
- ✅ 資料庫查詢優化
- ✅ 圖片壓縮與 lazy loading

## 安全性

- 🔒 XSS 防護（內容清理）
- 🔒 CSRF 保護
- 🔒 Rate Limiting（API 限流）
- 🔒 SQL Injection 防護（Prisma ORM）
- 🔒 密碼加密（bcrypt）
- 🔒 JWT Token 安全
- 🔒 環境變數保護
- 🔒 內容審核機制

## 測試

```bash
# 單元測試
npm run test

# E2E 測試
npm run test:e2e

# 測試覆蓋率
npm run test:coverage
```

## 進階功能建議

- 📊 分析儀表板
- 🌐 多語言支援（i18n）
- 🎨 主題切換（深色模式）
- 📱 PWA 支援
- 🔍 全文搜尋（Elasticsearch）
- 🎥 直播功能
- 📹 短影音（類似 TikTok）
- 🤖 AI 內容推薦
- 💰 付費訂閱功能

## 常見問題

### Q: Socket.io 連接失敗？
確認 Socket.io 伺服器已啟動，並檢查 `NEXT_PUBLIC_SOCKET_URL` 環境變數。

### Q: 資料庫連接錯誤？
檢查 `DATABASE_URL` 是否正確，確認 PostgreSQL 服務已啟動。

### Q: 圖片上傳失敗？
確認 Cloudinary 或 S3 憑證已正確設定。

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

## 相關資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Socket.io 文檔](https://socket.io/docs/)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [NextAuth.js 文檔](https://next-auth.js.org/)

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
