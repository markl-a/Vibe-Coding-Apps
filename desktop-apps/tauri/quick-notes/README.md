# 快速筆記應用 | Quick Notes

> 🦀 **Tauri + React** | 輕量級跨平台筆記桌面應用

一個使用 Tauri 框架開發的快速筆記應用，支援 Markdown 語法和本地檔案儲存。

## ✨ 功能特點

- 📝 **Markdown 支援**: 完整支援 Markdown 語法
- 💾 **本地儲存**: 筆記自動儲存到本地檔案系統
- 🔍 **即時搜尋**: 快速搜尋筆記標題和內容
- 🎨 **簡潔介面**: 專注於寫作的極簡設計
- ⚡ **快速啟動**: Tauri 框架保證秒開應用
- 🖥️ **跨平台**: Windows、macOS、Linux 全平台支援
- 🌙 **深色模式**: 支援淺色/深色主題切換

## 🛠️ 技術棧

- **前端**: React 18 + TypeScript
- **後端**: Rust + Tauri 2.0
- **儲存**: Tauri Store Plugin（鍵值儲存）+ 本地檔案系統
- **Markdown**: 原生 textarea（可擴展為 Markdown 編輯器）
- **UI**: 原生 CSS

## 📋 功能說明

### 核心功能

1. **筆記管理**
   - 新增筆記
   - 編輯筆記
   - 刪除筆記
   - 筆記列表顯示

2. **筆記內容**
   - 標題和內容分離
   - 自動儲存（編輯後自動保存）
   - 顯示最後修改時間

3. **搜尋功能**
   - 即時搜尋筆記標題
   - 支援內容搜尋（可擴展）

4. **資料持久化**
   - 使用 Tauri Store Plugin 儲存筆記列表
   - 自動載入上次的筆記

## 🚀 快速開始

### 先決條件

請確保已安裝：
- Node.js 18+ 和 npm/yarn/pnpm
- Rust 1.70+
- 平台特定依賴（見主 README）

### 安裝依賴

```bash
# 安裝前端依賴
npm install

# Rust 依賴會在建置時自動安裝
```

### 開發模式

```bash
npm run tauri dev
```

### 建置應用

```bash
npm run tauri build
```

## 📁 專案結構

```
quick-notes/
├── src/                      # React 前端
│   ├── App.tsx              # 主應用元件
│   ├── main.tsx             # React 入口
│   ├── styles.css           # 樣式
│   └── types.ts             # TypeScript 型別定義
├── src-tauri/               # Rust 後端
│   ├── src/
│   │   └── main.rs         # Tauri 主程式
│   ├── Cargo.toml          # Rust 依賴配置
│   └── tauri.conf.json     # Tauri 配置
├── index.html
├── package.json
└── README.md
```

## 💻 核心功能說明

### Rust 後端（src-tauri/src/main.rs）

提供以下 Tauri 命令：

```rust
#[tauri::command]
fn save_note(id: String, title: String, content: String) -> Result<(), String>
```
- 儲存筆記到本地檔案系統

```rust
#[tauri::command]
fn load_note(id: String) -> Result<Note, String>
```
- 從本地檔案系統載入筆記

```rust
#[tauri::command]
fn delete_note(id: String) -> Result<(), String>
```
- 刪除筆記檔案

```rust
#[tauri::command]
fn get_notes_list() -> Result<Vec<NoteMetadata>, String>
```
- 獲取所有筆記的元資料列表

### React 前端（src/App.tsx）

- **筆記列表**: 左側顯示所有筆記
- **編輯區域**: 右側顯示當前筆記內容
- **搜尋列**: 頂部搜尋筆記
- **操作按鈕**: 新增、儲存、刪除

## 🎨 資料結構

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface NoteMetadata {
  id: string;
  title: string;
  updated_at: number;
}
```

## 🎨 介面預覽

```
┌────────────────────────────────────────────────────────┐
│  🗒️  Quick Notes                        [+新增] [搜尋]  │
├──────────────┬─────────────────────────────────────────┤
│              │                                         │
│  📝 筆記一    │  標題: 我的第一篇筆記                      │
│  08:30       │  ────────────────────────────────────   │
│              │                                         │
│  📝 筆記二    │  內容區域...                             │
│  昨天         │                                         │
│              │                                         │
│  📝 筆記三    │                                         │
│  2天前        │                                         │
│              │                                         │
│              │  [儲存] [刪除]                           │
└──────────────┴─────────────────────────────────────────┘
```

## ⚙️ 配置選項

### 儲存位置

筆記預設儲存在應用資料目錄：
- **Windows**: `%APPDATA%/quick-notes/notes/`
- **macOS**: `~/Library/Application Support/quick-notes/notes/`
- **Linux**: `~/.local/share/quick-notes/notes/`

### Tauri 配置

可在 `tauri.conf.json` 中修改：
- 視窗大小：預設 1000x700
- 應用標題
- 允許的 API 權限

## 🔐 安全性

- 使用 Tauri 的 allowlist 限制檔案系統存取範圍
- 筆記檔案儲存在受保護的應用資料目錄
- 不連接外部網路（純本地應用）

## 📦 依賴說明

### Rust 依賴（Cargo.toml）
- `tauri`: Tauri 核心框架
- `serde`: JSON 序列化
- `serde_json`: JSON 處理
- `chrono`: 時間處理
- `uuid`: 生成唯一 ID

### 前端依賴（package.json）
- `react`: UI 框架
- `react-dom`: React DOM 渲染
- `@tauri-apps/api`: Tauri 前端 API
- `vite`: 開發伺服器和建置工具

## 🚧 未來改進方向

- [ ] Markdown 即時預覽
- [ ] 匯出筆記為 PDF/HTML
- [ ] 標籤系統
- [ ] 筆記分類/資料夾
- [ ] 全文搜尋
- [ ] 筆記同步（雲端）
- [ ] 附件支援（圖片、檔案）
- [ ] 快捷鍵支援
- [ ] 筆記範本

## 🐛 已知問題

- 大型筆記（>10MB）可能載入較慢
- 目前不支援圖片貼上

## 📝 開發注意事項

1. **檔案命名**: 使用 UUID 作為筆記 ID，避免檔名衝突
2. **自動儲存**: 實作 debounce 避免頻繁寫入
3. **錯誤處理**: 檔案讀寫需要完善的錯誤處理
4. **效能優化**: 大量筆記時考慮分頁或虛擬列表

## 📄 授權

MIT License

---

**開發時間**: 約 3-4 小時
**難度等級**: ⭐⭐⭐ (中等)
**適合**: Tauri 初學者、想學習檔案系統操作的開發者
