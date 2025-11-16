# T3 Stack 論壇系統

使用 T3 Stack 打造的現代化論壇平台 - 完整型別安全、高效能、易擴展。

## 什麼是 T3 Stack？

T3 Stack 是由 Theo Browne 推廣的完整 TypeScript 技術棧，提供端到端的型別安全和最佳開發體驗。

## 功能特色

- ✨ **完整型別安全** - 從資料庫到 UI 的端到端型別安全
- ⚡ **高效能** - Next.js 14 SSR + tRPC 高效 API
- 🔐 **安全認證** - NextAuth.js 完整認證系統
- 💬 **討論系統** - 主題發布、留言、巢狀回覆
- 🏆 **聲望系統** - 用戶聲望、徽章、排行榜
- 📊 **投票機制** - 讚/踩投票、最佳解答
- 🏷️ **標籤分類** - 論壇分類、文章標籤
- 🔍 **搜尋功能** - 全文搜尋文章與用戶
- 📱 **響應式設計** - 完美支援各種裝置
- 🎨 **Markdown 編輯** - 支援 Markdown 與程式碼高亮

## 核心技術

### T3 Stack 組成

1. **Next.js 14** - React 框架
   - App Router / Pages Router
   - Server-Side Rendering
   - Static Site Generation
   - Image Optimization

2. **tRPC** - Type-Safe API
   - 端到端型別安全
   - 無需 Schema 定義
   - 自動型別推斷
   - React Query 整合

3. **Prisma** - 資料庫 ORM
   - 型別安全的資料庫操作
   - 自動遷移
   - Schema 管理
   - Prisma Studio

4. **NextAuth.js** - 認證系統
   - 多種登入方式
   - Session 管理
   - JWT Token
   - OAuth 支援

5. **Tailwind CSS** - 樣式框架
   - Utility-First CSS
   - 響應式設計
   - 深色模式支援

## 核心功能

### 1. 用戶系統
- Email/密碼註冊登入
- OAuth 社交登入（Google, GitHub 等）
- 個人資料頁面
- 聲望與等級系統
- 徽章獎勵
- 活動歷史

### 2. 論壇分類
- 多層級分類
- 自訂分類圖示與顏色
- 版主管理
- 分類描述與規則

### 3. 文章發布
- Markdown 編輯器
- 程式碼高亮顯示
- 圖片上傳
- 標籤系統
- 草稿儲存
- 文章置頂/鎖定

### 4. 留言系統
- 巢狀回覆（無限層級）
- @提及用戶
- 引用回覆
- 留言編輯與刪除
- 最佳解答標記

### 5. 投票機制
- 讚/踩投票
- 聲望計算
- 投票歷史
- 防止重複投票

### 6. 搜尋功能
- 文章全文搜尋
- 用戶搜尋
- 標籤搜尋
- 進階篩選

### 7. 通知系統
- 回覆通知
- @提及通知
- 私訊通知
- 系統公告

### 8. 管理功能
- 管理員權限
- 版主系統
- 內容審核
- 用戶封禁
- 統計分析

## 快速開始

### 前置需求

- Node.js 18+
- PostgreSQL 資料庫
- pnpm (推薦) 或 npm

### 安裝依賴

```bash
pnpm install
# 或
npm install
```

### 環境變數設定

建立 `.env` 檔案：

```bash
# 資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/t3_forum"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers（可選）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 資料庫設置

```bash
# 產生 Prisma Client
pnpm prisma generate

# 執行資料庫遷移
pnpm prisma migrate dev

# 填充種子資料（可選）
pnpm prisma db seed

# 開啟 Prisma Studio（資料庫視覺化管理）
pnpm prisma studio
```

### 開發模式

```bash
pnpm dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
pnpm build
pnpm start
```

## 專案結構

```
t3-forum/
├── prisma/
│   ├── schema.prisma          # Prisma Schema（資料庫結構）
│   └── migrations/            # 資料庫遷移記錄
├── public/                    # 靜態資源
├── src/
│   ├── pages/                 # Next.js Pages
│   │   ├── _app.tsx          # App 入口
│   │   ├── index.tsx         # 首頁
│   │   ├── forum/            # 論壇頁面
│   │   └── api/
│   │       ├── auth/         # NextAuth API
│   │       └── trpc/         # tRPC API 端點
│   ├── components/           # React 組件
│   │   ├── forum/
│   │   │   ├── PostCard.tsx
│   │   │   ├── CommentList.tsx
│   │   │   └── PostEditor.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   ├── server/               # 後端邏輯
│   │   ├── api/
│   │   │   ├── root.ts      # tRPC Root Router
│   │   │   ├── trpc.ts      # tRPC 設定
│   │   │   └── routers/     # tRPC Routers
│   │   │       ├── post.ts
│   │   │       ├── comment.ts
│   │   │       └── user.ts
│   │   ├── auth.ts          # NextAuth 設定
│   │   └── db.ts            # Prisma Client
│   ├── styles/
│   │   └── globals.css      # 全局樣式
│   └── utils/
│       └── api.ts           # tRPC Client
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## tRPC 使用範例

### 定義 Router

