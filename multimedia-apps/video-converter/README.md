# 🔄 Video Converter - AI-Native 視頻轉檔工具

強大的視頻格式轉換與壓縮工具。

## ✨ 功能特色

- 🔄 支援多種格式 (MP4, AVI, MKV, MOV, WebM, FLV, WMV)
- 📦 批量轉檔
- 🗜️ 智能壓縮
- 📐 解析度調整
- 🎚️ 碼率控制
- 🎨 編解碼器選擇
- ✂️ 視頻裁剪
- 🔊 音頻提取
- 📊 轉檔進度顯示
- ⚡ 硬體加速支援

## 🛠️ 技術棧

- **框架**: Electron 28+
- **視頻處理**: FFmpeg
- **UI**: HTML5 + CSS3 + JavaScript

## 📁 專案結構

```
video-converter/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── ffmpegWrapper.js # FFmpeg 封裝
│   ├── presets.js       # 轉檔預設
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 🎯 轉檔預設

- **高品質**: 保持最佳畫質
- **標準品質**: 平衡品質與檔案大小
- **壓縮**: 最小檔案大小
- **行動裝置**: 適合手機播放
- **Web**: 適合網頁播放
- **自訂**: 完全自訂參數

## 📝 授權

MIT License
