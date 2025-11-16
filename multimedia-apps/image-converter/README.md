# 🔄 Image Converter - AI-Native 圖片轉檔工具

高效的批量圖片格式轉換與處理工具。

## ✨ 功能特色

- 🔄 支援多種格式轉換 (JPG, PNG, WebP, GIF, BMP, TIFF)
- 📦 批量處理
- 🗜️ 圖片壓縮 (有損/無損)
- 📐 調整尺寸
- 🎨 添加浮水印
- 🔧 自訂輸出品質
- 📊 進度追蹤
- ⚡ 多線程處理

## 🛠️ 技術棧

- **框架**: Electron 28+
- **圖像處理**: Sharp
- **UI**: HTML5 + CSS3 + JavaScript

## 📁 專案結構

```
image-converter/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── converter.js     # 轉換引擎
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 🎯 核心功能

- **格式轉換**: 支援常見圖片格式互轉
- **批量處理**: 同時處理多個圖片
- **壓縮優化**: 在保持品質下減小檔案大小
- **尺寸調整**: 按比例或指定尺寸縮放

## 📝 授權

MIT License
