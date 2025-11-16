# 打磚塊遊戲 (Breakout)

使用 Love2D (Lua) 開發的經典打磚塊遊戲,支援 Windows、macOS 和 Linux 平台。

## 遊戲簡介

打磚塊(Breakout)是一款經典的街機遊戲,玩家控制擋板反彈球來擊碎所有磚塊。

### 遊戲特色

- 🎮 **經典玩法** - 原汁原味的打磚塊體驗
- 🎨 **彩色磚塊** - 不同顏色不同分數
- 🏆 **無限關卡** - 關卡越高難度越大
- ⚡ **物理反彈** - 真實的球反彈物理
- 💯 **分數系統** - 記錄分數和關卡
- ⏸️ **暫停功能** - 隨時暫停/繼續
- 🖥️ **跨平台** - 支援 Windows、macOS、Linux
- 🎯 **角度控制** - 擊中擋板不同位置改變反彈角度

## 遊戲規則

1. 使用方向鍵或 A/D 控制擋板左右移動
2. 空白鍵發射球
3. 用擋板反彈球擊碎所有磚塊
4. 不同顏色磚塊分數不同:
   - 紅色 (頂部): 50 分
   - 橙色: 40 分
   - 黃色: 30 分
   - 綠色: 20 分
   - 藍色: 10 分
5. 清除所有磚塊進入下一關
6. 球掉落扣一條生命
7. 生命歸零遊戲結束

## 操作說明

### 移動控制
- **左方向鍵 / A** - 向左移動擋板
- **右方向鍵 / D** - 向右移動擋板

### 遊戲控制
- **空白鍵** - 發射球 / 重新開始
- **P 鍵** - 暫停/繼續遊戲
- **ESC 鍵** - 退出遊戲

## 技術棧

- **語言**: Lua 5.1+
- **遊戲框架**: Love2D 11.4+
- **物理**: 自定義碰撞檢測
- **架構**: 面向函數設計

## 快速開始

### 環境需求

- Love2D 11.4 或更高版本

### 安裝 Love2D

#### Windows
1. 下載 Love2D: https://love2d.org/
2. 安裝 Love2D
3. 將 Love2D 安裝路徑加入系統 PATH (可選)

#### macOS
```bash
brew install love
```

或從官網下載 .dmg 安裝包。

#### Linux (Ubuntu/Debian)
```bash
sudo add-apt-repository ppa:bartbes/love-stable
sudo apt-get update
sudo apt-get install love
```

### 運行遊戲

#### 方法 1: 使用 Love2D 命令
```bash
love .
```

#### 方法 2: 拖放 (Windows/macOS)
將遊戲資料夾拖放到 Love2D 可執行文件上。

#### 方法 3: 創建 .love 文件
```bash
# 打包遊戲
zip -r breakout.love .

# 運行
love breakout.love
```

## 專案結構

```
breakout-love2d/
├── main.lua           # 遊戲主程序
├── conf.lua          # Love2D 配置文件
└── README.md         # 說明文檔
```

## 遊戲架構

### 主要函數

```lua
-- Love2D 核心函數
love.load()           -- 遊戲初始化
love.update(dt)       -- 更新遊戲邏輯(每幀)
love.draw()           -- 繪製遊戲畫面(每幀)
love.keypressed(key)  -- 鍵盤按下事件

-- 遊戲邏輯函數
resetGame()           -- 重置遊戲
resetBall()           -- 重置球
createBricks()        -- 創建磚塊
launchBall()          -- 發射球

-- 碰撞檢測函數
checkPaddleCollision()  -- 檢查擋板碰撞
checkBrickCollision()   -- 檢查磚塊碰撞
checkAllBricksGone()    -- 檢查是否清空磚塊

-- 繪製函數
drawUI()              -- 繪製UI
drawStartScreen()     -- 繪製開始畫面
drawGameOverScreen()  -- 繪製遊戲結束畫面
drawPausedScreen()    -- 繪製暫停畫面
```

### 資料結構

```lua
-- 擋板
paddle = {
    x, y,           -- 位置
    width, height,  -- 尺寸
    speed           -- 移動速度
}

-- 球
ball = {
    x, y,           -- 位置
    radius,         -- 半徑
    dx, dy,         -- 速度向量
    speed,          -- 速度大小
    stuck           -- 是否黏在擋板上
}

-- 磚塊
brick = {
    x, y,           -- 位置
    width, height,  -- 尺寸
    alive,          -- 是否存在
    points,         -- 分數
    colorIndex      -- 顏色索引
}
```

## 遊戲配置

在 `main.lua` 中可以調整以下參數:

### 視窗設置
```lua
local windowWidth = 800
local windowHeight = 600
```

### 擋板設置
```lua
paddle = {
    width = 100,    -- 擋板寬度
    height = 15,    -- 擋板高度
    speed = 500     -- 移動速度
}
```

### 球設置
```lua
ball = {
    radius = 8,     -- 球半徑
    speed = 300     -- 球速度
}
```

### 磚塊設置
```lua
local brickRows = 5      -- 磚塊行數
local brickCols = 10     -- 磚塊列數
local brickWidth = 70    -- 磚塊寬度
local brickHeight = 20   -- 磚塊高度
local brickPadding = 5   -- 磚塊間距
```

