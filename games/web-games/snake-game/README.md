# 🐍 貪吃蛇遊戲 (Snake Game)

一個使用原生 HTML5 Canvas 開發的經典貪吃蛇遊戲,具有流暢的動畫、漸進難度和本地最高分記錄。

## ✨ 功能特點

### 核心玩法
- 🎮 **經典玩法** - 控制蛇移動、吃食物、避免碰撞
- 🍎 **食物系統** - 隨機生成食物,吃到後增加長度和分數
- 💥 **碰撞檢測** - 撞牆或撞到自己會結束遊戲
- 📈 **漸進難度** - 隨著蛇變長,移動速度會逐漸增加

### 遊戲特性
- 🏆 **最高分記錄** - 使用 localStorage 保存最高分
- ⏸️ **暫停功能** - 隨時暫停/繼續遊戲
- 📊 **實時統計** - 顯示當前長度、速度和難度等級
- 🎨 **精美設計** - 漸層色彩、平滑動畫、響應式佈局
- 👁️ **生動細節** - 蛇頭有眼睛,會根據移動方向改變

### 技術特色
- 使用原生 Canvas API 繪製
- 無需任何外部依賴
- 純 JavaScript ES6+ 語法
- 響應式設計,支援各種螢幕尺寸
- 本地存儲最高分

## 🚀 快速開始

### 方法一:直接打開

最簡單的方式是直接在瀏覽器中打開 `index.html` 文件:

```bash
# 使用瀏覽器打開
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

### 方法二:使用本地伺服器

為了獲得最佳體驗,建議使用本地伺服器:

**使用 Python**:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**使用 Node.js (http-server)**:
```bash
# 安裝 http-server (全域)
npm install -g http-server

# 啟動伺服器
http-server -p 8000
```

**使用 VS Code Live Server**:
1. 安裝 Live Server 擴充功能
2. 右鍵點擊 `index.html`
3. 選擇 "Open with Live Server"

然後在瀏覽器中訪問: `http://localhost:8000`

## 🎮 遊戲操作

### 鍵盤控制
- `↑` **向上** - 蛇向上移動
- `↓` **向下** - 蛇向下移動
- `←` **向左** - 蛇向左移動
- `→` **向右** - 蛇向右移動
- `空白鍵` **暫停/繼續** - 切換遊戲暫停狀態

### 遊戲按鈕
- **開始遊戲** - 開始新遊戲
- **暫停** - 暫停當前遊戲
- **重新開始** - 重置遊戲到初始狀態

## 📋 遊戲規則

1. **目標**: 控制蛇吃到盡可能多的食物,獲得高分
2. **得分**: 每吃到一個食物 +10 分
3. **成長**: 吃到食物後蛇的長度會增加一格
4. **速度**: 每增長 5 格,遊戲速度會提升
5. **失敗條件**:
   - 撞到邊界牆壁
   - 撞到自己的身體

## 🎯 遊戲難度

遊戲會根據蛇的長度自動調整難度等級:

| 長度 | 難度 | 說明 |
|------|------|------|
| 1-9 | 簡單 | 初始階段,速度較慢 |
| 10-19 | 中等 | 速度提升,需要更好的反應 |
| 20+ | 困難 | 高速移動,需要精確控制 |

## 📁 專案結構

```
snake-game/
├── index.html          # 主 HTML 文件
├── src/
│   ├── game.js         # 遊戲邏輯
│   └── style.css       # 樣式文件
├── assets/             # 資源文件夾 (預留)
├── package.json        # 專案配置
└── README.md           # 專案說明
```

## 🔧 技術細節

### 核心技術
- **HTML5 Canvas** - 遊戲渲染
- **JavaScript ES6+** - 遊戲邏輯
- **CSS3** - 界面美化
- **LocalStorage** - 數據持久化

### 遊戲循環
```javascript
function update() {
    // 1. 更新方向
    // 2. 計算新位置
    // 3. 碰撞檢測
    // 4. 處理食物邏輯
    // 5. 更新畫面
}
```

### 碰撞檢測算法
```javascript
// 牆壁碰撞
if (head.x < 0 || head.x >= gridCount ||
    head.y < 0 || head.y >= gridCount) {
    gameOver();
}

// 自身碰撞
if (snake.some(segment =>
    segment.x === head.x && segment.y === head.y)) {
    gameOver();
}
```

### 食物生成
使用隨機算法生成食物位置,確保不會生成在蛇身上:

```javascript
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * gridCount),
            y: Math.floor(Math.random() * gridCount)
        };
    } while (isOnSnake(newFood));
    return newFood;
}
```

## 🎨 自訂設置

可以在 `src/game.js` 中修改遊戲參數:

```javascript
// 遊戲配置
const GRID_SIZE = 20;           // 格子大小
const CANVAS_SIZE = 400;        // 畫布大小
const INITIAL_SPEED = 150;      // 初始速度 (ms)
const SPEED_INCREMENT = 5;      // 速度增量
```

### 自訂顏色
在 `src/style.css` 中可以修改配色方案:

```css
/* 主題漸層 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 按鈕顏色 */
.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🚀 進階功能建議

可以添加的功能:

- [ ] **音效系統** - 添加吃食物和遊戲結束音效
- [ ] **難度選擇** - 讓玩家選擇初始難度
- [ ] **障礙物** - 在畫面中添加障礙物
- [ ] **道具系統** - 特殊食物(減速、加速、無敵)
- [ ] **多人模式** - 雙人對戰
- [ ] **排行榜** - 在線排行榜系統
- [ ] **主題切換** - 多種視覺主題
- [ ] **移動端支援** - 虛擬搖桿控制

## 📊 性能優化

目前的實現已包含以下優化:

1. **高效渲染** - 只在需要時重繪畫布
2. **防抖處理** - 防止方向鍵快速連按導致的bug
3. **記憶體管理** - 及時清理遊戲循環計時器
4. **本地存儲** - 最高分只在更新時寫入

## 🐛 已知問題

目前沒有已知的重大問題。如果發現 bug,請報告給開發者。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request!

改進建議:
- 代碼優化
- 新功能
- bug 修復
- 文檔改進

## 📄 授權

MIT License - 可以自由使用、修改和分發

## 🎓 學習要點

這個專案是學習以下概念的絕佳範例:

- HTML5 Canvas API
- JavaScript 遊戲循環
- 碰撞檢測算法
- 狀態管理
- 鍵盤事件處理
- LocalStorage 使用
- 響應式設計

## 🌟 技術亮點

1. **純原生實現** - 無框架依賴,適合學習基礎
2. **完整遊戲循環** - 展示標準遊戲開發流程
3. **優雅的代碼結構** - 易讀易維護
4. **現代化設計** - 漸層、陰影、動畫效果
5. **用戶體驗** - 暫停、重開、統計等完整功能

## 📱 瀏覽器相容性

支援所有現代瀏覽器:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 47+

## 🎉 開始遊戲吧!

打開遊戲,挑戰你的最高分!

---

**開發者**: Vibe Coding Apps
**技術棧**: HTML5 Canvas + Vanilla JavaScript
**難度**: ⭐ (初級)
**開發時間**: 1-2 天
**最後更新**: 2025-11-16
**維護狀態**: ✅ 活躍開發
