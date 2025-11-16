# 🎼 Audio Editor - AI-Native 音頻編輯器

專業的音頻編輯與處理工具,支援剪輯、混音、效果處理。

## ✨ 功能特色

- ✂️ 音頻剪輯 (剪切、複製、貼上)
- 🔀 多軌混音
- 🎚️ 音量調整與淡入淡出
- 🎛️ 音效處理 (均衡器、混響、延遲)
- 🔄 變速不變調 / 變調不變速
- 📊 波形可視化
- 🎤 錄音功能
- 💾 多格式匯出 (MP3, WAV, FLAC, OGG)
- ⌨️ 鍵盤快捷鍵
- 🔌 插件系統

## 🛠️ 技術棧

- **框架**: Electron 28+
- **音頻處理**: Web Audio API
- **波形顯示**: WaveSurfer.js
- **UI**: HTML5 + CSS3 + JavaScript

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Space` | 播放 / 暫停 |
| `Ctrl + X` | 剪切 |
| `Ctrl + C` | 複製 |
| `Ctrl + V` | 貼上 |
| `Ctrl + Z` | 撤銷 |
| `Ctrl + Y` | 重做 |
| `Delete` | 刪除選區 |

## 📁 專案結構

```
audio-editor/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── audioEngine.js   # 音頻處理引擎
│   ├── timeline.js      # 時間軸
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 🎯 核心功能

- **非破壞性編輯**: 原始檔案不受影響
- **多軌編輯**: 支援多個音軌同時編輯
- **實時預覽**: 即時聽到編輯效果
- **專業效果**: 豐富的音頻效果器

## 📝 授權

MIT License
