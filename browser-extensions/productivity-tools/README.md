# ✅ 生產力工具 - Productivity Tools Extension

> 🚀 **AI 輔助開發的智能待辦事項管理瀏覽器擴充功能**

一個功能豐富的待辦事項管理瀏覽器擴充功能，支援多瀏覽器、雲端同步、智能提醒和 AI 輔助任務管理。

## 📋 專案目標

打造一個簡單但強大的生產力工具，幫助使用者：
- 快速記錄待辦事項
- 智能管理任務優先級
- 跨瀏覽器同步資料
- 設定提醒和截止日期
- 使用 AI 協助任務規劃

## 🎯 核心功能

### 1. 任務管理
- ✅ 新增、編輯、刪除待辦事項
- ⭐ 設定任務優先級（高、中、低）
- 📅 設定截止日期和提醒
- 🏷️ 標籤分類系統
- 📝 任務備註和附件

### 2. 智能功能
- 🤖 AI 輔助任務分解（將大任務拆分為小任務）
- 🎯 智能優先級建議
- 📊 生產力分析和統計
- ⏰ 智能提醒時間建議

### 3. 資料同步
- ☁️ 雲端同步（Firebase/Supabase）
- 🔄 跨瀏覽器資料同步
- 💾 本地離線儲存
- 🔐 資料加密保護

### 4. 使用者介面
- 🎨 簡潔美觀的 UI/UX
- 🌓 暗色/亮色主題切換
- ⌨️ 鍵盤快捷鍵支援
- 📱 響應式設計

## 🛠️ 技術棧

### 前端框架
- **React 18** - UI 框架
- **TypeScript** - 型別安全
- **Tailwind CSS** - 樣式框架
- **Zustand** - 狀態管理

### 瀏覽器 API
- **Chrome Storage API** - 本地資料儲存
- **Chrome Alarms API** - 定時提醒
- **Chrome Notifications API** - 系統通知
- **WebExtension Polyfill** - 跨瀏覽器相容

### 建置工具
- **Vite** - 快速建置工具
- **CRXJS** - Chrome 擴充功能 Vite 插件
- **ESLint + Prettier** - 程式碼品質

### 後端服務（可選）
- **Firebase** - 雲端同步和身份驗證
- **Supabase** - 開源替代方案
- **OpenAI API** - AI 功能

## 🚀 快速開始

### 安裝依賴

```bash
# 進入專案目錄
cd browser-extensions/productivity-tools

# 安裝依賴
npm install
```

### 開發模式

```bash
# 啟動開發伺服器（自動重新載入）
npm run dev

# Chrome 瀏覽器：
# 1. 打開 chrome://extensions/
# 2. 開啟「開發人員模式」
# 3. 點擊「載入未封裝項目」
# 4. 選擇 dist/ 資料夾
```

### 建置生產版本

```bash
# 建置所有瀏覽器版本
npm run build

# 建置特定瀏覽器
npm run build:chrome
npm run build:firefox
npm run build:edge
```

## 📁 專案結構

```
productivity-tools/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifest.json              # Manifest V3 設定
├── src/
│   ├── manifest.ts            # Manifest 設定
│   ├── background/
│   │   └── service-worker.ts  # Background service worker
│   ├── popup/
│   │   ├── Popup.tsx          # 彈出視窗主元件
│   │   ├── index.tsx
│   │   └── index.html
│   ├── options/
│   │   ├── Options.tsx        # 設定頁面
│   │   ├── index.tsx
│   │   └── index.html
│   ├── components/
│   │   ├── TaskList.tsx       # 任務列表元件
│   │   ├── TaskItem.tsx       # 任務項目元件
│   │   ├── AddTask.tsx        # 新增任務表單
│   │   └── FilterBar.tsx      # 篩選欄
│   ├── hooks/
│   │   ├── useTasks.ts        # 任務管理 hook
│   │   ├── useStorage.ts      # 儲存管理 hook
│   │   └── useSync.ts         # 同步管理 hook
│   ├── store/
│   │   └── taskStore.ts       # Zustand 狀態管理
│   ├── services/
│   │   ├── storage.ts         # Storage API 封裝
│   │   ├── sync.ts            # 雲端同步服務
│   │   ├── ai.ts              # AI 功能整合
│   │   └── notifications.ts   # 通知服務
│   ├── types/
│   │   └── task.ts            # TypeScript 型別定義
│   └── utils/
│       ├── date.ts            # 日期處理工具
│       └── priority.ts        # 優先級計算
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── _locales/              # 多語言支援
│       ├── en/
│       │   └── messages.json
│       └── zh_TW/
│           └── messages.json
└── tests/
    ├── unit/
    └── e2e/
```

## 💻 核心程式碼範例

### Manifest V3 設定

