# 🦀 Tauri 輕量級跨平台桌面應用

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Tauri 框架和 AI 輔助開發工具打造輕量、安全、高效能的現代化桌面應用程式。

## 🆕 最新更新 (2025-11)

### 已完成的改進
✅ **Color Picker** - 升級到 React + TypeScript，添加 AI 智能配色功能
- 現代化響應式 UI 設計
- 10+ 種 AI 主題配色方案（日落、海洋、森林等）
- 改進的歷史記錄管理
- 更好的用戶體驗和動畫效果

✅ **新增項目**: Pomodoro Timer（進行中）
- AI 驅動的番茄工作法計時器
- 智能休息建議和專注力分析
- 任務管理和統計追蹤

### 計劃中的改進
🔲 Quick Notes - 添加 AI 筆記摘要功能
🔲 System Monitor - 添加歷史圖表和趨勢分析
🔲 File Encryptor - UI 優化和批次處理
🔲 新項目：Clipboard Manager（剪貼板管理器）
🔲 新項目：Screenshot Tool with OCR（截圖 + 文字識別）

## 📋 專案簡介

Tauri 是一個使用 Rust 建立的跨平台桌面應用框架，結合 Web 前端技術，提供比 Electron 更小的應用體積和更低的資源消耗。

### 為什麼選擇 Tauri？

- **極小體積**: 應用大小僅 ~3-15MB（vs Electron 的 ~150MB）
- **低記憶體使用**: 使用系統原生 WebView，記憶體占用極低
- **高安全性**: Rust 語言的記憶體安全特性
- **跨平台**: 支援 Windows、macOS、Linux
- **現代 Web 技術**: 支援任何前端框架（React、Vue、Svelte 等）
- **原生效能**: Rust 後端提供接近原生的執行效能
- **自動更新**: 內建更新機制

### Tauri vs Electron

| 特性 | Tauri | Electron |
|------|-------|----------|
| 應用體積 | 3-15 MB | 150+ MB |
| 記憶體使用 | 低 (~50-100MB) | 高 (~300-500MB) |
| 啟動速度 | 快 | 較慢 |
| 安全性 | 極高（Rust） | 中等 |
| 生態系統 | 成長中 | 非常成熟 |
| 學習曲線 | 中等 | 低 |
| 原生功能 | 原生 API | Node.js API |

## 🎯 適合開發的應用類型

### 輕量級工具
- 📝 筆記應用
- ✅ 待辦事項管理器
- 📊 資料視覺化工具
- ⏱️ 計時器/番茄鐘

### 系統工具
- 📁 檔案管理器
- 🔍 快速啟動器
- 📊 系統監控工具
- 🔒 密碼管理器

### 開發者工具
- 🛠️ 開發輔助工具
- 📡 API 測試工具
- 🗄️ 輕量級資料庫客戶端
- 🔧 配置管理工具

### 效能敏感應用
- 🎮 小型遊戲
- 📸 圖片處理工具
- 📈 即時資料分析
- 🎵 音訊處理工具

## 🛠️ 技術棧

### 核心技術
- **Tauri**: 2.x+ (最新版本)
- **Rust**: 1.70+ (後端語言)
- **WebView**: 系統原生（Windows WebView2, macOS WKWebView, Linux WebKitGTK）

### 前端框架選項
- **React**: 搭配 TypeScript
- **Vue 3**: 搭配 Composition API
- **Svelte**: 輕量且快速（推薦）
- **Solid.js**: 高效能響應式框架
- **Vanilla JS**: 純 JavaScript（最輕量）

### 建置工具
- **Vite**: 快速的開發伺服器（推薦）
- **Webpack**: 傳統打包工具
- **Rollup**: 輕量級打包

### Rust 生態系統
- **serde**: JSON 序列化/反序列化
- **tokio**: 非同步運行時
- **sqlx**: 資料庫客戶端
- **reqwest**: HTTP 客戶端
- **tauri-plugin-***: Tauri 官方插件

