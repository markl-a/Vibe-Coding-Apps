# ✅ 生產力工具
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的生產力應用套件，包含 5 個完整的工具，每個都整合了智能 AI 功能來提升你的工作效率。

## 🎯 已實現的工具

### 1. ⏱️ Pomodoro Timer（番茄鐘）
專注工作的最佳夥伴，內建 AI 智能分析你的工作模式。
- ✅ 完整的計時功能
- 🤖 **AI 生產力分析** - 追蹤並分析你的專注力表現
- 🤖 **智能休息建議** - 根據工作時長給出最佳休息建議
- 🤖 **工作模式識別** - 自動識別你最高效的工作時段

### 2. ✅ Simple Todo（智能待辦）
不只是待辦清單，更是你的 AI 任務助手。
- 📝 完整的任務管理（CRUD）
- 🤖 **AI 自然語言解析** - 輸入「明天下午3點完成報告 #工作 !高」自動解析
- 🤖 **智能優先級建議** - AI 自動識別任務重要性
- 🤖 **生產力評分** - 實時追蹤你的任務完成效率

### 3. 📝 Markdown Notes（筆記系統）
功能強大的 Markdown 編輯器，支持即時預覽。
- ✏️ Markdown 編輯與即時預覽
- 🏷️ 標籤系統與全文搜尋
- 📚 筆記本分類管理
- 💾 匯入/匯出功能

### 4. 🎯 Habit Tracker（習慣追蹤）
培養好習慣的智能工具，可視化你的進步。
- ☑️ 每日打卡追蹤
- 🔥 連續天數統計
- 📊 完成率分析
- 🗓️ 熱力圖與趨勢圖表

### 5. ⏰ Time Tracker（時間追蹤）🆕
精確追蹤時間使用，AI 分析工作效率。
- ⏱️ 精確的計時器（開始/暫停/停止）
- 📊 統計分析（日/週/月/總計）
- 🤖 **AI 最佳時段識別** - 找出你的黃金工作時間
- 🤖 **專案效率分析** - 了解哪些專案最耗時
- 🤖 **效率分數計算** - 量化你的工作效率

## 🤖 AI 智能功能特色

所有工具都整合了強大的 AI 功能：

- **智能數據分析**：自動分析使用模式和行為習慣
- **個性化建議**：基於你的數據提供定制化建議
- **模式識別**：識別最佳工作時段和效率高峰
- **預測性洞察**：預測任務完成時間和工作負荷
- **自動分類**：智能識別和分類任務與項目

## 📋 專案目標

建立功能完整的生產力工具套件，幫助用戶提升工作效率、管理任務、記錄筆記與追蹤時間，並充分利用 AI 技術提供個性化的智能建議。

## 🎯 應用類型

### 1. 待辦事項應用（Todo App）
- 任務建立與管理
- 任務分類與標籤
- 優先級設定
- 截止日期提醒
- 子任務支援
- 任務篩選與搜尋
- 完成度追蹤
- 重複任務
- 任務拖曳排序

### 2. 筆記系統（Note-taking App）
- Markdown 編輯器
- 富文本編輯
- 程式碼區塊支援
- 筆記本分類
- 標籤系統
- 全文搜尋
- 雲端同步
- 版本歷史
- 筆記分享
- 附件支援

### 3. 專案管理工具（Project Management）
- 看板視圖（Kanban）
- 列表視圖
- 甘特圖
- 專案里程碑
- 團隊協作
- 任務指派
- 進度追蹤
- 檔案附件
- 評論討論
- 活動時間軸

### 4. 時間追蹤器（Time Tracker）
- 計時器
- 手動時間記錄
- 專案時間統計
- 時間報表
- 生產力分析
- 番茄鐘技術
- 休息提醒
- 時間視覺化
- CSV 匯出

### 5. 習慣追蹤器（Habit Tracker）
- 每日習慣追蹤
- 連續天數統計
- 習慣視覺化
- 提醒通知
- 統計分析
- 月曆視圖
- 習慣目標設定

## 🛠️ 技術棧選項

### Option 1: Next.js + TypeScript (推薦)
```
Frontend:
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Editor: TipTap / Lexical
- State: Zustand / Jotai
- Drag & Drop: dnd-kit

Backend:
- API: Next.js API Routes / tRPC
- Database: PostgreSQL + Prisma
- Auth: NextAuth.js
- Storage: AWS S3 / Cloudinary
- Search: PostgreSQL Full-text

Deployment:
- Vercel
```

### Option 2: Electron (桌面應用)
```
- Electron + React
- TypeScript
- Tailwind CSS
- SQLite (本地資料庫)
- 離線優先
- 跨平台（Windows, Mac, Linux）
```

