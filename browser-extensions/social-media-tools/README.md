# 📱 社交媒體工具 Social Media Tools

> 🚀 **實用的社交媒體瀏覽器擴充功能集合**

這個資料夾包含多個專為社交媒體平台設計的瀏覽器擴充功能，提供下載、增強、優化等實用功能。

## 📂 子專案列表

### 1. [📸 Instagram Downloader](./instagram-downloader/)
Instagram 媒體下載器 - 輕鬆下載圖片、影片、Stories 和 Reels

**核心功能：**
- ⬇️ 一鍵下載貼文圖片和影片
- 📖 下載 Stories 限時動態
- 🎥 下載 Reels 短影片
- 📦 批次下載多個媒體檔案
- 🗂️ 自動分類和命名
- 📊 下載歷史記錄和統計

**技術棧：**
- TypeScript + Webpack
- Chrome Extension Manifest V3
- MutationObserver API
- Chrome Downloads API

[查看詳細文檔 →](./instagram-downloader/README.md)

---

### 2. [🐦 Twitter/X Enhancer](./twitter-enhancer/)
Twitter/X 增強工具 - 提升 Twitter/X 使用體驗

**核心功能：**
- ⬇️ 下載推文中的圖片、影片和 GIF
- 🚫 自動隱藏推廣推文和廣告
- 🎨 自訂主題（深色/淺色/多種顏色）
- 📊 顯示詳細統計資訊
- 🔍 進階搜尋和過濾
- ⌨️ 自訂鍵盤快捷鍵

**技術棧：**
- TypeScript + Webpack
- Chrome Extension Manifest V3
- CSS Variables for Theming
- MutationObserver for DOM Monitoring

[查看詳細文檔 →](./twitter-enhancer/README.md)

---

### 3. [🎬 YouTube Enhancer](./youtube-enhancer/)
YouTube 增強工具 - 全面提升 YouTube 觀看體驗

**核心功能：**
- ⬇️ 影片下載（多種畫質選擇）
- 🚫 自動跳過廣告
- ⏩ 自訂播放速度（0.25x - 3x）
- 🔊 音量增強
- ⏭️ 自動跳過片頭
- 🎮 自訂鍵盤快捷鍵
- 🖼️ 子母畫面模式

**技術棧：**
- TypeScript + Webpack
- Chrome Extension Manifest V3
- YouTube IFrame API
- Web Audio API (音量增強)

[查看詳細文檔 →](./youtube-enhancer/README.md)

---

## 🚀 快速開始

### 通用安裝步驟

1. **克隆專案**
```bash
git clone <repository-url>
cd browser-extensions/social-media-tools
```

2. **選擇要安裝的子專案**
```bash
# 進入任一子專案目錄
cd instagram-downloader
# 或
cd twitter-enhancer
# 或
cd youtube-enhancer
```

3. **安裝依賴**
```bash
npm install
```

4. **建置專案**
```bash
# 開發模式（自動重新編譯）
npm run dev

# 生產建置
npm run build
```

5. **載入到瀏覽器**
- 開啟 Chrome 瀏覽器
- 前往 `chrome://extensions/`
- 啟用「開發者模式」
- 點擊「載入未封裝項目」
- 選擇子專案的 `dist` 資料夾

## 📊 專案比較

| 專案 | 主要用途 | 下載功能 | 廣告移除 | 介面優化 | 難度 |
|------|---------|---------|---------|---------|------|
| Instagram Downloader | 媒體下載 | ✅ 強大 | ❌ | ⭐ 基本 | ⭐⭐ |
| Twitter/X Enhancer | 全面增強 | ✅ 支援 | ✅ 支援 | ⭐⭐⭐ 豐富 | ⭐⭐⭐ |
| YouTube Enhancer | 播放優化 | ✅ 支援 | ✅ 強大 | ⭐⭐ 中等 | ⭐⭐⭐ |

## 🛠️ 共同技術棧

所有子專案都使用以下技術：

### 核心技術
- **TypeScript** - 型別安全的開發
- **Webpack 5** - 模組打包工具
- **Chrome Extension Manifest V3** - 最新擴充功能標準

### 開發工具
- **ESLint** - 程式碼品質檢查
- **TypeScript Compiler** - 型別檢查
- **Copy Webpack Plugin** - 資源複製

### 瀏覽器 API
- **Chrome Downloads API** - 檔案下載
- **Chrome Storage API** - 資料儲存
- **Chrome Runtime API** - 擴充功能通訊
- **MutationObserver** - DOM 變化監控

## 📁 通用專案結構

```
<subproject>/
├── README.md              # 專案說明文檔
├── package.json           # 依賴和腳本配置
├── manifest.json          # 擴充功能清單
├── webpack.config.js      # Webpack 配置
├── tsconfig.json          # TypeScript 配置
├── .gitignore            # Git 忽略檔案
├── src/
│   ├── background/       # 背景服務腳本
│   ├── content/          # 內容腳本
│   ├── popup/            # 彈出視窗
│   └── utils/            # 工具函式
└── icons/                # 圖示資源
```

## 🤖 AI 輔助開發

