# 🐦 Flappy Bird - 快樂小鳥

使用 Phaser.js 開發的經典 Flappy Bird 遊戲,具有流暢的物理效果、程序生成的障礙物和本地最高分記錄。

## ✨ 功能特點

### 核心玩法
- 🎮 **一鍵操作** - 點擊或按空白鍵讓小鳥飛起來
- 🚧 **隨機障礙** - 程序生成的管道,每次遊戲都不同
- 💯 **計分系統** - 穿過管道獲得分數
- 🏆 **最高分記錄** - 本地保存你的最佳成績

### 遊戲特性
- ⚡ **流暢物理** - 使用 Phaser Arcade Physics
- 🎨 **程序繪圖** - 無需外部圖片資源,純代碼生成
- 📱 **響應式設計** - 支援各種螢幕尺寸
- 🎯 **簡單直觀** - 易上手,難精通的經典玩法
- 💾 **本地存儲** - 自動保存最高分

### 技術特色
- 使用 Phaser 3 遊戲引擎
- Arcade Physics 物理引擎
- 程序化生成圖形
- Tween 動畫系統
- 事件驅動架構

## 🚀 快速開始

### 前置要求

無需安裝任何依賴!遊戲通過 CDN 加載 Phaser.js。

### 運行方式

**方法一:直接打開**
```bash
# 在瀏覽器中打開
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

**方法二:使用本地伺服器 (推薦)**
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

然後訪問: `http://localhost:8000`

### 在線部署

可以直接部署到:
- **GitHub Pages** - 免費靜態網站託管
- **Netlify** - 一鍵部署
- **Vercel** - 自動化部署
- **Surge** - 簡單快速

## 🎮 遊戲操作

### 控制方式
- **滑鼠左鍵** - 點擊讓小鳥飛起來
- **空白鍵** - 按下讓小鳥飛起來
- **觸控** - 觸控螢幕點擊(移動設備)

### 遊戲流程
1. **開始** - 點擊螢幕開始遊戲
2. **飛行** - 持續點擊控制小鳥高度
3. **穿越** - 通過管道之間的空隙
4. **得分** - 每穿過一組管道得 1 分
5. **結束** - 撞到管道或地面後重新開始

## 📋 遊戲規則

1. **目標**: 讓小鳥飛過盡可能多的管道
2. **得分**: 每成功穿過一組管道 +1 分
3. **失敗條件**:
   - 撞到上方或下方的管道
   - 撞到地面
   - 飛出螢幕上方

## 🎯 遊戲技巧

### 初學者
- 保持冷靜,不要慌張點擊
- 注意控制節奏,避免過度點擊
- 嘗試保持在螢幕中間高度
- 提前預判管道的位置

### 進階技巧
- 在管道間隙中央穿過最安全
- 連續管道之間保持穩定的高度
- 利用小鳥下落的慣性
- 掌握點擊的時機和頻率

## 📁 專案結構

```
flappy-bird/
├── index.html          # 主 HTML 文件
├── src/
│   └── game.js         # 遊戲邏輯 (Phaser)
├── assets/             # 資源文件夾
│   ├── sprites/        # 精靈圖 (可選)
│   └── audio/          # 音效 (可選)
├── package.json        # 專案配置
└── README.md           # 專案說明
```

## 🔧 技術細節

### 使用的技術
- **Phaser 3.70.0** - HTML5 遊戲框架
- **Arcade Physics** - 2D 物理引擎
- **HTML5 Canvas** - 渲染引擎
- **LocalStorage** - 數據持久化

### Phaser 場景生命週期
```javascript
preload()  // 預加載資源
  ↓
create()   // 創建遊戲物件
  ↓
update()   // 遊戲循環 (每幀執行)
```

### 物理引擎配置
```javascript
physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 1000 },  // 重力
        debug: false
    }
}
```

### 管道生成算法
```javascript
function createPipe() {
    const gap = 150;              // 管道間隙
    const minHeight = 100;        // 最小高度
    const maxHeight = 350;        // 最大高度
    const pipeHeight = Phaser.Math.Between(minHeight, maxHeight);

    // 創建上下管道
    createTopPipe(pipeHeight);
    createBottomPipe(pipeHeight + gap);
}
```

### 碰撞檢測
```javascript
// Phaser 物理碰撞
this.physics.add.collider(bird, pipes, hitPipe);
this.physics.add.collider(bird, ground, hitGround);
```

## 🎨 程序化圖形

遊戲使用程序化生成的圖形,無需外部圖片:

