# 📸 Screenshot Tool - 強大的螢幕截圖工具

> 🤖 **AI-Driven | AI-Native** 🚀

輕量級但功能強大的跨平台螢幕截圖工具,支援全螢幕、區域和視窗截圖。

## ✨ 功能特色

### 核心功能
- 📸 **全螢幕截圖**: 捕捉整個螢幕
- 🎯 **區域截圖**: 自由選擇截圖區域
- 🪟 **視窗截圖**: 捕捉特定視窗
- 📋 **快速複製**: 截圖後自動複製到剪貼簿
- 💾 **自動儲存**: 截圖自動儲存到指定資料夾

### 編輯功能
- ✏️ **繪圖工具**: 矩形、圓形、箭頭、線條
- 🎨 **顏色選擇**: 多種顏色選項
- 📝 **文字標註**: 添加文字說明
- 🔍 **模糊處理**: 隱藏敏感資訊
- ↩️ **撤銷/重做**: 編輯步驟可逆

### 進階功能
- ⏱️ **延遲截圖**: 3/5/10 秒延遲
- 📏 **尺規顯示**: 顯示截圖尺寸
- 🔥 **快捷鍵**: 全域快捷鍵觸發
- 📂 **歷史記錄**: 查看最近的截圖
- 🌙 **暗色模式**: 護眼界面
- 🎯 **固定比例**: 16:9、4:3 等預設比例
- 📤 **快速分享**: 上傳到圖床或雲端

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm start
```

### 建置應用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 📦 技術棧

- **Electron**: 22.x - 跨平台桌面應用框架
- **electron-screenshot**: 螢幕截圖功能
- **fabric.js**: 圖片編輯和標註
- **electron-store**: 資料持久化
- **electron-localshortcut**: 本地快捷鍵

## 🎯 專案結構

```
screenshot-tool/
├── package.json           # 專案配置
├── main.js               # Electron 主程序
├── preload.js            # 預載腳本
├── index.html            # 主視窗 HTML
├── editor.html           # 編輯器視窗
├── styles.css            # 樣式表
├── renderer.js           # 渲染程序邏輯
├── editor.js             # 編輯器邏輯
├── assets/               # 靜態資源
│   └── icon.png         # 應用圖示
└── README.md            # 專案說明
```

## ⌨️ 快捷鍵

### 全域快捷鍵
- `Ctrl/Cmd + Shift + A`: 全螢幕截圖
- `Ctrl/Cmd + Shift + S`: 區域截圖
- `Ctrl/Cmd + Shift + W`: 視窗截圖

### 編輯器快捷鍵
- `Ctrl/Cmd + Z`: 撤銷
- `Ctrl/Cmd + Y`: 重做
- `Ctrl/Cmd + S`: 儲存
- `Ctrl/Cmd + C`: 複製到剪貼簿
- `ESC`: 關閉編輯器

### 繪圖工具
- `R`: 矩形工具
- `C`: 圓形工具
- `A`: 箭頭工具
- `L`: 線條工具
- `T`: 文字工具
- `B`: 模糊工具

## 🎨 編輯功能詳解

### 1. 繪圖工具

**矩形工具 (R)**
- 按住 Shift: 繪製正方形
- 填充/描邊切換

**圓形工具 (C)**
- 按住 Shift: 繪製正圓
- 調整大小和顏色

**箭頭工具 (A)**
- 指向性標註
- 可調整粗細和顏色

**線條工具 (L)**
- 直線繪製
- 可調整粗細和顏色

### 2. 文字標註 (T)

- 點擊位置添加文字
- 支援字體、大小、顏色設定
- 可拖動調整位置

### 3. 模糊處理 (B)

- 選擇區域應用模糊效果
- 保護隱私資訊
- 可調整模糊程度

### 4. 裁切功能

- 拖動邊緣調整截圖範圍
- 固定比例裁切
- 顯示實際尺寸

## ⚙️ 設定選項

應用會在使用者資料夾建立設定檔:
- Windows: `%APPDATA%/screenshot-tool/config.json`
- macOS: `~/Library/Application Support/screenshot-tool/config.json`
- Linux: `~/.config/screenshot-tool/config.json`

可配置項目:
```json
{
  "saveFolder": "~/Pictures/Screenshots",
  "fileFormat": "png",
  "fileName": "Screenshot_%Y%m%d_%H%M%S",
  "autoCopy": true,
  "showNotification": true,
  "playSound": false,
  "showCursor": false,
  "hotkeys": {
    "fullscreen": "CommandOrControl+Shift+A",
    "region": "CommandOrControl+Shift+S",
    "window": "CommandOrControl+Shift+W"
  },
  "theme": "light",
  "quality": 100
}
```

## 📂 檔案格式

支援的輸出格式:
- **PNG**: 無損壓縮,適合截圖 (預設)
- **JPEG**: 有損壓縮,檔案較小
- **WebP**: 現代格式,壓縮率高
- **BMP**: 無壓縮,檔案大

## 💡 使用技巧

### 1. 快速截圖工作流程

```
1. 按下快捷鍵 (Ctrl+Shift+S)
   ↓