```typescript
// src/server/api/routers/post.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.post.findMany({
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(5).max(200),
      content: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.post.create({
        data: {
          ...input,
          authorId: ctx.session.user.id,
        },
      });
    }),
});
```

### 在組件中使用

```typescript
import { api } from "@/utils/api";

function PostList() {
  // 查詢
  const { data, isLoading } = api.post.getAll.useQuery({ limit: 10 });

  // Mutation
  const createPost = api.post.create.useMutation({
    onSuccess: () => {
      // 刷新資料
      utils.post.getAll.invalidate();
    },
  });

  const handleSubmit = (title: string, content: string) => {
    createPost.mutate({ title, content });
  };

  if (isLoading) return <div>載入中...</div>;

  return (
    <div>
      {data?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

## Prisma Schema 範例

```prisma
model User {
  id         String    @id @default(cuid())
  email      String    @unique
  name       String?
  reputation Int       @default(0)
  posts      Post[]
  comments   Comment[]
  votes      Vote[]
  createdAt  DateTime  @default(now())
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  comments  Comment[]
  votes     Vote[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Comment {
  id       String    @id @default(cuid())
  content  String
  author   User      @relation(fields: [authorId], references: [id])
  authorId String
  post     Post      @relation(fields: [postId], references: [id])
  postId   String
  parent   Comment?  @relation("Replies", fields: [parentId], references: [id])
  parentId String?
  replies  Comment[] @relation("Replies")
}
```

## 認證設置

### NextAuth.js 配置

```typescript
// src/server/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};
```

### 在組件中使用

```typescript
import { useSession, signIn, signOut } from "next-auth/react";

function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <>
        <p>已登入為 {session.user?.email}</p>
        <button onClick={() => signOut()}>登出</button>
      </>
    );
  }

  return <button onClick={() => signIn()}>登入</button>;
}
```

## 部署

### Vercel 部署（推薦）

T3 Stack 專為 Vercel 優化：

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或直接在 Vercel 網站匯入 GitHub repository。

### 環境變數設定

在 Vercel Dashboard 設定以下環境變數：
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- OAuth Provider 憑證

### Railway / Render 部署

1. 建立 PostgreSQL 資料庫
2. 設定環境變數
3. 連接 GitHub repository
4. 自動部署

## 效能優化

- ✅ React Query 快取管理
- ✅ tRPC 批次請求
- ✅ Prisma 查詢優化
- ✅ Next.js Image 優化
- ✅ 程式碼分割（Code Splitting）
- ✅ ISR（Incremental Static Regeneration）

## 安全性

- 🔒 tRPC 型別安全
- 🔒 Prisma 防 SQL Injection
- 🔒 NextAuth.js Session 管理
- 🔒 CSRF 保護
- 🔒 XSS 防護
- 🔒 Rate Limiting
- 🔒 內容審核

## 測試

```bash
# 單元測試
pnpm test

# E2E 測試
pnpm test:e2e

# 型別檢查
pnpm type-check
```

## 進階功能建議

- 📊 即時通知（WebSocket）
- 🔍 Elasticsearch 全文搜尋
- 📱 PWA 支援
- 🌐 國際化（i18n）
- 🎨 主題切換
- 📈 統計分析儀表板
- 🤖 AI 內容推薦
- 💰 付費功能（Stripe）

## T3 Stack 優勢

### 1. 完整型別安全
- 從資料庫到 UI 的端到端型別推斷
- 無需手動定義 API Schema
- 編譯時錯誤檢查

### 2. 開發體驗
- 自動補全（IntelliSense）
- 型別推斷
- 重構安全
- 熱模組替換（HMR）

### 3. 效能
- tRPC 批次請求
- React Query 智慧快取
- Next.js SSR/SSG
- Prisma 查詢優化

### 4. 可維護性
- 清晰的專案結構
- 型別安全減少 Bug
- 易於測試
- 文檔完善

## 常見問題

### Q: tRPC vs REST vs GraphQL？
A: tRPC 提供 REST 的簡單性 + GraphQL 的型別安全，且無需額外的 Schema 定義。

### Q: 為什麼選擇 Prisma？
A: Prisma 提供型別安全的資料庫操作、自動遷移、優秀的開發體驗。

### Q: 可以使用其他資料庫嗎？
A: 可以，Prisma 支援 PostgreSQL、MySQL、SQLite、MongoDB 等。

### Q: 如何新增 API 端點？
A: 在 `src/server/api/routers/` 新增 Router，並在 `root.ts` 註冊。

## 學習資源

- [T3 Stack 官方文檔](https://create.t3.gg/)
- [tRPC 文檔](https://trpc.io/docs)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Next.js 文檔](https://nextjs.org/docs)
- [NextAuth.js 文檔](https://next-auth.js.org/)

## 範例專案

- [T3 Gallery](https://github.com/t3-oss/create-t3-app/tree/next/examples/create-t3-app)
- [Taxonomy](https://github.com/shadcn/taxonomy)
- [Ping.gg](https://github.com/pingdotgg)

## 貢獻

歡迎提交 Issue 和 Pull Request！

## License

MIT License

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**技術棧**: Next.js 14 + tRPC + Prisma + NextAuth.js + Tailwind CSS