### Option 3: PWA (漸進式網頁應用)
```
- Next.js / React
- Service Workers
- IndexedDB
- 離線支援
- 安裝到桌面
- 推播通知
```

### Option 4: Notion-like (All-in-one)
```
- Next.js + tRPC
- Block-based Editor
- 資料庫視圖
- 嵌入支援
- 模板系統
```

## 🚀 快速開始

### Option 1: Next.js 待辦事項應用

```bash
# 建立 Next.js 專案
npx create-next-app@latest my-todo-app --typescript --tailwind --app

cd my-todo-app

# 安裝依賴
npm install @prisma/client
npm install next-auth
npm install zustand
npm install react-hook-form zod @hookform/resolvers
npm install @dnd-kit/core @dnd-kit/sortable
npm install date-fns
npm install lucide-react

# 開發依賴
npm install -D prisma

# 初始化 Prisma
npx prisma init

# 啟動開發伺服器
npm run dev
```

### Option 2: Next.js 筆記應用（使用 TipTap）

```bash
# 建立專案
npx create-next-app@latest my-notes-app --typescript --tailwind

cd my-notes-app

# 安裝 TipTap 編輯器
npm install @tiptap/react @tiptap/starter-kit
npm install @tiptap/extension-link
npm install @tiptap/extension-image
npm install @tiptap/extension-code-block-lowlight
npm install lowlight

# 其他依賴
npm install @prisma/client
npm install zustand
```

## 📁 專案結構（待辦事項應用範例）

```
productivity-tools/
├── README.md
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── prisma/
│   └── schema.prisma
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # 待辦清單
│   ├── today/
│   │   └── page.tsx                # 今日任務
│   ├── upcoming/
│   │   └── page.tsx                # 即將到來
│   ├── projects/
│   │   ├── page.tsx                # 專案列表
│   │   └── [projectId]/
│   │       └── page.tsx            # 專案詳情
│   ├── labels/
│   │   └── [labelId]/
│   │       └── page.tsx            # 標籤篩選
│   ├── completed/
│   │   └── page.tsx                # 已完成
│   └── api/
│       ├── tasks/
│       ├── projects/
│       ├── labels/
│       └── auth/
├── components/
│   ├── tasks/
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskFilters.tsx
│   │   └── SubTaskList.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   └── ProjectSelector.tsx
│   ├── labels/
│   │   ├── LabelBadge.tsx
│   │   └── LabelSelector.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Dropdown.tsx
│   │   └── DatePicker.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
├── store/
│   ├── taskStore.ts
│   └── projectStore.ts
├── types/
│   ├── task.ts
│   ├── project.ts
│   └── label.ts
├── hooks/
│   ├── useTasks.ts
│   └── useProjects.ts
└── public/
```

## 🗄️ 資料庫結構（Prisma Schema）

### 待辦事項應用

```prisma
// schema.prisma

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  password  String
  tasks     Task[]
  projects  Project[]
  labels    Label[]
  createdAt DateTime  @default(now())
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  completed   Boolean   @default(false)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  project     Project?  @relation(fields: [projectId], references: [id])
  projectId   String?
  labels      Label[]
  parent      Task?     @relation("SubTasks", fields: [parentId], references: [id])
  parentId    String?
  subTasks    Task[]    @relation("SubTasks")
  order       Int       @default(0)
  recurring   String?   // Cron expression
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String?
  icon        String?
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  tasks       Task[]
  archived    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Label {
  id        String   @id @default(cuid())
  name      String
  color     String
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  tasks     Task[]
  createdAt DateTime @default(now())
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### 筆記應用

```prisma
model Note {
  id        String   @id @default(cuid())
  title     String
  content   Json     // TipTap JSON content
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  notebook  Notebook @relation(fields: [notebookId], references: [id])
  notebookId String
  tags      Tag[]
  pinned    Boolean  @default(false)
  archived  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Notebook {
  id        String   @id @default(cuid())
  name      String
  color     String?
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  notes     Note[]
  createdAt DateTime @default(now())
}

model Tag {
  id        String   @id @default(cuid())
  name      String
  notes     Note[]
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  createdAt DateTime @default(now())
}
```

## 🤖 AI 輔助開發建議

### 1. 待辦事項應用架構

```
提示詞範例：
"請設計一個 Next.js 14 待辦事項應用的完整架構，包含：
- 任務 CRUD 操作
- 拖曳排序功能（dnd-kit）
- 任務篩選與搜尋
- 專案與標籤系統
- 截止日期提醒
- 資料庫設計（Prisma + PostgreSQL）
使用 TypeScript 和 App Router。"
```

### 2. TipTap 編輯器整合

```
提示詞範例：
"請幫我實作 TipTap 富文本編輯器，包含：
1. 基本格式化（粗體、斜體、底線）
2. 標題（H1-H6）
3. 程式碼區塊（語法高亮）
4. 圖片上傳
5. 連結
6. 列表（有序、無序）
7. 儲存為 JSON
使用 React + TypeScript。"
```

### 3. 拖曳排序功能

```
提示詞範例：
"請使用 @dnd-kit 實作任務拖曳排序，包含：
- 垂直列表拖曳
- 任務順序持久化
- 拖曳時的視覺回饋
- 拖曳動畫
使用 React + TypeScript。"
```

### 4. 番茄鐘計時器

```
提示詞範例：
"請建立一個番茄鐘計時器組件，包含：
- 25 分鐘工作計時
- 5 分鐘短休息
- 15 分鐘長休息
- 暫停/繼續功能
- 音效提醒
- 統計追蹤
使用 React + TypeScript。"
```

## 💻 核心功能實作範例

### 1. 任務拖曳排序

```typescript
// components/tasks/TaskList.tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableTaskItem } from './SortableTaskItem'

interface TaskListProps {
  tasks: Task[]
  onReorder: (tasks: Task[]) => void
}

export const TaskList = ({ tasks, onReorder }: TaskListProps) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex(t => t.id === active.id)
      const newIndex = tasks.findIndex(t => t.id === over?.id)

      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)
      onReorder(reorderedTasks)
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <SortableTaskItem key={task.id} task={task} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

