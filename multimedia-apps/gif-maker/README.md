# 🎞️ GIF Maker - AI-Native GIF 製作工具

簡單易用的 GIF 動畫製作與編輯工具。

## ✨ 功能特色

- 🎥 視頻轉 GIF
- 📸 圖片序列轉 GIF
- 🎬 錄製螢幕為 GIF
- ✂️ GIF 編輯 (裁剪、調整大小)
- 🎨 添加文字與貼圖
- ⏱️ 幀率調整
- 🗜️ 智能壓縮優化
- 🔄 循環模式設定
- 📊 實時預覽

## 🛠️ 技術棧

- **框架**: Electron 28+
- **視頻處理**: FFmpeg
- **GIF 處理**: gifencoder
- **UI**: HTML5 + CSS3 + JavaScript

## 📁 專案結構

```
gif-maker/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── gifEncoder.js    # GIF 編碼器
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 🎯 核心功能

- **視頻轉 GIF**: 從視頻檔案生成 GIF
- **圖片合成**: 將多張圖片合成動畫 GIF
- **螢幕錄製**: 錄製螢幕區域為 GIF
- **優化壓縮**: 減小 GIF 檔案大小

## 📝 授權

MIT License
