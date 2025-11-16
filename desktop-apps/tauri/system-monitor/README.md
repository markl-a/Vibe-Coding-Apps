# 系統監控工具 | System Monitor

> 🦀 **Tauri + React** | 輕量級跨平台系統監控桌面應用

一個使用 Tauri 框架開發的系統監控工具，即時顯示 CPU、記憶體、磁碟使用情況。

## ✨ 功能特點

- 📊 **即時監控**: CPU、記憶體、磁碟使用率即時更新
- 🎨 **視覺化展示**: 使用進度條和圖表直觀顯示系統資源
- 💾 **低資源消耗**: Tauri 框架保證應用本身佔用極少資源
- 🖥️ **跨平台支援**: Windows、macOS、Linux 全平台支援
- ⚡ **原生效能**: Rust 後端提供高效的系統資訊讀取

## 🛠️ 技術棧

- **前端**: React 18 + TypeScript
- **後端**: Rust + Tauri 2.0
- **系統資訊**: sysinfo crate
- **UI**: 原生 CSS（無外部 UI 框架）

## 📋 系統資訊

應用會顯示以下資訊：

### 系統基本資訊
- 作業系統名稱與版本
- 系統核心版本
- 主機名稱
- CPU 核心數

### 即時資源監控
- **CPU 使用率**: 全局 CPU 使用率百分比
- **記憶體使用**: 已用 / 總容量（MB、GB）
- **磁碟使用**: 各磁碟分區使用情況

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

這會啟動：
1. Vite 開發伺服器（前端熱重載）
2. Tauri 桌面應用視窗

### 建置應用

```bash
# 建置生產版本
npm run tauri build
```

建置產物會在 `src-tauri/target/release/bundle/` 目錄下。

## 📁 專案結構

```
system-monitor/
├── src/                      # React 前端
│   ├── App.tsx              # 主應用元件
│   ├── main.tsx             # React 入口
│   ├── styles.css           # 樣式
│   └── components/          # （未來可擴展）
├── src-tauri/               # Rust 後端
│   ├── src/
│   │   └── main.rs         # Tauri 主程式
│   ├── Cargo.toml          # Rust 依賴配置
│   └── tauri.conf.json     # Tauri 配置
├── index.html               # HTML 模板
├── package.json
└── README.md
```

## 💻 核心功能說明

### Rust 後端（src-tauri/src/main.rs）

提供以下 Tauri 命令：

```rust
#[tauri::command]
fn get_system_info() -> SystemInfo
```
- 獲取系統基本資訊（作業系統、核心版本、CPU 核心數等）

```rust
#[tauri::command]
fn get_cpu_usage() -> f32
```
- 獲取當前全局 CPU 使用率

```rust
#[tauri::command]
fn get_memory_info() -> MemoryInfo
```
- 獲取記憶體使用情況（總容量、已用容量）

```rust
#[tauri::command]
fn get_disk_info() -> Vec<DiskInfo>
```
- 獲取所有磁碟分區資訊

### React 前端（src/App.tsx）

- 使用 `useState` 和 `useEffect` 管理狀態
- 每秒呼叫一次 Rust 後端更新資料
- 使用 CSS 進度條視覺化展示資源使用率

## 🎨 介面預覽

```
┌─────────────────────────────────────┐
│   🖥️  系統監控工具                    │
├─────────────────────────────────────┤
│ 系統資訊                              │
│ • 作業系統: Windows 11                │
│ • CPU 核心: 8                         │
│ • 記憶體: 16 GB                       │
├─────────────────────────────────────┤
│ CPU 使用率                            │
│ ▓▓▓▓▓▓▓░░░ 65%                       │
├─────────────────────────────────────┤
│ 記憶體使用                            │
│ ▓▓▓▓▓░░░░░ 8.2 / 16 GB (51%)        │
├─────────────────────────────────────┤
│ 磁碟使用                              │
│ C: ▓▓▓▓▓▓▓▓░░ 450 / 512 GB (88%)    │
└─────────────────────────────────────┘
```

## ⚙️ 配置選項

可在 `tauri.conf.json` 中修改：

- **視窗大小**: 預設 800x600
- **更新間隔**: 前端控制，預設 1 秒
- **允許的 API**: 已配置系統資訊讀取權限

## 🔐 安全性

- 使用 Tauri 的 allowlist 機制限制 API 存取
- 後端僅讀取系統資訊，不執行任何寫入操作
- 前端透過 Tauri IPC 安全通訊

## 📦 依賴說明

### Rust 依賴（Cargo.toml）
- `tauri`: Tauri 核心框架
- `serde`: JSON 序列化
- `serde_json`: JSON 處理
- `sysinfo`: 系統資訊讀取庫

### 前端依賴（package.json）
- `react`: UI 框架
- `react-dom`: React DOM 渲染
- `@tauri-apps/api`: Tauri 前端 API
- `vite`: 開發伺服器和建置工具

## 🚧 未來改進方向

- [ ] 添加 CPU 使用率歷史圖表
- [ ] 支援進程列表與管理
- [ ] 網路流量監控
- [ ] 系統溫度監控（需硬體感測器支援）
- [ ] 自訂刷新間隔
- [ ] 深色模式切換
- [ ] 系統托盤最小化

## 🐛 已知問題

- Linux 上某些系統資訊可能需要額外權限
- 磁碟資訊在某些掛載點可能無法讀取

## 📝 開發注意事項

1. **sysinfo 初始化**: 首次呼叫需要時間，建議在應用啟動時初始化
2. **資源更新頻率**: 避免過於頻繁呼叫，建議至少 500ms 間隔
3. **跨平台測試**: 不同平台的系統資訊格式可能略有差異

## 📄 授權

MIT License

---

**開發時間**: 約 2-3 小時
**難度等級**: ⭐⭐⭐ (中等)
**適合**: Tauri 初學者、想學習系統程式設計的開發者