### 2. TipTap 編輯器

```typescript
// components/editor/TipTapEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { lowlight } from 'lowlight'

interface EditorProps {
  content: string
  onChange: (content: string) => void
}

export const TipTapEditor = ({ content, onChange }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      CodeBlockLowlight.configure({
        lowlight
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) return null

  return (
    <div className="border rounded-lg">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="prose max-w-none p-4" />
    </div>
  )
}
```

### 3. 番茄鐘計時器

```typescript
// components/timer/PomodoroTimer.tsx
import { useState, useEffect } from 'react'

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
}

export const PomodoroTimer = () => {
  const [mode, setMode] = useState<TimerMode>('work')
  const [seconds, setSeconds] = useState(DURATIONS.work)
  const [isActive, setIsActive] = useState(false)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1)
      }, 1000)
    } else if (seconds === 0) {
      handleTimerComplete()
    }

    return () => clearInterval(interval)
  }, [isActive, seconds])

  const handleTimerComplete = () => {
    // 播放音效
    new Audio('/notification.mp3').play()

    if (mode === 'work') {
      const newCount = completedPomodoros + 1
      setCompletedPomodoros(newCount)

      // 每 4 個番茄鐘後長休息
      setMode(newCount % 4 === 0 ? 'longBreak' : 'shortBreak')
    } else {
      setMode('work')
    }

    setIsActive(false)
  }

  const toggleTimer = () => setIsActive(!isActive)

  const resetTimer = () => {
    setIsActive(false)
    setSeconds(DURATIONS[mode])
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  return (
    <div className="text-center p-8">
      <div className="text-6xl font-bold mb-8">
        {formatTime(seconds)}
      </div>

      <div className="space-x-4">
        <button onClick={toggleTimer}>
          {isActive ? '暫停' : '開始'}
        </button>
        <button onClick={resetTimer}>
          重置
        </button>
      </div>

      <div className="mt-4">
        完成: {completedPomodoros} 個番茄鐘
      </div>
    </div>
  )
}
```

## 🎉 已完成功能 (2025-11-18 更新)

### ✅ Phase 1: 核心工具開發
- [x] **Pomodoro Timer（番茄鐘）**
  - [x] 完整的計時功能
  - [x] 工作/休息模式切換
  - [x] 統計追蹤
  - [x] 🤖 AI 生產力分析
  - [x] 🤖 智能休息建議
  - [x] 🤖 工作模式識別

- [x] **Simple Todo（待辦事項）**
  - [x] 任務 CRUD 完整實現
  - [x] 優先級管理
  - [x] 截止日期設定
  - [x] 篩選與搜尋
  - [x] 🤖 AI 自然語言輸入解析
  - [x] 🤖 智能任務分類
  - [x] 🤖 生產力評分系統

- [x] **Markdown Notes（Markdown 筆記）**
  - [x] Markdown 編輯器整合
  - [x] 即時預覽
  - [x] 標籤系統
  - [x] 全文搜尋
  - [x] 筆記本分類
  - [x] 匯入/匯出功能