### 常用 Tauri 插件
- **tauri-plugin-store**: 鍵值儲存
- **tauri-plugin-window**: 視窗管理
- **tauri-plugin-fs**: 檔案系統
- **tauri-plugin-shell**: Shell 命令
- **tauri-plugin-http**: HTTP 請求
- **tauri-plugin-sql**: SQLite 資料庫
- **tauri-plugin-notification**: 系統通知

## 🚀 快速開始

### 先決條件

```bash
# 安裝 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 驗證安裝
rustc --version
cargo --version
```

### 平台特定依賴

**Windows:**
```bash
# 需要安裝 WebView2 Runtime（Windows 11 內建）
# Visual Studio Build Tools with C++ development tools
```

**macOS:**
```bash
# 需要安裝 Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### 建立 Tauri 專案

#### 方法 1: 使用 create-tauri-app（推薦）

```bash
# 使用 npm
npm create tauri-app@latest

# 使用 yarn
yarn create tauri-app

# 使用 pnpm
pnpm create tauri-app
```

選項範例：
```
✔ Project name · my-tauri-app
✔ Choose your package manager · pnpm
✔ Choose your UI template · React + TypeScript
✔ Choose your UI flavor · TypeScript
```

#### 方法 2: 手動添加到現有專案

```bash
# 在現有的前端專案中
npm install --save-dev @tauri-apps/cli
npm install @tauri-apps/api

# 初始化 Tauri
npm run tauri init
```

### 啟動開發模式

```bash
cd my-tauri-app
npm install
npm run tauri dev
```

### 專案結構

```
my-tauri-app/
├── src/                    # 前端程式碼
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── src-tauri/              # Rust 後端
│   ├── src/
│   │   └── main.rs        # Rust 主程式
│   ├── icons/             # 應用圖示
│   ├── Cargo.toml         # Rust 依賴配置
│   └── tauri.conf.json    # Tauri 配置
├── package.json
└── vite.config.ts
```

## 💡 核心概念

### 1. Tauri 配置 (tauri.conf.json)

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "My Tauri App",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": false,
        "readFile": true,
        "writeFile": true
      },
      "dialog": {
        "all": false,
        "open": true,
        "save": true
      }
    },
    "windows": [
      {
        "title": "My Tauri App",
        "width": 1000,
        "height": 700,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'"
    }
  }
}
```

