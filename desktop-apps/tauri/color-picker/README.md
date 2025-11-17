# 🎨 Color Picker - 顏色選取工具

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Tauri + Rust 開發的輕量級顏色選取工具，支援多種配色方案生成和顏色格式轉換。

## ✨ 主要功能

- 🎨 直觀的顏色選取器
- 🔄 多種顏色格式轉換 (HEX, RGB, HSL)
- 🎯 智能配色方案生成
  - 互補色
  - 類似色
  - 三角色
  - 單色系
- 📋 一鍵複製顏色值
- 📚 顏色歷史記錄
- 💾 本地儲存
- 🚀 輕量快速（~3MB）

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run tauri:dev
```

### 打包應用

```bash
npm run tauri:build
```

## 🎯 使用方法

1. 點擊顏色方塊選擇顏色
2. 自動生成多種配色方案
3. 點擊複製按鈕複製顏色值
4. 點擊調色板中的顏色快速切換
5. 查看歷史記錄重用之前的顏色

## 🛠️ 技術棧

### 前端
- Vite
- Vanilla JavaScript
- 現代 CSS

### 後端
- Rust
- Tauri 2.0
- 顏色轉換算法

## 📦 依賴項

```json
{
  "@tauri-apps/api": "^2.0.0",
  "@tauri-apps/cli": "^2.0.0",
  "vite": "^5.0.8"
}
```

### Rust 依賴

- tauri 2.0
- tauri-plugin-clipboard-manager
- serde & serde_json

## 🎨 配色方案說明

- **互補色**: 色輪上相對的顏色，產生強烈對比
- **類似色**: 色輪上相鄰的顏色，和諧柔和
- **三角色**: 色輪上等距分布的三個顏色
- **單色系**: 同一色相的不同明度

## 💡 特色亮點

### 輕量級
- 應用體積僅約 3MB
- 記憶體使用低於 50MB
- 啟動速度快

### 跨平台
- Windows
- macOS
- Linux

### 安全可靠
- Rust 語言保證記憶體安全
- 無需網路連接
- 數據本地存儲

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: Cursor, GitHub Copilot
**狀態**: ✅ 完整可用專案