### 小鳥
- 黃色圓形身體
- 白色眼睛
- 黑色瞳孔
- 橙色三角形嘴巴

### 管道
- 綠色矩形主體
- 漸層效果
- 動態高度

### 地面
- 棕色土壤
- 綠色草地
- 草叢細節

## 🎮 自訂設置

在 `src/game.js` 中可以修改:

```javascript
// 遊戲尺寸
width: 400,
height: 600,

// 重力
gravity: { y: 1000 },

// 飛行力度
bird.setVelocityY(-350),

// 管道速度
pipe.setVelocityX(-200),

// 管道生成間隔
delay: 2000,  // 毫秒

// 管道間隙
const gap = 150,
```

## 🚀 進階功能建議

可以添加的功能:

- [ ] **音效系統** - 飛行、計分、碰撞音效
- [ ] **背景音樂** - 循環播放的背景音樂
- [ ] **精靈圖** - 使用真實的圖片素材
- [ ] **動畫效果** - 小鳥拍翅膀動畫
- [ ] **難度選擇** - 簡單、普通、困難模式
- [ ] **道具系統** - 護盾、減速等道具
- [ ] **多種場景** - 白天、夜晚、不同主題
- [ ] **成就系統** - 解鎖成就徽章
- [ ] **排行榜** - 在線分數排行
- [ ] **皮膚系統** - 不同的小鳥皮膚
- [ ] **粒子效果** - 飛行特效、爆炸效果
- [ ] **移動端優化** - 虛擬按鈕、觸控優化

## 📊 Phaser 優勢

相比原生 Canvas:

| 特性 | 原生 Canvas | Phaser |
|------|------------|--------|
| 開發速度 | 慢 | 快 ⚡ |
| 物理引擎 | 需自己實現 | 內建 ✅ |
| 碰撞檢測 | 手動計算 | 自動處理 ✅ |
| 動畫系統 | 複雜 | 簡單 ✅ |
| 聲音管理 | 基礎 | 完整 ✅ |
| 場景管理 | 無 | 內建 ✅ |
| 精靈管理 | 手動 | 自動 ✅ |

## 🐛 疑難排解

### 常見問題

**Q: 遊戲無法運行?**
A: 確保有網絡連接以加載 Phaser CDN,或使用本地伺服器運行

**Q: 小鳥掉落太快?**
A: 調整 `gravity.y` 和 `setVelocityY` 的值

**Q: 管道太密集?**
A: 增加 `pipeTimer` 的 `delay` 值

**Q: 遊戲太簡單/困難?**
A: 調整管道間隙 `gap` 和速度 `setVelocityX`

## 🎓 學習要點

這個專案展示了:

1. **Phaser 基礎** - 場景、精靈、物理
2. **物理引擎** - 重力、速度、碰撞
3. **遊戲循環** - update 函數的使用
4. **程序生成** - 動態創建遊戲物件
5. **事件處理** - 輸入事件管理
6. **狀態管理** - 遊戲狀態控制
7. **動畫系統** - Tween 動畫
8. **數據持久化** - LocalStorage 使用

## 🌟 與原版的對比

| 特性 | 原版 Flappy Bird | 這個版本 |
|------|----------------|---------|
| 圖形 | 像素風格精靈 | 程序生成 |
| 物理 | 自定義 | Phaser Arcade |
| 音效 | 8-bit 風格 | 可擴展 |
| 部署 | 移動應用 | Web 平台 |
| 難度 | 固定 | 可調整 |

## 📱 瀏覽器相容性

支援所有現代瀏覽器:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ iOS Safari
- ✅ Chrome Android

## 🤝 貢獻

歡迎提交改進建議!

可以貢獻的方向:
- 添加音效和音樂
- 創建精靈圖資源
- 實現新的遊戲模式
- 優化性能
- 改進 UI/UX
- 添加多語言支援

## 📄 授權

MIT License

## 🎉 致謝

- 靈感來自 Dong Nguyen 的原版 Flappy Bird
- 使用 Phaser 3 遊戲引擎
- 感謝所有貢獻者

## 🎮 開始遊戲!

準備好挑戰你的反應速度了嗎?打開遊戲,創造新的高分記錄!

---

**開發者**: Vibe Coding Apps
**技術棧**: Phaser 3 + Arcade Physics
**難度**: ⭐⭐ (中級)
**開發時間**: 3-5 天
**最後更新**: 2025-11-16
**維護狀態**: ✅ 活躍開發