### 2. Rust 後端 (main.rs)

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 定義 Tauri 命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn calculate(a: i32, b: i32, operation: String) -> Result<i32, String> {
    match operation.as_str() {
        "add" => Ok(a + b),
        "subtract" => Ok(a - b),
        "multiply" => Ok(a * b),
        "divide" => {
            if b == 0 {
                Err("Cannot divide by zero".to_string())
            } else {
                Ok(a / b)
            }
        }
        _ => Err("Invalid operation".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_file, calculate])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. 前端呼叫 Rust 命令

```typescript
// React/TypeScript 範例
import { invoke } from '@tauri-apps/api/tauri';
import { useState } from 'react';

function App() {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');

  async function handleGreet() {
    // 呼叫 Rust 函數
    const result = await invoke<string>('greet', { name });
    setGreeting(result);
  }

  async function handleCalculate() {
    try {
      const result = await invoke<number>('calculate', {
        a: 10,
        b: 5,
        operation: 'add'
      });
      console.log('Result:', result); // 15
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={handleGreet}>Greet</button>
      <p>{greeting}</p>
    </div>
  );
}
```

### 4. 檔案系統操作

```typescript
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

// 開啟檔案對話框
async function openFile() {
  const selected = await open({
    multiple: false,
    filters: [{
      name: 'Text',
      extensions: ['txt', 'md']
    }]
  });

  if (selected) {
    const content = await readTextFile(selected as string);
    console.log(content);
  }
}

// 儲存檔案
async function saveFile(content: string) {
  const path = await save({
    filters: [{
      name: 'Text',
      extensions: ['txt']
    }]
  });

  if (path) {
    await writeTextFile(path, content);
  }
}
```

### 5. 視窗管理

```typescript
import { appWindow } from '@tauri-apps/api/window';

// 最小化視窗
await appWindow.minimize();

// 最大化視窗
await appWindow.maximize();

// 關閉視窗
await appWindow.close();

// 設定視窗標題
await appWindow.setTitle('新標題');

// 監聽視窗事件
const unlisten = await appWindow.onCloseRequested((event) => {
  // 阻止關閉
  event.preventDefault();

  // 顯示確認對話框
  if (confirm('確定要關閉嗎？')) {
    appWindow.close();
  }
});
```

## 🎨 實作範例

### 範例 1: 簡單的計算機應用

```rust
// src-tauri/src/main.rs
#[tauri::command]
fn calculate(expression: String) -> Result<f64, String> {
    // 使用 meval 或其他運算式解析庫
    meval::eval_str(&expression)
        .map_err(|e| e.to_string())
}
```

```tsx
// src/App.tsx
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculate = async () => {
    try {
      const res = await invoke<number>('calculate', { expression });
      setResult(res);
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div>
      <input
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        placeholder="輸入運算式，例如：2 + 2"
      />
      <button onClick={calculate}>計算</button>
      {result !== null && <p>結果: {result}</p>}
    </div>
  );
}
```

### 範例 2: 系統資訊顯示

```rust
// src-tauri/src/main.rs
use sysinfo::{System, SystemExt};

#[derive(serde::Serialize)]
struct SystemInfo {
    os: String,
    kernel_version: String,
    total_memory: u64,
    used_memory: u64,
    cpu_count: usize,
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemInfo {
        os: System::name().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        cpu_count: sys.cpus().len(),
    }
}
```

```tsx
// src/App.tsx
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface SystemInfo {
  os: string;
  kernel_version: string;
  total_memory: number;
  used_memory: number;
  cpu_count: number;
}

function SystemMonitor() {
  const [info, setInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const sysInfo = await invoke<SystemInfo>('get_system_info');
      setInfo(sysInfo);
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!info) return <div>載入中...</div>;

  return (
    <div>
      <h2>系統資訊</h2>
      <p>作業系統: {info.os}</p>
      <p>核心版本: {info.kernel_version}</p>
      <p>CPU 核心數: {info.cpu_count}</p>
      <p>記憶體使用: {info.used_memory / 1024 / 1024} MB / {info.total_memory / 1024 / 1024} MB</p>
    </div>
  );
}
```

### 範例 3: 資料庫整合 (SQLite)

```rust
// Cargo.toml
[dependencies]
tauri = "2.0"
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio"] }
tokio = { version = "1", features = ["full"] }

// src-tauri/src/main.rs
use sqlx::{SqlitePool, Row};
use tauri::State;

struct AppState {
    db: SqlitePool,
}

#[tauri::command]
async fn create_todo(
    text: String,
    state: State<'_, AppState>
) -> Result<i64, String> {
    let result = sqlx::query("INSERT INTO todos (text, completed) VALUES (?, false)")
        .bind(text)
        .execute(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(result.last_insert_rowid())
}

#[tauri::command]
async fn get_todos(state: State<'_, AppState>) -> Result<Vec<Todo>, String> {
    let todos = sqlx::query_as::<_, Todo>("SELECT * FROM todos")
        .fetch_all(&state.db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(todos)
}

#[tokio::main]
async fn main() {
    let db = SqlitePool::connect("sqlite:todos.db")
        .await
        .expect("Failed to connect to database");

    // 建立表格
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL
        )"
    )
    .execute(&db)
    .await
    .expect("Failed to create table");

    tauri::Builder::default()
        .manage(AppState { db })
        .invoke_handler(tauri::generate_handler![create_todo, get_todos])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 範例 4: HTTP 請求

```rust
// Cargo.toml
[dependencies]
reqwest = { version = "0.11", features = ["json"] }

// src-tauri/src/main.rs
#[derive(serde::Serialize, serde::Deserialize)]
struct ApiResponse {
    data: String,
}

#[tauri::command]
async fn fetch_data(url: String) -> Result<ApiResponse, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .json::<ApiResponse>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response)
}
```

## 🔌 使用 Tauri 插件

### 安裝插件

```bash
# Store 插件（持久化儲存）
npm install @tauri-apps/plugin-store
cargo add tauri-plugin-store

