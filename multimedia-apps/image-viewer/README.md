# 🖼️ Image Viewer - AI-Native 圖片查看器

基於 Electron 開發的跨平台圖片查看器,支援多種圖片格式、基礎編輯功能和批量瀏覽。

## ✨ 功能特色

- 📁 支援多種圖片格式 (JPG, PNG, GIF, BMP, WebP, SVG)
- 🔍 縮放功能 (滾輪縮放、適應視窗)
- 🔄 旋轉與翻轉
- 🎨 基礎濾鏡效果 (灰階、復古、模糊等)
- ⌨️ 鍵盤快捷鍵支援
- 📂 資料夾批量瀏覽
- 💾 快速儲存編輯結果
- 🎯 簡潔直觀的使用介面

## 🛠️ 技術棧

- **框架**: Electron 28+
- **圖像處理**: Sharp (Node.js 圖像處理庫)
- **UI**: HTML5 + CSS3 + JavaScript
- **構建工具**: electron-builder

## 📦 安裝依賴

```bash
npm install
```

## 🚀 開發模式

```bash
npm run dev
```

## 📦 打包應用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `←` / `→` | 上一張 / 下一張 |
| `Ctrl/Cmd + O` | 開啟圖片 |
| `Ctrl/Cmd + S` | 儲存圖片 |
| `Ctrl/Cmd + +/-` | 放大 / 縮小 |
| `Ctrl/Cmd + 0` | 重置縮放 |
| `R` | 順時針旋轉 90° |
| `Shift + R` | 逆時針旋轉 90° |
| `F` | 適應視窗 |
| `Esc` | 退出全螢幕 |

## 📁 專案結構

```
image-viewer/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── imageProcessor.js # 圖像處理模組
│   ├── index.html       # 主界面
│   └── styles.css       # 樣式文件
├── package.json
└── README.md
```

## 🎯 核心功能實現

### 1. 圖片載入與顯示
- 使用 Electron dialog 選擇圖片
- Canvas API 進行渲染和縮放
- 支援拖拽載入

### 2. 圖像處理
- Sharp 庫進行高性能處理
- 旋轉、翻轉、濾鏡應用
- 實時預覽效果

### 3. 批量瀏覽
- 自動掃描同資料夾圖片
- 快速切換上下一張
- 縮圖列表顯示

## 🔧 未來規劃

- [ ] 支援 RAW 格式圖片
- [ ] 添加更多濾鏡效果
- [ ] 圖片比對功能
- [ ] 幻燈片播放
- [ ] 基礎標註工具
- [ ] 圖片元數據顯示
- [ ] 插件系統

## 📝 授權

MIT License

---

**使用 AI 輔助開發** - 讓開發更簡單、更快速！
