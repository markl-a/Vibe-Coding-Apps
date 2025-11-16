# 貪吃蛇遊戲 (Snake Game)

使用 Python 和 Pygame 開發的經典貪吃蛇遊戲,支援 Windows、macOS 和 Linux 平台。

## 遊戲簡介

貪吃蛇是一款經典的休閒遊戲,玩家控制一條蛇在屏幕上移動,吃食物讓蛇變長,同時避免撞到牆壁或自己。

### 遊戲特色

- 🐍 **經典玩法** - 原汁原味的貪吃蛇體驗
- 🎨 **精美畫面** - 清晰的視覺效果和流暢動畫
- 🎯 **雙類型食物** - 普通食物和特殊食物
- 🏆 **分數系統** - 記錄最高分
- ⏸️ **暫停功能** - 隨時暫停/繼續遊戲
- 🎮 **雙控制方式** - 方向鍵或 WASD 控制
- 📊 **即時統計** - 顯示分數、長度等信息
- 🖥️ **跨平台** - 支援 Windows、macOS、Linux

## 遊戲規則

1. 使用方向鍵或 WASD 控制蛇的移動
2. 吃到紅色食物得 10 分,蛇身長度 +1
3. 吃到黃色特殊食物得 50 分,蛇身長度 +1
4. 撞到牆壁或自己身體會遊戲結束
5. 盡可能獲得更高分數

## 操作說明

### 移動控制
- **方向鍵** - ↑↓←→ 控制蛇的方向
- **WASD** - W/A/S/D 控制蛇的方向

### 遊戲控制
- **P 鍵** - 暫停/繼續遊戲
- **空白鍵** - 遊戲結束後重新開始
- **ESC 鍵** - 退出遊戲

## 技術棧

- **語言**: Python 3.7+
- **遊戲引擎**: Pygame 2.5.0+
- **架構**: 面向對象設計
- **資料結構**: deque (雙端隊列)

## 快速開始

### 環境需求

- Python 3.7 或更高版本
- pip (Python 套件管理器)

### 安裝依賴

```bash
pip install -r requirements.txt
```

或直接安裝 Pygame:

```bash
pip install pygame
```

### 運行遊戲

```bash
python snake_game.py
```

或在 Unix/Linux/macOS 上:

```bash
chmod +x snake_game.py
./snake_game.py
```

## 專案結構

```
snake-pygame/
├── snake_game.py       # 遊戲主程序
├── requirements.txt    # Python 依賴
└── README.md          # 說明文檔
```

## 遊戲架構

### 類設計

#### Direction 枚舉
定義四個移動方向:
- UP: 向上
- DOWN: 向下
- LEFT: 向左
- RIGHT: 向右

#### Snake 類
蛇的邏輯:
```python
class Snake:
    - body: deque         # 蛇身(頭在前,尾在後)
    - direction: Direction # 當前方向
    - next_direction: Direction # 下一個方向(防止快速轉向)
    - grow_pending: int   # 待生長長度

    方法:
    - reset()            # 重置蛇
    - move()             # 移動蛇
    - grow()             # 生長
    - change_direction() # 改變方向(防反向)
    - check_collision()  # 碰撞檢測
```

#### Food 類
食物邏輯:
```python
class Food:
    - position: tuple    # 食物位置
    - type: str         # 食物類型(normal/special)

    方法:
    - spawn()           # 生成食物(避開蛇身)
    - get_value()       # 獲取分數
    - get_color()       # 獲取顏色
```

#### Game 類
遊戲主邏輯:
```python
class Game:
    - snake: Snake      # 蛇對象
    - food: Food        # 食物對象
    - score: int        # 當前分數
    - high_score: int   # 最高分
    - game_over: bool   # 遊戲結束標誌
    - paused: bool      # 暫停標誌

    方法:
    - handle_events()   # 處理輸入
    - update()          # 更新遊戲邏輯
    - draw()            # 繪製畫面
    - run()             # 主循環
```

## 遊戲配置

在 `snake_game.py` 中可以調整以下參數:

### 窗口設置
```python
WINDOW_WIDTH = 800      # 窗口寬度
WINDOW_HEIGHT = 600     # 窗口高度
GRID_SIZE = 20         # 格子大小
```

### 遊戲速度
```python
FPS = 10               # 每秒幀數(越高越快)
```

