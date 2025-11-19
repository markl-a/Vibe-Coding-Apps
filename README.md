# Vibe-Coding-Apps

🤖 **AI 驅動 | AI 原生** 🚀
✨ **生產級基礎設施 | Production-Ready Infrastructure** ✨

使用 AI 輔助開發寫出來的 App、網頁、桌面應用甚至是遊戲

> 💡 這個儲存庫中的所有專案都是 **AI 驅動 (AI-Driven)** 和 **AI 原生 (AI-Native)** 的，充分利用 AI 編程助手和工具來加速開發流程。

## 🎉 最新更新

### 基礎設施現代化 (2025-11-19)

我們完成了全面的基礎設施升級，為長期發展打下堅實基礎：

- ✅ **Monorepo 架構** - 使用 Turborepo 統一管理所有項目
- ✅ **CI/CD 管道** - 完整的 GitHub Actions 工作流程
- ✅ **代碼質量工具** - ESLint, Prettier, Husky 完整配置
- ✅ **安全掃描** - CodeQL 和 Dependabot 自動化安全檢查
- ✅ **測試基礎設施** - Jest, Vitest, Playwright, Pytest 全面支持
- ✅ **共享組件庫** - `@vibe/shared-utils` 跨項目復用
- ✅ **AI 開發助手平台** - `@vibe/ai-assistant` 統一的 AI 輔助工具
- ✅ **DevOps 控制台** - `@vibe/devops-dashboard` 中心化監控
- ✅ **Docker 容器化** - 完整的 Docker 和 docker-compose 配置
- ✅ **專案文檔** - CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md

查看詳細的 [變更日誌](./CHANGELOG.md) 了解更多信息。

## 📁 專案結構

這個儲存庫包含多種類型的應用程式專案，全部使用 **AI 輔助開發工具**建立。每個專案都展示了如何有效地與 AI 協作進行軟體開發。

### 🌐 [web-apps](./web-apps) - 網頁應用 (AI-Native)
包含各種 AI 驅動的網頁應用，包括：
- 作品集/部落格
- 電子商務平台
- 社交媒體應用
- 儀表板和分析工具
- 生產力工具
- 著陸頁

### 📱 [mobile-apps](./mobile-apps) - 移動應用 (AI-Native)
AI 驅動的跨平台和原生移動應用：
- React Native 應用
- Flutter 應用
- iOS 原生應用
- Android 原生應用

### 💻 [desktop-apps](./desktop-apps) - 桌面應用 (AI-Native)
AI 驅動的桌面應用程式：
- Electron 應用
- Tauri 應用
- 原生桌面應用

### 🎮 [games](./games) - 遊戲 (AI-Native)
AI 驅動的各平台遊戲：
- 網頁遊戲
- 移動遊戲
- 桌面遊戲
- 遊戲引擎專案

### 🎬 [multimedia-apps](./multimedia-apps) - 多媒體應用 (AI-Native)
AI 驅動的多媒體處理應用：
- 視頻編輯與播放
- 音頻處理與播放
- 圖像編輯與處理
- 格式轉換工具
- 屏幕錄製與直播
- 實時音視頻通訊

⚠️ 驗證階段: 此類別中的工具和技術目前處於研究與驗證階段

### 🛠️ [tools-utilities](./tools-utilities) - 工具與實用程式 (AI-Native)
AI 驅動的開發者工具和實用程式：
- CLI 工具
- 自動化腳本
- 資料處理工具
- 開發工具

### 🔌 [apis-backend](./apis-backend) - API 與後端 (AI-Native)
AI 驅動的後端服務和 API：
- REST API
- GraphQL
- 微服務
- 無伺服器函數

### 🧩 [browser-extensions](./browser-extensions) - 瀏覽器擴充功能 (AI-Native)
AI 驅動的瀏覽器擴充功能：
- Chrome 擴充功能
- Firefox 擴充功能
- 跨瀏覽器擴充功能

### 🤖 [ai-ml-projects](./ai-ml-projects) - AI/機器學習專案
AI 和機器學習應用：
- 聊天機器人
- 圖像處理
- 資料分析
- 自然語言處理

### 🏢 [enterprise-apps](./enterprise-apps) - 企業應用 (AI-Native)
AI 驅動的企業級應用系統：
- ERP 系統
- CRM 系統
- 人力資源管理
- 專案管理
- 財務會計
- 供應鏈管理
- 商業智能
- 協作工具

### ⚙️ [system-firmware](./system-firmware) - 系統軟體與韌體 (AI-Native)
AI 驅動的底層系統開發：
- Android Framework 開發
- Linux Kernel & Drivers
- 嵌入式系統
- 韌體開發
- Bootloader
- RTOS (即時作業系統)
- 設備驅動程式
- HAL & BSP