```json
{
  "manifest_version": 3,
  "name": "Productivity Tools - AI Todo Manager",
  "version": "1.0.0",
  "description": "AI-powered todo list and productivity tracker",
  "permissions": [
    "storage",
    "alarms",
    "notifications"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "options_page": "options.html"
}
```

### 任務型別定義

```typescript
// src/types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  reminders?: Reminder[];
  subtasks?: SubTask[];
}

export interface Reminder {
  id: string;
  time: Date;
  notified: boolean;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}
```

### Storage 服務

```typescript
// src/services/storage.ts
import { Task } from '../types/task';

export class StorageService {
  async getTasks(): Promise<Task[]> {
    const result = await chrome.storage.local.get('tasks');
    return result.tasks || [];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await chrome.storage.local.set({ tasks });
  }

  async addTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
      await this.saveTasks(tasks);
    }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    await this.saveTasks(filtered);
  }
}
```

## 🤖 AI 功能整合

### OpenAI API 整合範例

```typescript
// src/services/ai.ts
export class AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async breakdownTask(taskTitle: string): Promise<string[]> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a productivity assistant. Break down tasks into smaller, actionable subtasks.'
          },
          {
            role: 'user',
            content: `Break down this task into 3-5 subtasks: ${taskTitle}`
          }
        ]
      })
    });

    const data = await response.json();
    const subtasks = data.choices[0].message.content
      .split('\n')
      .filter((line: string) => line.trim());

    return subtasks;
  }

  async suggestPriority(task: Task): Promise<'high' | 'medium' | 'low'> {
    // AI 分析任務內容和截止日期，建議優先級
    const daysUntilDue = task.dueDate
      ? Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysUntilDue && daysUntilDue <= 2) return 'high';
    if (daysUntilDue && daysUntilDue <= 7) return 'medium';
    return 'low';
  }
}
```

## 🎨 UI/UX 設計

### 主要畫面
1. **彈出視窗 (Popup)** - 快速查看和新增任務
2. **設定頁面 (Options)** - 詳細設定和資料管理
3. **通知** - 任務提醒和完成慶祝

### 設計原則
- 簡潔直觀的介面
- 最少點擊完成操作
- 視覺化優先級和進度
- 愉悅的動畫效果

## 🧪 開發路線圖

### Phase 1: 基礎功能 ✅
- [x] 基本專案設定
- [x] Manifest V3 設定
- [ ] 基本任務 CRUD
- [ ] 本地儲存整合
- [ ] 簡單 UI 介面

### Phase 2: 進階功能
- [ ] 優先級和標籤系統
- [ ] 截止日期和提醒
- [ ] 子任務支援
- [ ] 搜尋和篩選

### Phase 3: AI 整合
- [ ] AI 任務分解
- [ ] 智能優先級建議
- [ ] 生產力分析
- [ ] 自然語言輸入

### Phase 4: 雲端同步
- [ ] Firebase 整合
- [ ] 跨裝置同步
- [ ] 使用者帳號系統
- [ ] 資料備份還原

### Phase 5: 完善與發布
- [ ] 多語言支援
- [ ] 暗色主題
- [ ] 鍵盤快捷鍵
- [ ] 效能優化
- [ ] 發布到 Chrome Web Store

## 📚 使用 AI 工具開發

### 推薦工作流程

1. **需求分析** - 使用 Claude/ChatGPT 協助規劃功能
2. **程式碼生成** - 使用 Cursor/Copilot 快速生成元件
3. **UI 設計** - 使用 v0.dev 生成 UI 元件
4. **測試** - AI 協助撰寫測試案例
5. **文檔** - AI 生成 API 文檔

### AI 提示範例

```
為瀏覽器擴充功能創建一個任務列表元件，
要求：
- 使用 React + TypeScript
- 支援拖放排序
- 顯示優先級顏色
- 點擊可編輯
- 支援鍵盤快捷鍵
```

## ⚙️ 設定選項

使用者可設定：
- 預設優先級
- 提醒時間偏好
- 主題選擇
- 同步設定
- AI 功能開關
- 通知偏好

## 🔒 隱私與安全

- ✅ 所有資料本地優先儲存
- ✅ 雲端同步使用加密傳輸
- ✅ 不收集個人識別資訊
- ✅ 開源程式碼可審查
- ✅ 可選擇完全離線使用

## 🤝 貢獻指南

歡迎貢獻！可以協助的方向：
- 🐛 回報 Bug
- 💡 提出新功能
- 🎨 UI/UX 改進
- 🌍 翻譯和本地化
- 📝 文檔改進

## 📄 授權

MIT License

---

**使用 AI 打造更智能的生產力工具** 🚀

最後更新: 2025-11-16
狀態: 🚧 開發中