### 顏色設置
```python
# 可自訂所有顏色
GREEN = (46, 204, 113)  # 蛇身顏色
BLUE = (52, 152, 219)   # 蛇頭顏色
RED = (231, 76, 60)     # 普通食物
YELLOW = (241, 196, 15) # 特殊食物
```

### 遊戲難度
```python
# 調整特殊食物出現機率
self.type = 'special' if random.random() < 0.1 else 'normal'
# 0.1 = 10% 機率,可調整為 0.2(20%)、0.05(5%) 等
```

## 擴展功能建議

想要擴展這個遊戲?以下是一些建議:

- 🎵 **音效音樂** - 添加背景音樂和吃食物音效
- 🏆 **多種遊戲模式** - 無限模式、計時模式、挑戰模式
- 🚧 **障礙物** - 地圖上添加障礙物
- 🎁 **道具系統** - 減速、加速、無敵等道具
- 📊 **排行榜** - 保存歷史最高分
- 🎨 **主題系統** - 多種視覺主題切換
- 🎮 **手柄支援** - 支援遊戲手柄
- 👥 **多人模式** - 雙人對戰
- 🗺️ **關卡設計** - 預設地圖和障礙
- 💾 **存檔功能** - 保存和載入遊戲進度
- 📱 **觸控支援** - 觸控屏操作
- 🌐 **在線排行榜** - 全球玩家分數比較

## 性能優化

### 使用 deque 提升性能
```python
from collections import deque

# deque 的 appendleft() 和 pop() 操作是 O(1)
# 比 list 的 insert(0) 和 pop(0) 快得多
self.body = deque([...])
```

### 碰撞檢測優化
```python
# 只檢查頭部位置,不遍歷整個地圖
if head in list(body)[1:]:
    collision = True
```

### 繪製優化
```python
# 使用 pygame.draw 直接繪製幾何圖形
# 比載入圖片更快
pygame.draw.rect(screen, color, rect)
```

## 常見問題

### Q: 如何調整遊戲速度?
A: 修改 `FPS` 常量,值越大速度越快。推薦範圍 5-15。

### Q: 如何改變窗口大小?
A: 修改 `WINDOW_WIDTH` 和 `WINDOW_HEIGHT`,同時調整 `GRID_SIZE` 以保持合適的格子數量。

### Q: 遊戲太難/太簡單怎麼辦?
A: 調整 `FPS` 改變速度,或修改特殊食物機率改變得分難度。

### Q: 如何添加音效?
A: 使用 Pygame 的音頻功能:
```python
# 加載音效
eat_sound = pygame.mixer.Sound('eat.wav')
# 播放
eat_sound.play()
```

### Q: 如何保存最高分?
A: 可以使用文件或 pickle 模組保存:
```python
import pickle

# 保存
with open('highscore.dat', 'wb') as f:
    pickle.dump(high_score, f)

# 載入
with open('highscore.dat', 'rb') as f:
    high_score = pickle.load(f)
```

## 打包發布

### 使用 PyInstaller 打包成可執行文件

安裝 PyInstaller:
```bash
pip install pyinstaller
```

打包遊戲:
```bash
# Windows
pyinstaller --onefile --windowed snake_game.py

# macOS/Linux
pyinstaller --onefile --windowed --name SnakeGame snake_game.py
```

打包後的文件在 `dist` 目錄中。

### 打包選項說明
- `--onefile`: 打包成單個文件
- `--windowed`: 不顯示控制台窗口
- `--name`: 指定輸出文件名
- `--icon`: 添加圖標 (需要 .ico 文件)

## 學習資源

### Pygame 官方資源
- [Pygame 官方文檔](https://www.pygame.org/docs/)
- [Pygame 教程](https://www.pygame.org/wiki/tutorials)
- [Pygame 範例](https://github.com/pygame/pygame/tree/main/examples)

### Python 遊戲開發
- [Real Python - PyGame Tutorial](https://realpython.com/pygame-a-primer/)
- [Pygame Zero](https://pygame-zero.readthedocs.io/) - 更簡單的遊戲框架

### 遊戲設計理論
- 難度曲線設計
- 遊戲平衡性
- 玩家反饋機制

## 代碼風格

本專案遵循 PEP 8 Python 代碼風格指南:
- 使用 4 空格縮進
- 類名使用 PascalCase
- 函數名使用 snake_case
- 常量使用 UPPER_CASE
- 完整的文檔字符串

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
**Python 版本**: 3.7+
**技術**: Python + Pygame
