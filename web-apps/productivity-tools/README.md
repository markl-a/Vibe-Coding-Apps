# ✅ 生產力工具
🤖 **AI-Driven | AI-Native** 🚀

使用 AI 輔助開發的生產力應用，包含待辦事項、筆記系統、專案管理工具與時間追蹤器。

## 📋 專案目標

建立功能完整的生產力工具套件，幫助用戶提升工作效率、管理任務、記錄筆記與追蹤時間，並充分利用 AI 工具加速開發流程。

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

## 📊 開發路線圖

### Phase 1: 待辦事項應用
- [x] 技術棧選擇
- [x] 專案架構設計
- [ ] 任務 CRUD
- [ ] 任務排序
- [ ] 專案系統
- [ ] 標籤系統
- [ ] 篩選與搜尋

### Phase 2: 筆記應用
- [ ] TipTap 編輯器整合
- [ ] 筆記本系統
- [ ] 標籤功能
- [ ] 全文搜尋
- [ ] 筆記分享

### Phase 3: 專案管理
- [ ] 看板視圖
- [ ] 列表視圖
- [ ] 任務指派
- [ ] 檔案附件
- [ ] 評論系統

### Phase 4: 時間追蹤
- [ ] 計時器
- [ ] 時間記錄
- [ ] 統計報表
- [ ] 番茄鐘功能

### Phase 5: 整合與優化
- [ ] 跨應用整合
- [ ] 離線支援（PWA）
- [ ] 數據匯出
- [ ] 效能優化
- [ ] 部署

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
