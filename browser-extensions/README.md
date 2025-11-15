# 瀏覽器擴充功能 Browser Extensions

這個資料夾包含各種瀏覽器擴充功能專案。

## 子資料夾說明

### chrome
- Chrome 專屬擴充功能
- 使用 Chrome Extension API

### firefox
- Firefox 專屬擴充功能
- 使用 WebExtensions API

### cross-browser (跨瀏覽器)
- 支援多個瀏覽器的擴充功能
- Chrome, Firefox, Edge, Safari
- 使用標準 WebExtensions API

## 擴充功能類型建議
- 生產力工具
  - 待辦事項管理
  - 筆記工具
  - 時間追蹤

- 開發者工具
  - 程式碼格式化
  - API 測試
  - 顏色選擇器

- 內容增強
  - 廣告攔截
  - 暗色模式
  - 閱讀模式
  - 翻譯工具

- 隱私與安全
  - 密碼管理
  - Cookie 管理
  - VPN 工具

- 社交媒體
  - 下載工具
  - 排程發文
  - 分析工具

## 技術棧
- Manifest V3 (最新標準)
- JavaScript/TypeScript
- React/Vue (用於 popup 和 options 頁面)
- Webpack/Vite (打包工具)
- Chrome Storage API
- WebExtension Polyfill