# SQL 插件
npm install @tauri-apps/plugin-sql
cargo add tauri-plugin-sql
```

### 註冊插件

```rust
// src-tauri/src/main.rs
use tauri_plugin_store::StoreBuilder;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 使用 Store 插件

```typescript
import { Store } from '@tauri-apps/plugin-store';

const store = new Store('.settings.dat');

// 設定值
await store.set('key', 'value');

// 取得值
const value = await store.get<string>('key');

// 儲存到磁碟
await store.save();
```

## 📦 打包與發布

### 建置應用

```bash
# 建置所有平台（需要在對應平台上執行）
npm run tauri build

# 建置特定平台
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows
npm run tauri build -- --target x86_64-apple-darwin      # macOS Intel
npm run tauri build -- --target aarch64-apple-darwin     # macOS Apple Silicon
npm run tauri build -- --target x86_64-unknown-linux-gnu # Linux
```

### Tauri 配置（打包）

```json
// tauri.conf.json
{
  "tauri": {
    "bundle": {
      "identifier": "com.example.myapp",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "active": true,
      "targets": ["msi", "dmg", "deb", "appimage"],
      "resources": ["resources/*"],
      "externalBin": [],
      "copyright": "",
      "category": "DeveloperTool",
      "shortDescription": "",
      "longDescription": "",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      },
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.13",
        "signingIdentity": null
      },
      "linux": {
        "deb": {
          "depends": []
        }
      }
    }
  }
}
```

### 自動更新

```rust
// src-tauri/src/main.rs
use tauri_plugin_updater::UpdaterExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Ok(update) = handle.updater().check().await {
                    if update.is_available() {
                        update.download_and_install().await.ok();
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 🔒 安全性最佳實踐

### 1. 使用 Allowlist

```json
// tauri.conf.json
{
  "tauri": {
    "allowlist": {
      "all": false,  // 預設關閉所有 API
      "fs": {
        "scope": ["$APPDATA/myapp/*"],  // 限制檔案系統存取範圍
        "readFile": true,
        "writeFile": true
      }
    }
  }
}
```

### 2. CSP (Content Security Policy)

```json
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'"
    }
  }
}
```

### 3. 驗證輸入

```rust
#[tauri::command]
fn process_data(input: String) -> Result<String, String> {
    // 驗證輸入
    if input.len() > 1000 {
        return Err("Input too long".to_string());
    }

    // 處理資料
    Ok(input.to_uppercase())
}
```

## 🎯 效能優化

### 1. 減小應用體積

```toml
# Cargo.toml
[profile.release]
opt-level = "z"     # 優化體積
lto = true          # Link Time Optimization
codegen-units = 1   # 單一 codegen unit
panic = "abort"     # 移除 panic unwinding
strip = true        # 移除符號資訊
```

### 2. 非同步操作

```rust
#[tauri::command]
async fn long_running_task() -> Result<String, String> {
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    Ok("完成".to_string())
}
```

### 3. 事件系統優化

```typescript
// 避免頻繁呼叫 invoke，使用事件系統
import { listen } from '@tauri-apps/api/event';

// 後端發送事件
emit('progress', { percent: 50 });

