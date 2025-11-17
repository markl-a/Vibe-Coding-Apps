# 🏓 Pong 遊戲
🤖 **AI-Driven | AI-Native** 🚀

使用 Pygame 開發的經典 Pong 乒乓球遊戲，支援單人（vs AI）和雙人模式。

## 📋 遊戲特色

- ✅ 經典的 Pong 遊戲玩法
- ✅ 單人模式（對戰 AI）
- ✅ 雙人對戰模式
- ✅ 智能 AI 對手
- ✅ 流暢的物理引擎
- ✅ 計分系統
- ✅ 暫停功能
- ✅ 精美的視覺效果
- ✅ 60 FPS 流暢體驗

## 🎮 遊戲玩法

### 遊戲規則
1. 使用球拍擊打球，防止球從你的一側出界
2. 球從對手一側出界時你得 1 分
3. 先得 5 分的玩家獲勝
4. 球每次被擊中速度會略微增加

### 控制方式

**左邊玩家（藍色）**
- `W` - 向上移動
- `S` - 向下移動

**右邊玩家（紅色）**
- `↑` - 向上移動
- `↓` - 向下移動
- 單人模式下由 AI 控制

**通用控制**
- `空白鍵` - 暫停/繼續
- `ESC` - 返回主菜單
- `1` - 開始單人遊戲
- `2` - 開始雙人遊戲

## 🚀 快速開始

### 環境需求

- **Python** 3.7 或更新版本
- **Pygame** 2.5.0 或更新版本

### 安裝步驟

#### 1. 確認 Python 已安裝

```bash
python --version
# 或
python3 --version
```

#### 2. 安裝依賴

```bash
# 進入專案目錄
cd pong-pygame

# 安裝 Pygame
pip install -r requirements.txt

# 或直接安裝
pip install pygame
```

#### 3. 運行遊戲

```bash
# 運行遊戲
python pong_game.py

# 或
python3 pong_game.py

# 或在 Unix/Linux 系統上
chmod +x pong_game.py
./pong_game.py
```

## 📁 專案結構

```
pong-pygame/
├── pong_game.py        # 主遊戲程式
├── requirements.txt    # Python 依賴
└── README.md          # 說明文件
```

## 💻 技術實現

### 核心技術
- **Pygame** - 遊戲開發庫
- **Python 3** - 程式語言
- **物理模擬** - 碰撞檢測和反彈
- **AI 算法** - 簡單的追蹤 AI

### 主要類別

#### Paddle (球拍類)
```python
class Paddle:
    def __init__(self, x, y, color)  # 初始化
    def move_up(self)                # 向上移動
    def move_down(self)              # 向下移動
    def ai_move(self, ball)          # AI 移動邏輯
    def draw(self, screen)           # 繪製球拍
```

#### Ball (球類)
```python
class Ball:
    def __init__(self)                        # 初始化
    def reset(self)                           # 重置位置
    def update(self, left_paddle, right_paddle)  # 更新位置
    def draw(self, screen)                    # 繪製球
    def is_out_of_bounds(self)                # 檢查出界
```

#### PongGame (遊戲主類)
```python
class PongGame:
    def __init__(self)          # 初始化遊戲
    def handle_events(self)     # 處理事件
    def update(self)            # 更新遊戲狀態
    def draw(self)              # 繪製遊戲
    def run(self)               # 運行遊戲循環
```

### 物理引擎

#### 碰撞檢測
```python
# 與球拍碰撞
if self.rect.colliderect(paddle.rect):
    self.velocity_x = -self.velocity_x
    # 根據擊中位置調整角度
    hit_pos = (self.rect.centery - paddle.rect.centery) / PADDLE_HEIGHT
    self.velocity_y += hit_pos * self.speed * 0.5
```

#### 反彈邏輯
```python
# 與上下邊界碰撞
if self.rect.top <= 0 or self.rect.bottom >= WINDOW_HEIGHT:
    self.velocity_y = -self.velocity_y
```

### AI 實現

AI 使用簡單但有效的追蹤算法：

```python
def ai_move(self, ball):
    # AI 只在球向它移動時才反應
    if ball.velocity_x > 0:
        target_y = ball.rect.centery
        paddle_center = self.rect.centery

        # 添加隨機性使 AI 不完美（85% 準確度）
        if random.random() < 0.85:
            if paddle_center < target_y - 10:
                self.move_down()
            elif paddle_center > target_y + 10:
                self.move_up()
```

## 🎯 遊戲參數調整

你可以在 `pong_game.py` 開頭調整這些常量：

```python
# 視窗大小
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600

# 球拍參數
PADDLE_WIDTH = 15
PADDLE_HEIGHT = 100
PADDLE_SPEED = 6

# 球參數
BALL_SIZE = 15
INITIAL_BALL_SPEED = 5

# 遊戲規則
self.winning_score = 5  # 獲勝所需分數
```

## 🤖 AI 輔助開發建議

### 功能擴展提示詞

#### 1. 改進 AI 難度
```
"為 Pong 遊戲添加 AI 難度選擇：
- 簡單：AI 反應速度慢，準確度 60%
- 中等：AI 反應中等，準確度 85%
- 困難：AI 反應快，準確度 95%，會預測球的軌跡
- 在主菜單添加難度選擇
- 使用不同的移動速度和預測算法"
```