- [x] **Habit Tracker（習慣追蹤器）**
  - [x] 每日打卡功能
  - [x] 連續天數統計
  - [x] 習慣分類
  - [x] 完成率分析
  - [x] 熱力圖可視化
  - [x] 趨勢圖表

- [x] **Time Tracker（時間追蹤器）** 🆕
  - [x] 精確計時器
  - [x] 暫停/繼續功能
  - [x] 任務和專案分類
  - [x] 時間記錄管理
  - [x] 統計分析（日/週/月/總計）
  - [x] 🤖 AI 最佳工作時段識別
  - [x] 🤖 專案效率分析
  - [x] 🤖 效率分數計算
  - [x] 🤖 個性化建議

### ✅ Phase 2: AI 智能功能整合
- [x] 所有工具都已整合 AI 功能
- [x] 智能數據分析
- [x] 個性化建議系統
- [x] 模式識別算法
- [x] 用戶行為追蹤

### 📊 開發路線圖

### Phase 3: 高級功能
- [ ] 跨工具數據整合
- [ ] 圖表可視化增強
- [ ] 自定義主題
- [ ] 多語言支持

### Phase 4: PWA 與優化
- [ ] Service Worker 實現
- [ ] 離線完整支援
- [ ] 應用安裝功能
- [ ] 推播通知
- [ ] 效能優化

### Phase 5: 部署與分享
- [ ] 部署到線上
- [ ] 使用文檔完善
- [ ] 視頻教程
- [ ] 社區建設

## 🔥 進階功能建議

### 1. 自然語言任務輸入

```typescript
// 使用 AI 解析自然語言
const parseNaturalLanguage = async (input: string) => {
  // "明天下午3點完成報告 #工作 !高"
  // -> { title: "完成報告", dueDate: "2025-11-17 15:00", labels: ["工作"], priority: "HIGH" }

  // 可以使用 ChatGPT API 或本地 NLP 庫
}
```

### 2. 智能提醒

```typescript
// 根據任務截止時間和優先級智能提醒
const getSmartReminders = (task: Task) => {
  if (task.priority === 'URGENT') {
    return [
      { time: subDays(task.dueDate, 1), message: '緊急任務明天到期' },
      { time: subHours(task.dueDate, 2), message: '緊急任務 2 小時後到期' }
    ]
  }
  // ...
}
```

### 3. 任務模板

```typescript
// 預設任務模板
const templates = [
  {
    name: '週計劃',
    tasks: [
      { title: '回顧上週', priority: 'MEDIUM' },
      { title: '設定本週目標', priority: 'HIGH' },
      { title: '規劃每日任務', priority: 'MEDIUM' }
    ]
  }
]
```

### 4. 數據同步

```typescript
// 使用 SWR 或 TanStack Query 實現即時同步
import useSWR from 'swr'

const useTasks = () => {
  const { data, error, mutate } = useSWR('/api/tasks', fetcher, {
    refreshInterval: 5000, // 5 秒自動重新整理
    revalidateOnFocus: true
  })

  return { tasks: data, isLoading: !error && !data, mutate }
}
```

## 📱 PWA 支援

### Service Worker 配置

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/styles.css',
        '/app.js'
      ])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
```

### Manifest.json

```json
{
  "name": "My Productivity App",
  "short_name": "Productivity",
  "description": "生產力工具套件",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🚀 部署建議

### Vercel 部署

```bash
# 環境變數
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."

# 部署
vercel --prod
```

### PWA 檢查清單

- [ ] Service Worker 註冊
- [ ] Manifest.json 配置
- [ ] 離線頁面
- [ ] 快取策略
- [ ] 推播通知
- [ ] 安裝提示

## 🤝 貢獻與改進

歡迎提出改進建議！可以協助的方向：

- ✅ 新功能開發
- 🎨 UI/UX 改進
- ⚡ 效能優化
- 📱 移動端優化
- 🌐 多語言支援
- ♿ 可訪問性改善

## 📄 授權

MIT License

## 🔗 相關資源

### 編輯器
- [TipTap](https://tiptap.dev/)
- [Lexical](https://lexical.dev/)
- [Slate](https://www.slatejs.org/)
- [ProseMirror](https://prosemirror.net/)

### 開源專案參考
- [Todoist](https://github.com/Doist/todoist-api)
- [Notion Clone](https://github.com/konstantinmuenster/notion-clone)
- [Trello Clone](https://github.com/oldboyxx/jira_clone)
- [Linear Clone](https://github.com/tolgee/linear-clone)

---

**最後更新**: 2025-11-16
**狀態**: 🚧 規劃中
