# 📋 Clipboard Manager - 智能剪貼簿管理工具

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Electron 開發的跨平台剪貼簿管理工具，自動記錄複製歷史，支援快速搜尋和收藏功能。

## ✨ 主要功能

- 📝 自動記錄剪貼簿歷史
- 🔍 即時搜尋功能
- ⭐ 收藏重要內容
- ⌨️ 全域快捷鍵支援 (Ctrl+Shift+V)
- 🗂️ 分類管理（全部/收藏/文字）
- 💾 持久化儲存
- 🎯 系統托盤整合
- 🌈 現代化 UI 設計

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm start
```

### 打包應用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 🎯 使用方法

1. 啟動應用後，它會自動在背景監控剪貼簿
2. 使用 `Ctrl+Shift+V` (Windows/Linux) 或 `Cmd+Shift+V` (macOS) 快速顯示視窗
3. 點擊任何歷史記錄項目即可複製到剪貼簿
4. 點擊星號圖示可收藏重要項目
5. 使用搜尋框快速找到需要的內容

## ⚙️ 設定選項

- **保存歷史記錄數量**: 設定最多保存多少條記錄（預設 100）
- **檢查間隔**: 設定剪貼簿檢查頻率（預設 1000ms）
- **全域快捷鍵**: 顯示/隱藏視窗的快捷鍵

## 🛠️ 技術棧

- Electron 28
- electron-store (資料持久化)
- 純 JavaScript (無框架依賴)
- 現代 CSS (Flexbox, Grid)

## 📦 依賴項

```json
{
  "electron": "^28.0.0",
  "electron-store": "^8.1.0"
}
```

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: GitHub Copilot, Cursor
**狀態**: ✅ 完整可用專案