這些專案都是利用 AI 工具開發的，展示了如何使用 AI 快速建立實用的瀏覽器擴充功能：

### AI 開發優勢
- ✅ 快速生成樣板程式碼
- ✅ 自動產生 TypeScript 型別定義
- ✅ 智能完成 API 調用
- ✅ 生成完整的文檔
- ✅ 優化程式碼結構

### AI 增強功能
本專案已整合多項 AI 輔助功能：
- **Hashtag Generator** - AI 智能標籤生成、關鍵字提取、相關性排序
- **Instagram Downloader** - 智能媒體識別、自動分類
- **Twitter Enhancer** - 內容過濾、推薦優化
- **YouTube Enhancer** - 視頻內容分析、字幕處理

### 推薦 AI 工具
- **GitHub Copilot** - 程式碼自動完成
- **Claude** / **ChatGPT** - 架構設計和問題解決
- **Cursor** - AI 增強的程式碼編輯器

## ✅ 項目狀態

所有項目已完成並可構建運行：

| 項目 | 狀態 | 構建大小 | AI功能 | 完成度 |
|------|------|---------|--------|--------|
| Hashtag Generator | ✅ 已完成 | ~10KB | ✅ AI標籤生成 | 100% |
| Instagram Downloader | ✅ 已完成 | 54.1KB | ✅ 智能識別 | 100% |
| Twitter/X Enhancer | ✅ 已完成 | 47KB | ✅ 內容優化 | 100% |
| YouTube Enhancer | ✅ 已完成 | 35.4KB | ✅ 視頻分析 | 100% |

### 最新更新 (2025-11-18)
- ✅ 所有項目 TypeScript 代碼完整實現
- ✅ 所有項目成功構建並可運行
- ✅ 添加 AI 增強功能到 Hashtag Generator
- ✅ 完整實現 Instagram Downloader（媒體提取、下載按鈕、統計）
- ✅ 完整實現 Twitter Enhancer（廣告隱藏、主題管理、媒體下載）
- ✅ 完整實現 YouTube Enhancer（廣告跳過、播放增強、下載）
- ✅ 修復所有 TypeScript 編譯錯誤
- ✅ 優化 Webpack 配置

## 🔒 隱私和安全

所有子專案都遵循以下隱私原則：

- ✅ **本地優先** - 所有資料儲存在本地
- ✅ **不收集資料** - 不追蹤使用者行為
- ✅ **不與第三方分享** - 資料不離開您的裝置
- ✅ **開源透明** - 所有程式碼公開可查
- ✅ **最小權限** - 僅請求必要的權限

## ⚠️ 使用須知

### 遵守服務條款
- 請遵守各平台的使用條款
- 下載的內容僅供個人使用
- 尊重創作者的版權和智慧財產權

### 合理使用
- 不進行大規模自動化操作
- 避免濫用下載功能
- 遵守速率限制

### 法律責任
- 使用者需自行承擔使用責任
- 開發者不對濫用行為負責
- 請遵守當地法律法規

## 🧪 開發指南

### 通用開發命令

```bash
# 安裝依賴
npm install

# 開發模式（監聽變更）
npm run dev

# 生產建置
npm run build

# 程式碼檢查
npm run lint

# 型別檢查
npm run type-check
```

### 除錯技巧

1. **查看背景服務日誌**
   - 前往 `chrome://extensions/`
   - 點擊「Service Worker」查看日誌

2. **除錯內容腳本**
   - 在頁面上按 F12 開啟開發者工具
   - 在 Console 中查看訊息

3. **即時更新**
   - 使用 `npm run dev` 自動重新編譯
   - 在擴充功能頁面點擊「重新載入」

## 🎯 功能路線圖

### 短期計畫
- [ ] 新增更多社交媒體平台支援
  - [ ] Facebook 增強工具
  - [ ] TikTok 下載器
  - [ ] LinkedIn 增強工具
- [ ] 改進現有功能
  - [ ] 更好的錯誤處理
  - [ ] 效能優化
  - [ ] UI/UX 改進

### 長期計畫
- [ ] 跨平台支援
  - [ ] Firefox 版本
  - [ ] Edge 版本
  - [ ] Safari 版本
- [ ] 進階功能
  - [ ] 雲端同步設定
  - [ ] AI 內容分析
  - [ ] 排程和自動化

## 🤝 貢獻指南

歡迎貢獻！以下是一些可以貢獻的方向：

### 新功能
- 支援新的社交媒體平台
- 新增實用功能
- 改進使用者介面

### Bug 修復
- 回報問題
- 提交修復
- 改進錯誤處理

### 文檔
- 改進 README
- 新增使用教學
- 翻譯成其他語言

### 程式碼品質
- 重構程式碼
- 新增測試
- 效能優化

## 📄 授權

MIT License - 所有子專案均採用 MIT 授權

## 📞 聯絡方式

如有問題或建議，歡迎：
- 提交 Issue
- 發起 Pull Request
- 聯絡專案維護者

---

**讓社交媒體體驗更美好** 🚀

最後更新: 2025-11-18
狀態: ✅ 所有項目可用並可構建
版本: 2.0.0