⚠️ 驗證階段: 此類別中的工具和技術目前處於研究與驗證階段

### 🔌 [hardware-design](./hardware-design) - 硬體設計 (AI-Native)
AI 驅動的電路與 PCB 設計工具：
- AI PCB 佈局優化
- 電路性能優化
- 原理圖自動生成
- EDA 工具自動化
- 元件擺放優化
- 開源 EDA 工具整合

> ⚠️ **驗證階段**: 此類別中的工具和技術目前處於研究與驗證階段

## 🚀 快速開始

### 安裝依賴

```bash
# 安裝 pnpm (如果還沒安裝)
npm install -g pnpm

# 安裝所有項目依賴
pnpm install

# 設置 Git hooks
pnpm prepare
```

### 開發工作流程

```bash
# 運行所有項目的開發服務器
pnpm dev

# 構建所有項目
pnpm build

# 運行測試
pnpm test

# 代碼檢查
pnpm lint

# 格式化代碼
pnpm format
```

### 使用 Docker

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

### 使用 AI 助手

```bash
# 安裝 AI 助手 CLI
pnpm add -g @vibe/ai-assistant

# 分析代碼
vibe-ai analyze src/index.ts

# 獲取優化建議
vibe-ai optimize src/heavy.ts

# 代碼審查
vibe-ai review src/components/Form.tsx

# 項目健康檢查
vibe-ai health ./my-project
```

### 創建新項目

```bash
# 使用腳手架工具快速創建新項目
npx create-vibe-app my-app

# 或使用 pnpm
pnpm create vibe-app my-app

# 交互式創建
npx create-vibe-app
```

## 📦 核心包

### [@vibe/shared-utils](./packages/shared-utils)
共享工具函數庫，提供字符串、數組、對象、日期、驗證、異步等常用工具。

### [@vibe/ui-components](./packages/ui-components)
React UI 組件庫，提供精美、可訪問的 UI 組件（Button, Input, Card, Modal, Toast 等）。

### [@vibe/ai-assistant](./packages/ai-assistant)
統一的 AI 開發助手平台，提供代碼分析、優化、生成和審查功能。

### [@vibe/devops-dashboard](./packages/devops-dashboard)
DevOps 中心化控制台，監控構建、測試、部署和安全狀態。

### [create-vibe-app](./packages/create-vibe-app)
項目腳手架工具，快速創建新的 Vibe 應用，內置最佳實踐。

## 🔧 開發指南

詳細的開發指南請參考：
- [貢獻指南](./CONTRIBUTING.md)
- [安全政策](./SECURITY.md)
- [行為準則](./CODE_OF_CONDUCT.md)

## 🤖 什麼是 AI 驅動 (AI-Driven) 和 AI 原生 (AI-Native)？

### AI 驅動 (AI-Driven)
- 使用 AI 工具輔助編寫程式碼
- AI 協助設計架構和解決問題
- 利用 AI 進行程式碼審查和優化
- 加速開發流程和提高程式碼品質

### AI 原生 (AI-Native)
- 從一開始就設計為與 AI 工具協作
- 完全擁抱 AI 輔助開發的工作流程
- 優化專案結構以便 AI 更好地理解和協助
- 充分利用 AI 的能力來創新和實驗

## 💡 推薦的 AI 開發工具

### 主要工具
- **GitHub Copilot** - 即時程式碼建議
- **Claude Code** - 智能編程助手
- **Cursor** - AI 優先的程式碼編輯器
- **ChatGPT** - 程式碼生成和問題解決

### 輔助工具
- **Tabnine** - AI 程式碼補全
- **Codeium** - 免費的 AI 編程助手
- **Amazon CodeWhisperer** - AWS 整合的 AI 助手
- **Windsurf** - 協作式 AI 編程

## 🎯 使用 AI 工具的最佳實踐

1. **清晰的需求描述** - 向 AI 提供詳細的需求說明
2. **迭代開發** - 與 AI 協作逐步完善程式碼
3. **程式碼審查** - 理解 AI 生成的程式碼並進行審查
4. **測試驅動** - 使用 AI 協助編寫測試案例
5. **文檔優先** - 讓 AI 幫助生成和維護文檔

## 📝 貢獻

歡迎貢獻你使用 AI 輔助開發的專案！

### 貢獻指南
- 確保你的專案是使用 AI 工具開發的
- 在專案 README 中說明使用了哪些 AI 工具
- 分享你的 AI 協作經驗和最佳實踐
- 提供清晰的專案文檔和使用說明

## 📄 授權

請參考各個專案的授權資訊。