2. 選擇截圖區域
   ↓
3. 自動開啟編輯器
   ↓
4. 添加標註 (可選)
   ↓
5. 儲存或複製
```

### 2. 區域選擇技巧

- **拖動**: 從左上到右下選擇區域
- **調整**: 拖動邊緣或角落調整大小
- **移動**: 在選區內拖動可移動位置
- **固定比例**: 按住 Shift 保持比例

### 3. 延遲截圖使用場景

- 捕捉選單或下拉式選單
- 捕捉滑鼠懸停效果
- 捕捉動畫特定幀

### 4. 檔案命名技巧

使用時間戳記自動命名:
- `%Y`: 年 (2025)
- `%m`: 月 (01-12)
- `%d`: 日 (01-31)
- `%H`: 時 (00-23)
- `%M`: 分 (00-59)
- `%S`: 秒 (00-59)

範例: `Screenshot_20251116_143025.png`

## 🚀 進階功能開發建議

### 1. 雲端整合
- Google Drive 上傳
- Dropbox 同步
- 自訂圖床 (imgur, sm.ms)

### 2. OCR 文字識別
- 整合 Tesseract.js
- 從截圖提取文字
- 自動翻譯功能

### 3. 滾動截圖
- 捕捉完整網頁
- 自動拼接多張截圖

### 4. 螢幕錄影
- 區域錄影
- GIF 動畫製作
- 轉場效果

### 5. AI 功能
- 智慧裁切
- 自動去背
- 圖片優化

### 6. 團隊協作
- 截圖分享連結
- 協作標註
- 版本歷史

## 🎯 使用場景

### 開發者
- 錯誤報告截圖
- UI 設計參考
- 程式碼分享

### 設計師
- 設計稿標註
- 靈感收集
- 客戶溝通

### 內容創作者
- 教學文件製作
- 社群媒體貼文
- 部落格文章配圖

### 一般使用者
- 保存重要資訊
- 分享有趣內容
- 技術支援求助

## 🐛 已知問題

- macOS 需要授予螢幕錄製權限
- Linux 某些桌面環境可能需要額外設定
- 多螢幕支援可能需要手動選擇

## 📝 更新日誌

### v1.0.0 (2025-11-16)
- ✨ 初始版本發布
- ✨ 基本截圖功能
- ✨ 圖片編輯和標註
- ✨ 全域快捷鍵
- ✨ 自動儲存
- ✨ 歷史記錄
- ✨ 暗色模式

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request!

## 📚 參考資源

- [Electron 螢幕截圖範例](https://github.com/electron/electron/tree/main/docs/tutorial)
- [fabric.js 文檔](http://fabricjs.com/)
- [截圖工具設計靈感](https://www.google.com/search?q=screenshot+tool+ui)

## 📄 授權

MIT License

## 🙏 致謝

- Electron 團隊
- fabric.js 開發者
- 所有開源貢獻者

---

**使用 AI 工具開發**: 建議使用 Cursor、GitHub Copilot 或 Claude Code
**最後更新**: 2025-11-16
**狀態**: ✅ 可用
