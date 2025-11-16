# 瀏覽器擴充功能 Browser Extensions
🤖 **AI-Driven | AI-Native** 🚀

這個資料夾包含各種使用 **AI 輔助開發**的瀏覽器擴充功能專案。利用 AI 快速建立跨瀏覽器擴充功能和實用工具。

## 📁 子專案

### ✅ [productivity-tools](./productivity-tools) - 生產力工具
AI 驅動的智能待辦事項管理瀏覽器擴充功能

**特色功能：**
- 任務管理和優先級設定
- AI 輔助任務分解
- 雲端同步和提醒
- 生產力分析統計

**技術：** React, TypeScript, Zustand, Firebase

### 🛠️ [dev-tools](./dev-tools) - 開發者工具
專業開發者瀏覽器工具集

**特色功能：**
- API 測試工具
- JSON/XML 格式化
- 顏色選擇器
- 正規表示式測試器
- Base64 編碼/解碼
- 時間工具

**技術：** React, TypeScript, Monaco Editor, Axios

### 🎨 [content-enhancer](./content-enhancer) - 內容增強工具
智能網頁體驗增強工具

**特色功能：**
- 智能暗色模式
- 閱讀模式
- 廣告和干擾過濾
- 字體和排版自訂
- 自訂 CSS 注入
- 翻譯功能

**技術：** React, TypeScript, Readability.js, Framer Motion

### 🔒 [privacy-guardian](./privacy-guardian) - 隱私守護者
全方位隱私保護和安全工具

**特色功能：**
- 密碼管理器（AES-256 加密）
- Cookie 管理和清理
- 追蹤器和指紋識別防護
- HTTPS 強制升級
- 資料洩漏監控
- 隱私資料清理

**技術：** React, TypeScript, Web Crypto API, zxcvbn

### 📱 [social-media-tools](./social-media-tools) - 社交媒體工具
全能社交媒體增強和管理工具

**特色功能：**
- 多媒體下載器（Instagram, Twitter, Facebook, YouTube）
- 排程發文
- 分析和統計
- 批次操作
- 介面增強
- AI 內容生成

**技術：** React, TypeScript, Chart.js, Axios

## 💻 技術棧

### 前端框架
- **React 18** - 主要 UI 框架
- **TypeScript** - 型別安全
- **Tailwind CSS** - 樣式框架
- **Zustand** - 狀態管理

### 瀏覽器 API
- **Manifest V3** - 最新標準
- **Chrome Storage API** - 資料儲存
- **Chrome Scripting API** - 腳本注入
- **Chrome Alarms API** - 定時任務
- **WebExtension Polyfill** - 跨瀏覽器相容

### 建置工具
- **Vite** - 快速建置工具
- **CRXJS** - Chrome 擴充功能 Vite 插件
- **ESLint + Prettier** - 程式碼品質

## 🚀 快速開始

### 通用開發流程

```bash
# 1. 進入專案目錄
cd browser-extensions/[project-name]

# 2. 安裝依賴
npm install

# 3. 啟動開發模式
npm run dev

# 4. 載入到 Chrome
# - 打開 chrome://extensions/
# - 開啟「開發人員模式」
# - 點擊「載入未封裝項目」
# - 選擇 dist/ 資料夾

# 5. 建置生產版本
npm run build
```

## 📊 專案狀態

| 專案 | 狀態 | 主要功能 | 技術棧 |
|------|------|---------|--------|
| productivity-tools | 🚧 開發中 | 待辦事項管理 | React, Zustand, Firebase |
| dev-tools | 🚧 開發中 | API 測試、JSON 格式化 | React, Monaco Editor |
| content-enhancer | 🚧 開發中 | 暗色模式、閱讀模式 | React, Readability.js |
| privacy-guardian | 🚧 開發中 | 密碼管理、追蹤防護 | React, Web Crypto API |
| social-media-tools | 🚧 開發中 | 媒體下載、排程發文 | React, Chart.js |

## 🤖 AI 開發建議

### 使用 AI 工具開發瀏覽器擴充功能
- 使用 **Cursor** 或 **GitHub Copilot** 快速生成擴充功能結構
- AI 協助設計 manifest.json 和權限配置
- 利用 AI 生成 content scripts 和 background scripts
- 使用 AI 建立 popup 和 options UI
- AI 協助處理跨瀏覽器相容性問題
- 利用 AI 實作儲存和訊息傳遞邏輯

### AI 輔助擴充功能開發工作流程
1. AI 協助規劃擴充功能架構和權限需求
2. 使用 AI 生成專案結構和 manifest 檔案
3. AI 協助實作核心功能和腳本注入
4. 利用 AI 建立使用者介面和設定頁面
5. AI 協助測試和處理不同瀏覽器的差異

### 推薦 AI 工具
- **Claude Code** - 程式碼生成和重構
- **GitHub Copilot** - 即時程式碼補全
- **Cursor** - AI 輔助開發環境
- **ChatGPT/Claude** - 架構設計和問題解決
- **v0.dev** - UI 元件生成

## 💡 最佳實踐

### 開發建議
- ✅ 使用 TypeScript 提升程式碼品質
- ✅ 遵循 Manifest V3 標準
- ✅ 最小化權限請求
- ✅ 優化效能和記憶體使用
- ✅ 提供完整的錯誤處理

### 安全性
- ✅ 驗證所有使用者輸入
- ✅ 使用 Content Security Policy
- ✅ 避免注入攻擊（XSS）
- ✅ 安全儲存敏感資料
- ✅ 定期更新依賴套件

### 使用者體驗
- ✅ 簡潔直觀的介面
- ✅ 快速載入時間
- ✅ 清晰的錯誤訊息
- ✅ 鍵盤快捷鍵支援
- ✅ 深色/淺色主題

## 🤝 貢獻指南

歡迎貢獻新的瀏覽器擴充功能專案！

### 如何貢獻
1. Fork 這個儲存庫
2. 創建你的功能分支
3. 使用 AI 工具輔助開發
4. 提交你的變更
5. 發起 Pull Request

### 專案要求
- 必須使用 AI 工具輔助開發
- 提供完整的 README 和文檔
- 遵循 Manifest V3 標準
- 包含 package.json 和 manifest.json
- 開源授權（MIT）

## 📚 學習資源

### 官方文檔
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

### 教學資源
- [Chrome Extension Development Tutorial](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [React + Vite Chrome Extension](https://github.com/crxjs/chrome-extension-tools)

## 📄 授權

各專案有各自的授權，預設為 MIT License。

---

**使用 AI 打造更強大的瀏覽器擴充功能** 🚀

最後更新: 2025-11-16
