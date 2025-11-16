# ⚡ Electron 跨平台桌面應用

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Electron 框架和 AI 輔助開發工具打造現代化的跨平台桌面應用程式。

## 📋 專案簡介

Electron 讓你能夠使用 Web 技術（HTML、CSS、JavaScript）來建立原生桌面應用程式，並且可以在 Windows、macOS 和 Linux 上運行。

### 為什麼選擇 Electron？

- **跨平台**: 一次編寫，處處運行（Windows、macOS、Linux）
- **熟悉的技術**: 使用 HTML/CSS/JavaScript 開發
- **豐富的生態系統**: 可以使用所有 npm 套件
- **原生功能**: 訪問檔案系統、系統通知等原生 API
- **活躍的社群**: 大量的學習資源和第三方工具
- **成功案例**: VS Code、Slack、Discord、Figma 等知名應用

## 🎯 適合開發的應用類型

### 生產力工具
- 📝 筆記應用（類似 Notion、Obsidian）
- ✅ 待辦事項管理器
- 📊 專案管理工具
- 📅 日曆和時間管理

### 開發者工具
- 💻 程式碼編輯器（類似 VS Code）
- 🔍 API 測試工具（類似 Postman）
- 🗄️ 資料庫管理客戶端
- 🐛 除錯工具

### 創意工具
- 🎨 設計工具
- 📸 螢幕截圖/錄影工具
- 🎬 影片編輯器
- 🎵 音樂播放器/編輯器

### 通訊與協作
- 💬 即時通訊應用
- 📹 視訊會議工具
- 📧 電子郵件客戶端
- 🔔 通知中心

### 系統工具
- 📁 檔案管理器
- 🔒 密碼管理器
- 📊 系統監控工具
- 🔄 檔案同步工具

## 🛠️ 技術棧

### 核心技術
- **Electron**: 22.x+ (最新穩定版)
- **Node.js**: 18.x+ LTS
- **Chromium**: 內建最新版本

### 前端框架選項
- **React**: 搭配 React Hooks 和 Context API
- **Vue 3**: 搭配 Composition API
- **Svelte**: 輕量級響應式框架
- **Angular**: 完整的企業級框架

### 狀態管理
- **Redux Toolkit**: React 應用的狀態管理
- **Pinia**: Vue 3 的狀態管理
- **Zustand**: 輕量級狀態管理
- **MobX**: 響應式狀態管理

### UI 元件庫
- **Material-UI (MUI)**: React Material Design
- **Ant Design**: 企業級 UI 設計
- **Vuetify**: Vue Material Design
- **Chakra UI**: 模組化 React UI
- **Tailwind CSS**: 實用優先的 CSS 框架

### 建置工具
- **Vite**: 快速的開發伺服器和建置工具
- **Webpack**: 強大的模組打包工具
- **electron-builder**: Electron 應用打包工具
- **electron-forge**: Electron 官方建置工具

### 進階功能
- **Electron IPC**: 主程序與渲染程序通訊
- **electron-store**: 簡單的資料持久化
- **electron-updater**: 自動更新功能
- **electron-log**: 日誌管理
- **node-notifier**: 系統通知

## 🚀 快速開始

### 方法 1: 使用 Electron Forge（推薦）

```bash
# 使用 AI 輔助工具（如 Cursor）快速建立專案
npm init electron-app@latest my-electron-app

cd my-electron-app
npm start
```

### 方法 2: 使用 Vite + React

```bash
# 建立 Vite + React 專案
npm create vite@latest my-app -- --template react

cd my-app
npm install

# 添加 Electron
npm install --save-dev electron electron-builder vite-plugin-electron

# 啟動開發模式
npm run dev
```

### 方法 3: 從頭開始（學習用）

```bash
mkdir my-electron-app
cd my-electron-app
npm init -y

# 安裝 Electron
npm install --save-dev electron

# 建立主程序檔案
# 使用 AI 輔助生成 main.js 和 index.html
```

### 基本專案結構

```
my-electron-app/
├── package.json
├── main.js                 # 主程序（Main Process）
├── preload.js              # 預載腳本
├── index.html              # 應用入口
├── src/
│   ├── renderer/           # 渲染程序（Renderer Process）
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── components/
│   ├── main/               # 主程序相關
│   │   ├── ipc.js         # IPC 處理
│   │   ├── menu.js        # 選單配置
│   │   └── window.js      # 視窗管理
│   └── shared/             # 共用程式碼
│       ├── constants.js
│       └── utils.js
├── assets/                 # 靜態資源
│   └── icons/
├── build/                  # 建置配置
│   └── icons/
└── dist/                   # 建置輸出
```

## 💡 核心概念

### 1. 主程序 (Main Process)

主程序負責管理應用生命週期和原生功能。