// 前端監聽事件
const unlisten = await listen('progress', (event) => {
  console.log('Progress:', event.payload);
});
```

## 🤖 AI 開發建議

### 使用 AI 工具開發 Tauri 應用

1. **Rust 程式碼生成**
   - 使用 AI 協助撰寫 Rust 函數
   - AI 協助處理 Rust 的所有權和借用問題
   - 快速生成型別定義

2. **前端整合**
   - AI 協助建立型別安全的 API 呼叫
   - 自動生成 TypeScript 型別定義
   - UI 元件快速開發

3. **錯誤處理**
   - AI 協助實作完善的錯誤處理
   - Rust Result 型別的正確使用
   - 前端錯誤提示優化

4. **效能優化**
   - AI 分析 Rust 程式碼效能
   - 建議更高效的演算法
   - 記憶體使用優化

### AI 輔助學習 Rust

```
問 AI: "如何在 Rust 中處理 JSON？"
問 AI: "Tauri 中如何讀取檔案？"
問 AI: "解釋 Rust 的 Result 型別"
問 AI: "如何在 Tauri 中使用資料庫？"
```

## 🧪 測試

### Rust 單元測試

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate() {
        let result = calculate(5, 3, "add".to_string());
        assert_eq!(result.unwrap(), 8);
    }
}
```

### 前端測試

```typescript
// Vitest
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<App />);
    expect(getByText('Hello')).toBeDefined();
  });
});
```

## 📚 學習資源

### 官方文檔
- [Tauri 官方文檔](https://tauri.app)
- [Tauri API 參考](https://tauri.app/v1/api/js/)
- [Rust Book](https://doc.rust-lang.org/book/)

### 社群資源
- [Tauri Discord](https://discord.com/invite/tauri)
- [Awesome Tauri](https://github.com/tauri-apps/awesome-tauri)
- [Tauri Examples](https://github.com/tauri-apps/tauri/tree/dev/examples)

### 教學影片
- Tauri 快速入門教學
- Rust 基礎教學
- Web + Rust 整合實作

## 🔧 常見問題

### Q: 我需要學 Rust 嗎？
A: 基礎使用不需要深入的 Rust 知識，但了解基本語法會很有幫助。可以使用 AI 工具協助撰寫 Rust 程式碼。

### Q: Tauri 比 Electron 快多少？
A: 啟動速度快 2-5 倍，記憶體使用減少 50-70%，應用體積減小 90%+。

### Q: 可以存取所有 Node.js 套件嗎？
A: 不行，Tauri 使用 Rust 而非 Node.js。但可以使用 Rust crates，或在前端使用 WebAssembly。

### Q: 如何除錯 Rust 程式碼？
A: 使用 `dbg!()` 巨集或 VS Code 的 Rust Analyzer 擴充功能。

## 📊 開發路線圖建議

### 階段 1: 環境設定（1 天）
- [ ] 安裝 Rust 和相關工具
- [ ] 建立 Tauri 專案
- [ ] 配置開發環境
- [ ] 執行 Hello World

### 階段 2: 學習基礎（3-5 天）
- [ ] Tauri 命令系統
- [ ] 前端與 Rust 通訊
- [ ] 檔案系統操作
- [ ] 視窗管理

### 階段 3: 核心功能（1-2 週）
- [ ] 實作主要功能
- [ ] 資料持久化
- [ ] UI 介面開發
- [ ] 錯誤處理

### 階段 4: 進階功能（1-2 週）
- [ ] 資料庫整合
- [ ] HTTP 請求
- [ ] 系統托盤
- [ ] 自訂選單

### 階段 5: 優化與打包（3-5 天）
- [ ] 效能優化
- [ ] 安全性加固
- [ ] 跨平台測試
- [ ] 建置與發布

## ⚠️ 注意事項

1. **學習曲線**: Rust 語法對初學者有一定難度，建議使用 AI 輔助
2. **生態系統**: 相比 Electron 較新，某些功能可能需要自己實作
3. **除錯**: Rust 編譯錯誤訊息需要時間適應
4. **跨平台**: 需要在各平台上分別建置和測試
5. **WebView 版本**: 依賴系統 WebView，舊系統可能不支援

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: Cursor、GitHub Copilot、Claude Code
**最後更新**: 2025-11-16
**狀態**: 📝 文檔完成，等待專案實作
