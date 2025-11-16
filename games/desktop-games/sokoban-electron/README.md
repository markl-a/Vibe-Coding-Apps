# 推箱子遊戲 (Sokoban)

使用 Electron 和 Phaser 開發的經典推箱子益智遊戲,支援 Windows、macOS 和 Linux 平台。

## 遊戲簡介

推箱子(Sokoban)是一款經典的益智遊戲,玩家需要將所有箱子推到目標位置才能過關。

### 遊戲特色

- 🎮 **經典玩法** - 原汁原味的推箱子遊戲體驗
- 🎯 **多個關卡** - 內建多個不同難度的關卡
- 🖥️ **跨平台** - 支援 Windows、macOS、Linux
- ⌨️ **鍵盤操作** - 方向鍵控制,簡單易上手
- 📊 **步數統計** - 記錄每關完成步數
- 🎨 **簡潔界面** - 清晰的視覺設計

## 遊戲規則

1. 使用方向鍵控制玩家(紅色圓圈)移動
2. 將所有箱子(橙色方塊)推到目標位置(藍色圓圈)
3. 箱子到達目標位置會變成綠色
4. 所有箱子都到達目標位置即可過關
5. 箱子只能推,不能拉
6. 一次只能推一個箱子

## 操作說明

- **方向鍵** - 移動玩家
- **R 鍵** - 重置當前關卡
- **N 鍵** - 下一關
- **P 鍵** - 上一關

## 技術棧

- **框架**: Electron 27.0+
- **遊戲引擎**: Phaser 3.70+
- **語言**: JavaScript (ES6+)
- **打包工具**: electron-builder

## 快速開始

### 環境需求

- Node.js 16.0+
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 運行遊戲

開發模式:
```bash
npm start
```

開發模式(帶調試):
```bash
npm run dev
```

### 打包發布

打包所有平台:
```bash
npm run build
```

僅打包 Windows:
```bash
npm run build:win
```

僅打包 macOS:
```bash
npm run build:mac
```

僅打包 Linux:
```bash
npm run build:linux
```

打包後的文件會在 `dist` 目錄中。

## 專案結構

```
sokoban-electron/
├── src/
│   ├── main.js          # Electron 主進程
│   └── game.js          # Phaser 遊戲邏輯
├── assets/              # 遊戲資源
│   └── icon.png         # 應用圖標
├── index.html           # 遊戲頁面
├── package.json         # 專案配置
└── README.md           # 說明文檔
```

## 遊戲開發

### 添加新關卡

在 `src/game.js` 的 `levels` 數組中添加新關卡:

```javascript
{
    name: "新關卡名稱",
    width: 10,    // 寬度(格子數)
    height: 8,    // 高度(格子數)
    map: [
        // 0: 空地, 1: 玩家, 2: 箱子, 3: 牆壁, 4: 目標
        [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
        [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
        // ...更多行
    ]
}
```

### 自訂遊戲外觀

修改 `src/game.js` 中的顏色常量:

```javascript
// 玩家顏色
graphics.fillStyle(0xe74c3c, 1);  // 紅色

// 箱子顏色
graphics.fillStyle(0xe67e22, 1);  // 橙色

// 目標點顏色
graphics.fillStyle(0x3498db, 0.5); // 藍色

// 牆壁顏色
graphics.fillStyle(0x2c3e50, 1);  // 深灰色
```

## 遊戲截圖

遊戲包含三個關卡:
- 第一關: 入門 - 單箱子簡單關卡
- 第二關: 進階 - 雙箱子中等難度
- 第三關: 挑戰 - 三箱子高難度

## 擴展功能建議

想要擴展這個遊戲?以下是一些建議:

- 🎨 **更多關卡** - 添加更多有趣的關卡設計
- 📊 **排行榜** - 記錄最少步數通關
- 💾 **存檔系統** - 保存遊戲進度
- 🎵 **音效音樂** - 添加背景音樂和音效
- 🖼️ **美術升級** - 使用精美的圖片資源
- 📝 **關卡編輯器** - 讓玩家創建自己的關卡
- 🌐 **在線模式** - 分享和下載玩家創建的關卡
- ⏱️ **計時模式** - 添加時間挑戰
- 🏆 **成就系統** - 完成特定挑戰獲得成就
- 🎮 **手柄支援** - 支援遊戲手柄操作

## 學習資源

### Electron
- [Electron 官方文檔](https://www.electronjs.org/docs)
- [Electron 快速入門](https://www.electronjs.org/docs/latest/tutorial/quick-start)

### Phaser
- [Phaser 官方文檔](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 教程](https://phaser.io/tutorials)
- [Phaser 範例](https://phaser.io/examples)

### 推箱子遊戲設計
- 關卡設計要點: 從簡單到複雜循序漸進
- 確保每個關卡都有解
- 避免創建無解的死局(箱子被推到角落)

## 性能優化

### Electron 優化
```javascript
// 禁用不必要的功能
win.webPreferences.nodeIntegration = false;
win.webPreferences.contextIsolation = true;

// 優化渲染
win.webPreferences.hardwareAcceleration = true;
```

### Phaser 優化
```javascript
// 使用對象池重用對象
// 減少繪圖調用次數
// 使用適當的渲染模式
```

## 常見問題

### Q: 如何增加遊戲窗口大小?
A: 修改 `src/main.js` 中的 `width` 和 `height` 參數。

### Q: 遊戲無法啟動?
A: 確保已運行 `npm install` 安裝所有依賴。

### Q: 如何添加圖片資源?
A: 在 `preload()` 函數中使用 `this.load.image()` 加載圖片。

### Q: 打包後的文件太大?
A: 可以使用 `electron-builder` 的壓縮選項,或移除不必要的依賴。

## 貢獻

歡迎提交 Issue 和 Pull Request!

## License

MIT License

## 作者

Vibe Coding Apps - 桌面遊戲開發學習專案

---

**建立日期**: 2025-11-16
**狀態**: ✅ 可用
**版本**: 1.0.0
**平台**: Windows / macOS / Linux
**技術**: Electron + Phaser
