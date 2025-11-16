# 🎬 Video Player - AI-Native 視頻播放器

基於 Electron 開發的現代化視頻播放器,支援多種視頻格式、字幕和播放列表功能。

## ✨ 功能特色

- 🎥 支援多種視頻格式 (MP4, AVI, MKV, MOV, WebM, FLV)
- 📝 字幕支援 (SRT, ASS, VTT)
- 🎚️ 播放速度控制 (0.25x - 2x)
- 📺 全螢幕與畫中畫模式
- 🔊 音量與亮度調整
- ⏩ 快進/快退 (5秒、15秒)
- 📋 播放列表管理
- ⌨️ 豐富的鍵盤快捷鍵
- 🎯 記憶播放進度
- 🖼️ 縮圖預覽

## 🛠️ 技術棧

- **框架**: Electron 28+
- **視頻處理**: HTML5 Video API
- **字幕解析**: subtitle.js
- **UI**: HTML5 + CSS3 + JavaScript

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
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Space` | 播放 / 暫停 |
| `→` | 快進 5 秒 |
| `←` | 快退 5 秒 |
| `Shift + →` | 快進 15 秒 |
| `Shift + ←` | 快退 15 秒 |
| `↑` | 增加音量 |
| `↓` | 減少音量 |
| `M` | 靜音 |
| `F` | 全螢幕 |
| `P` | 畫中畫 |
| `S` | 截圖 |
| `<` / `>` | 減速 / 加速 |
| `Ctrl/Cmd + O` | 開啟視頻 |

## 📁 專案結構

```
video-player/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── subtitleParser.js # 字幕解析器
│   ├── index.html       # 主界面
│   └── styles.css       # 樣式文件
├── package.json
└── README.md
```

## 🎯 核心功能

### 1. 視頻播放
- HTML5 Video 標準播放
- 硬體加速支援
- 流暢的播放控制

### 2. 字幕系統
- 自動加載同名字幕
- 手動選擇字幕檔案
- 字幕樣式自訂

### 3. 進度記憶
- 自動記住播放位置
- 下次開啟繼續播放
- LocalStorage 持久化

### 4. 播放列表
- 批量導入視頻
- 自動播放下一部
- 播放順序管理

## 🔧 未來規劃

- [ ] 硬體解碼支援
- [ ] 更多字幕格式
- [ ] 視頻效果濾鏡
- [ ] 音軌切換
- [ ] 章節導航
- [ ] 網路串流播放
- [ ] 彈幕功能

## 📝 授權

MIT License

---

**使用 AI 輔助開發** - 享受流暢的視頻播放體驗!