#### 2. 添加音效
```
"為遊戲添加音效系統：
- 球擊中球拍的音效
- 球擊中牆壁的音效
- 得分時的音效
- 遊戲結束的音效
- 使用 pygame.mixer 模組
- 支援音量調節"
```

#### 3. 添加粒子效果
```
"添加視覺粒子效果：
- 球擊中球拍時產生粒子
- 得分時的煙火效果
- 球的拖尾效果
- 使用 Pygame 繪製粒子系統
- 粒子顏色與球拍顏色相同"
```

#### 4. 添加道具系統
```
"實現隨機道具系統：
- 加長球拍道具
- 減速球道具
- 多球道具
- 道具隨機出現在場地中間
- 道具持續時間為 10 秒
- 顯示道具剩餘時間"
```

## 📊 擴展功能建議

### 初級擴展
- [ ] 添加音效和背景音樂
- [ ] 添加多個 AI 難度級別
- [ ] 添加球的拖尾效果
- [ ] 添加更多配色主題

### 中級擴展
- [ ] 道具系統（加長球拍、減速球等）
- [ ] 粒子效果系統
- [ ] 分數統計和歷史記錄
- [ ] 關卡模式（不同的障礙物）

### 高級擴展
- [ ] 線上對戰功能
- [ ] 排行榜系統
- [ ] 錦標賽模式
- [ ] 自訂球拍和球的外觀

## 🔧 常見問題

### Q: 遊戲運行太慢或太快？
**A:** 調整 FPS 常量：
```python
FPS = 60  # 降低這個值會使遊戲變慢
```

### Q: AI 太難或太簡單？
**A:** 調整 AI 準確度：
```python
if random.random() < 0.85:  # 改變這個值（0.0-1.0）
    # AI 反應邏輯
```

### Q: 如何更改獲勝分數？
**A:** 修改 `PongGame` 類中的常量：
```python
self.winning_score = 5  # 改成你想要的分數
```

### Q: 如何更改球拍顏色？
**A:** 在創建 `Paddle` 時傳入不同的顏色：
```python
self.left_paddle = Paddle(30, y, (0, 255, 0))  # RGB 綠色
```

## 📚 學習要點

這個專案展示了以下遊戲開發概念：

1. **遊戲循環**：使用 Pygame 的事件循環和時鐘
2. **碰撞檢測**：矩形碰撞檢測
3. **物理模擬**：速度、加速度、反彈
4. **AI 開發**：簡單的遊戲 AI 算法
5. **狀態管理**：遊戲狀態機（菜單、遊戲中、遊戲結束）
6. **用戶輸入**：鍵盤輸入處理
7. **渲染**：Pygame 圖形繪製

## 🎓 AI 算法說明

### 當前 AI 實現

遊戲使用簡單的追蹤算法：

```
1. 檢查球是否向 AI 的方向移動
2. 如果是，計算球的 Y 座標
3. 移動球拍中心向球的 Y 座標
4. 添加隨機誤差使 AI 不完美
```

**優點**：
- 簡單易懂
- 性能優秀
- 提供合理的挑戰

**缺點**：
- 不會預測球的軌跡
- 在高速時可能反應不及

### 進階 AI 實現建議

可以使用軌跡預測算法：

```python
def predict_ball_position(self, ball):
    """預測球將在何處與 AI 球拍相交"""
    # 模擬球的移動直到到達 AI 的 X 座標
    predicted_y = ball.rect.y
    temp_velocity_y = ball.velocity_y

    # 計算球到達的時間
    distance = self.rect.x - ball.rect.x
    time_to_reach = distance / abs(ball.velocity_x)

    # 預測 Y 座標
    while time_to_reach > 0:
        predicted_y += temp_velocity_y
        # 考慮牆壁反彈
        if predicted_y <= 0 or predicted_y >= WINDOW_HEIGHT:
            temp_velocity_y = -temp_velocity_y
        time_to_reach -= 1

    return predicted_y
```

## 🎨 視覺優化建議

### 添加漸層效果
```python
# 創建漸層球拍
def draw_gradient_paddle(screen, rect, color1, color2):
    for i in range(rect.height):
        ratio = i / rect.height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        pygame.draw.line(screen, (r, g, b),
                        (rect.x, rect.y + i),
                        (rect.x + rect.width, rect.y + i))
```

### 添加球的拖尾效果
```python
class Ball:
    def __init__(self):
        self.trail = []  # 儲存歷史位置

    def update(self):
        self.trail.append(self.rect.center)
        if len(self.trail) > 10:
            self.trail.pop(0)

    def draw(self, screen):
        # 繪製拖尾
        for i, pos in enumerate(self.trail):
            alpha = int(255 * (i / len(self.trail)))
            # 繪製半透明圓形
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

**🏓 享受經典 Pong 遊戲的樂趣！使用 AI 工具可以快速添加新功能！**

**最後更新**: 2025-11-17
**版本**: 1.0.0
**平台**: Windows, macOS, Linux
**維護狀態**: ✅ 活躍開發
