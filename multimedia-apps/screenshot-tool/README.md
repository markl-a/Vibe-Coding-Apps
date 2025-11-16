# 📸 Screenshot Tool - AI-Native 截圖工具

功能強大的截圖與標註工具,支援區域截圖、全螢幕截圖和標註編輯。

## ✨ 功能特色

- 🖱️ 區域選擇截圖
- 🖥️ 全螢幕截圖
- 🎯 活動視窗截圖
- ✏️ 標註工具 (文字、箭頭、矩形、圓形、線條)
- 🎨 繪圖工具 (畫筆、螢光筆、馬賽克)
- 📏 尺寸測量
- 💾 快速儲存與複製
- ⌨️ 快捷鍵支援
- 🔄 撤銷/重做功能
- 📤 分享功能

## 🛠️ 技術棧

- **框架**: Electron 28+
- **截圖**: desktopCapturer API
- **繪圖**: Canvas API
- **UI**: HTML5 + CSS3 + JavaScript

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `PrintScreen` | 區域截圖 |
| `Ctrl + Shift + S` | 全螢幕截圖 |
| `Ctrl + S` | 儲存 |
| `Ctrl + C` | 複製到剪貼簿 |
| `Ctrl + Z` | 撤銷 |
| `Ctrl + Y` | 重做 |
| `Esc` | 取消 |

## 📁 專案結構

```
screenshot-tool/
├── src/
│   ├── main.js          # Electron 主進程
│   ├── renderer.js      # 渲染進程邏輯
│   ├── capture.js       # 截圖功能
│   ├── editor.js        # 編輯器
│   ├── index.html
│   └── styles.css
├── package.json
└── README.md
```

## 📝 授權

MIT License