```javascript
// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // 開發模式下開啟 DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

### 2. 渲染程序 (Renderer Process)

渲染程序負責顯示 UI 界面。

```jsx
// src/renderer/App.jsx
import React, { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  const handleClick = async () => {
    // 透過預載腳本暴露的 API 與主程序通訊
    const result = await window.electronAPI.doSomething();
    setMessage(result);
  };

  return (
    <div className="app">
      <h1>我的 Electron 應用</h1>
      <button onClick={handleClick}>執行操作</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
```

### 3. IPC 通訊 (Inter-Process Communication)

主程序和渲染程序之間的安全通訊。

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 給渲染程序
contextBridge.exposeInMainWorld('electronAPI', {
  doSomething: () => ipcRenderer.invoke('do-something'),
  onUpdate: (callback) => ipcRenderer.on('update', callback),
  readFile: (path) => ipcRenderer.invoke('read-file', path)
});
```

```javascript
// main.js (主程序)
const { ipcMain, dialog } = require('electron');
const fs = require('fs').promises;

ipcMain.handle('do-something', async () => {
  // 執行某些操作
  return '操作完成！';
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## 🎨 實作範例

### 範例 1: 簡單的筆記應用

```javascript
// 功能：儲存和載入筆記

// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

ipcMain.handle('save-note', async (event, note) => {
  const notes = store.get('notes', []);
  notes.push({ ...note, id: Date.now() });
  store.set('notes', notes);
  return { success: true };
});

ipcMain.handle('load-notes', async () => {
  return store.get('notes', []);
});
```

```jsx
// renderer (React)
function NotesApp() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const loadedNotes = await window.electronAPI.loadNotes();
    setNotes(loadedNotes);
  };

  const saveNote = async () => {
    await window.electronAPI.saveNote({ content, createdAt: new Date() });
    setContent('');
    loadNotes();
  };

  return (
    <div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} />
      <button onClick={saveNote}>儲存筆記</button>
      <div>
        {notes.map(note => (
          <div key={note.id}>{note.content}</div>
        ))}
      </div>
    </div>
  );
}
```

### 範例 2: 檔案選擇和讀取

```javascript
// main.js
const { dialog } = require('electron');
const fs = require('fs').promises;

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const content = await fs.readFile(result.filePaths[0], 'utf-8');
    return { path: result.filePaths[0], content };
  }

  return null;
});
```

### 範例 3: 系統托盤圖示

```javascript
// main.js
const { app, Tray, Menu } = require('electron');
const path = require('path');

let tray = null;

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, 'assets/icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    { label: '顯示應用', click: () => { mainWindow.show(); } },
    { label: '設定', click: () => { /* 開啟設定 */ } },
    { type: 'separator' },
    { label: '結束', click: () => { app.quit(); } }
  ]);

  tray.setToolTip('我的應用');
  tray.setContextMenu(contextMenu);
});
```

### 範例 4: 自動更新

```javascript
// main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  // 檢查更新
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    // 通知使用者有新版本
  });

  autoUpdater.on('update-downloaded', () => {
    // 通知使用者更新已下載，準備安裝
    autoUpdater.quitAndInstall();
  });
});
```

## 🔒 安全性最佳實踐

### 1. 啟用 Context Isolation

```javascript
const mainWindow = new BrowserWindow({
  webPreferences: {
    contextIsolation: true,  // ✅ 必須啟用
    nodeIntegration: false,   // ✅ 必須關閉
    sandbox: true             // ✅ 建議啟用
  }
});
```

### 2. 使用 Preload 腳本

不要直接暴露 Node.js API，使用 `contextBridge`：

```javascript
// ❌ 不安全
window.fs = require('fs');

// ✅ 安全
contextBridge.exposeInMainWorld('api', {
  readFile: (path) => ipcRenderer.invoke('read-file', path)
});
```

### 3. 驗證 IPC 輸入

```javascript
ipcMain.handle('delete-file', async (event, filePath) => {
  // ✅ 驗證路徑
  if (!isValidPath(filePath)) {
    throw new Error('Invalid path');
  }

  // 執行操作
});
```

### 4. 使用 CSP (Content Security Policy)

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

## 📦 打包與發布

### 使用 electron-builder

```json
// package.json
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.example.myapp",
    "productName": "My App",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "src/**/*",
      "assets/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "build/icon.icns"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icon.png"
    }
  }
}
```

### 程式碼簽署（重要！）

```json
// Windows
{
  "win": {
    "certificateFile": "cert.pfx",
    "certificatePassword": "password"
  }
}

// macOS
{
  "mac": {
    "identity": "Developer ID Application: Your Name"
  }
}
```

## 🧪 測試

### 單元測試（使用 Vitest）

```javascript
// tests/unit/utils.test.js
import { describe, it, expect } from 'vitest';
import { formatDate } from '@/utils';