### 遊戲難度
```lua
-- 在 love.update() 中調整關卡升級時的速度增加
ball.speed = ball.speed + 50  -- 每關增加 50 速度
```

## 擴展功能建議

想要擴展這個遊戲?以下是一些建議:

- 🎵 **音效音樂** - 添加擊中磚塊、反彈等音效
- 🎁 **道具系統** - 加長擋板、多球、穿透等道具
- 🚀 **特殊磚塊** - 堅硬磚塊、炸彈磚塊、移動磚塊
- 💥 **粒子效果** - 磚塊破碎特效
- 🏆 **關卡設計** - 自定義不同形狀的磚塊佈局
- 💾 **存檔系統** - 保存最高分和進度
- 📊 **統計數據** - 擊中率、連擊數等
- 🎨 **主題系統** - 多種視覺主題
- 🌐 **關卡編輯器** - 讓玩家創建關卡
- ⚡ **激光擋板** - 發射激光摧毀磚塊
- 🎮 **手柄支援** - 支援遊戲手柄
- 🏅 **成就系統** - 完成特定挑戰獲得成就

## 碰撞檢測原理

### AABB 碰撞檢測
```lua
-- Axis-Aligned Bounding Box (軸對齊邊界框)
function checkCollision(ball, rect)
    return ball.x + ball.radius > rect.x and
           ball.x - ball.radius < rect.x + rect.width and
           ball.y + ball.radius > rect.y and
           ball.y - ball.radius < rect.y + rect.height
end
```

### 碰撞方向計算
```lua
-- 計算最小重疊以確定碰撞方向
local overlapLeft = ball.x + ball.radius - brick.x
local overlapRight = brick.x + brick.width - (ball.x - ball.radius)
local overlapTop = ball.y + ball.radius - brick.y
local overlapBottom = brick.y + brick.height - (ball.y - ball.radius)

local minOverlap = math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
```

### 角度反彈
```lua
-- 根據擊中擋板的位置調整反彈角度
local hitPos = (ball.x - paddle.x) / paddle.width  -- 0 到 1
local angle = (hitPos - 0.5) * 90  -- -45 到 45 度
```

## 打包發布

### 創建 .love 文件
```bash
zip -r breakout.love . -x "*.git*" -x "README.md"
```

### Windows 可執行文件
```bash
# 合併 love.exe 和 .love 文件
copy /b love.exe+breakout.love breakout.exe
```

### macOS 應用包
1. 複製 love.app
2. 重命名為 Breakout.app
3. 將 .love 文件放入 Breakout.app/Contents/Resources/

### Linux AppImage
使用 Love2D 的 AppImage 工具打包。

## 性能優化

### 避免不必要的計算
```lua
-- 只對存活的磚塊進行碰撞檢測
if brick.alive then
    -- 碰撞檢測
end
```

### 使用局部變量
```lua
-- Lua 中局部變量訪問速度更快
local function update(dt)
    local px = paddle.x
    local bx = ball.x
    -- ...
end
```

### 減少繪製調用
```lua
-- 批次繪製相同顏色的物件
love.graphics.setColor(color)
for _, brick in ipairs(bricks) do
    if brick.alive and brick.colorIndex == currentColor then
        love.graphics.rectangle("fill", brick.x, brick.y, brick.width, brick.height)
    end
end
```

## 常見問題

### Q: 如何調整遊戲難度?
A: 修改球的初始速度和每關增加的速度值。

### Q: 如何改變磚塊佈局?
A: 修改 `createBricks()` 函數中的 `brickRows` 和 `brickCols` 參數。

### Q: 如何添加音效?
A: 使用 Love2D 的音頻 API:
```lua
-- 加載音效
local hitSound = love.audio.newSource("hit.wav", "static")
-- 播放
hitSound:play()
```

### Q: 球為什麼會卡在磚塊裡?
A: 這是由於球速過快,穿過了磚塊。解決方法:
- 降低球速
- 使用連續碰撞檢測
- 限制最大速度

### Q: 如何保存最高分?
A: 使用 Love2D 的文件系統:
```lua
-- 保存
love.filesystem.write("highscore.txt", tostring(highscore))

-- 讀取
if love.filesystem.getInfo("highscore.txt") then
    highscore = tonumber(love.filesystem.read("highscore.txt"))
end
```

## 學習資源

### Love2D 官方資源
- [Love2D 官方網站](https://love2d.org/)
- [Love2D Wiki](https://love2d.org/wiki/)
- [Love2D 論壇](https://love2d.org/forums/)

### Lua 學習
- [Lua 官方文檔](https://www.lua.org/manual/5.1/)
- [Learn Lua in 15 Minutes](http://tylerneylon.com/a/learn-lua/)

### 教程和範例
- [Sheepolution's How to LÖVE](https://sheepolution.com/learn/book/contents)
- [Love2D 遊戲開發教程](https://github.com/love2d-community/awesome-love2d)

## 代碼風格

本專案遵循 Lua 編碼規範:
- 使用 4 空格縮進
- 變量名使用 camelCase
- 全局常量使用 UPPER_CASE
- 函數名使用 camelCase
- 添加清晰的註釋

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
**Love2D 版本**: 11.4+
**技術**: Lua + Love2D
