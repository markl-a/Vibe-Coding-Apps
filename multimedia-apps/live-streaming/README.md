# 📡 Live Streaming - AI-Native 直播應用

專業的直播推流與管理工具。

## ✨ 功能特色

- 📹 攝影機與螢幕捕獲
- 🎥 多場景管理
- 🎨 即時濾鏡與特效
- 🎙️ 音頻混音
- 💬 聊天室整合
- 📊 直播數據監控
- 🔄 多平台推流 (YouTube, Twitch, Facebook)
- 🎬 錄製功能
- 🖼️ 圖片疊加
- 🎯 虛擬背景

## 🛠️ 技術棧

- **框架**: Electron 28+
- **串流**: FFmpeg + RTMP
- **WebRTC**: 實時通訊
- **UI**: HTML5 + CSS3 + JavaScript

## 📁 專案結構

```
live-streaming/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── streamer.js      # 推流引擎
│   ├── sceneManager.js  # 場景管理
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 🎯 核心功能

- **場景切換**: 多個場景即時切換
- **來源管理**: 攝影機、螢幕、圖片、文字
- **濾鏡效果**: 美顏、色彩調整、特效
- **推流設定**: 自訂碼率、解析度

## 🌐 支援平台

- YouTube Live
- Twitch
- Facebook Live
- 自訂 RTMP 伺服器

## 🔧 未來規劃

- [ ] AI 虛擬主播
- [ ] 自動場景切換
- [ ] 彈幕互動
- [ ] 多機位導播
- [ ] 雲端錄製

## 📝 授權

MIT License