describe('Utils', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01');
    expect(formatDate(date)).toBe('2024-01-01');
  });
});
```

### E2E 測試（使用 Playwright）

```javascript
// tests/e2e/app.spec.js
const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test('應用應該啟動', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();

  const title = await window.title();
  expect(title).toBe('我的應用');

  await app.close();
});
```

## 🎯 效能優化

### 1. 延遲載入

```javascript
// 使用動態 import
button.addEventListener('click', async () => {
  const module = await import('./heavy-module.js');
  module.doSomething();
});
```

### 2. 優化啟動時間

```javascript
// 使用 V8 快照
app.commandLine.appendSwitch('js-flags', '--expose-gc');

// 延遲載入非必要視窗
app.on('ready', () => {
  createMainWindow();

  // 延遲載入其他視窗
  setTimeout(() => {
    createBackgroundWindow();
  }, 3000);
});
```

### 3. 記憶體管理

```javascript
// 監控記憶體使用
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`Memory: ${memoryUsage.heapUsed / 1024 / 1024} MB`);
}, 10000);

// 清理未使用的視窗
windowMap.forEach((win, id) => {
  if (win.isDestroyed()) {
    windowMap.delete(id);
  }
});
```

## 🤖 AI 開發建議

### 使用 AI 工具開發 Electron 應用

1. **專案初始化**
   - 使用 AI 助手快速生成專案骨架
   - 詢問 AI 關於最佳專案結構建議

2. **IPC 通訊程式碼**
   - AI 協助生成型別安全的 IPC 介面
   - 自動生成主程序和渲染程序的配對程式碼

3. **UI 元件開發**
   - 使用 AI 快速建立 React/Vue 元件
   - AI 協助實作複雜的使用者互動邏輯

4. **效能優化**
   - AI 分析效能瓶頸
   - 建議優化策略和程式碼改進

5. **除錯協助**
   - AI 協助解決跨平台相容性問題
   - 快速定位和修復錯誤

### AI 輔助開發工作流程

```
1. 使用 AI 規劃應用架構
   ↓
2. AI 生成專案骨架和基礎程式碼
   ↓
3. AI 協助實作核心功能
   ↓
4. AI 輔助編寫測試
   ↓
5. AI 協助優化和除錯
   ↓
6. AI 協助生成文檔
```

## 📚 學習資源

### 官方文檔
- [Electron 官方文檔](https://www.electronjs.org/docs)
- [Electron API 參考](https://www.electronjs.org/docs/api)
- [Electron Fiddle](https://www.electronjs.org/fiddle) - 線上練習工具

### 教學資源
- [Electron 中文文檔](https://www.electronjs.org/zh/docs)
- [awesome-electron](https://github.com/sindresorhus/awesome-electron) - 精選資源列表

### 範例專案
- [Electron 官方範例](https://github.com/electron/electron-quick-start)
- [VS Code 原始碼](https://github.com/microsoft/vscode)
- [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)

## 🔧 常見問題

### Q: Electron 應用體積太大？
A:
- 使用 electron-builder 的壓縮選項
- 只打包必要的檔案
- 考慮使用 Tauri（Rust 框架，更小體積）

### Q: 如何減少記憶體使用？
A:
- 使用 `nodeIntegration: false`
- 及時清理不用的視窗和資源
- 避免記憶體洩漏

### Q: 如何實現熱更新？
A:
- 開發環境：使用 electron-reload
- 生產環境：使用 electron-updater

### Q: 跨平台相容性問題？
A:
- 測試所有目標平台
- 使用 path.join() 處理路徑
- 注意不同平台的 UI 規範

## 📊 開發路線圖建議

### 階段 1: 基礎設定（1-2 天）
- [ ] 建立專案骨架
- [ ] 配置開發環境
- [ ] 建立基本視窗
- [ ] 設定熱重載

### 階段 2: 核心功能（1-2 週）
- [ ] 實作主要功能
- [ ] 建立 UI 介面
- [ ] 實作 IPC 通訊
- [ ] 資料持久化

### 階段 3: 進階功能（1-2 週）
- [ ] 選單和快捷鍵
- [ ] 系統托盤
- [ ] 檔案操作
- [ ] 系統整合

### 階段 4: 優化與測試（1 週）
- [ ] 效能優化
- [ ] 編寫測試
- [ ] 跨平台測試
- [ ] 使用者體驗優化

### 階段 5: 打包與發布（3-5 天）
- [ ] 配置建置腳本
- [ ] 程式碼簽署
- [ ] 建立安裝程式
- [ ] 發布和更新機制

## ⚠️ 注意事項

1. **安全性**: 始終遵循 Electron 安全性最佳實踐
2. **效能**: 注意記憶體使用和啟動時間
3. **體積**: Electron 應用體積較大（~150MB+）
4. **更新**: 實作自動更新機制
5. **跨平台**: 在所有目標平台上測試

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: Cursor、GitHub Copilot、Claude Code
**最後更新**: 2025-11-16
**狀態**: 📝 文檔完成，等待專案實作
