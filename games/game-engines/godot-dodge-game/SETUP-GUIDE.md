# Godot Dodge 遊戲完整設置指南
🎮 **Step-by-Step Tutorial** 🚀

本指南將帶你從零開始創建完整的 Dodge 遊戲場景。

## 📋 目錄

- [專案設置](#專案設置)
- [場景創建](#場景創建)
- [詳細配置](#詳細配置)
- [測試與調整](#測試與調整)
- [常見問題](#常見問題)

---

## 🚀 專案設置

### 步驟 1: 創建新專案

1. 啟動 Godot Engine 4.2+
2. 點擊 "New Project"
3. 填寫專案資訊:
   - Project Name: `DodgeGame`
   - Project Path: 選擇你的目錄
   - Renderer: `Forward+` (或 `Mobile` 如果在移動設備上)
4. 點擊 "Create & Edit"

### 步驟 2: 專案設置

進入 `Project > Project Settings`

#### 顯示設置
```
Display > Window
├─ Size > Viewport Width: 480
├─ Size > Viewport Height: 720
├─ Stretch > Mode: viewport
└─ Stretch > Aspect: keep
```

#### 輸入映射
```
Input Map > 添加以下動作:

move_right
├─ Key: D
├─ Key: Right Arrow
└─ (可選) 手把: D-pad Right

move_left
├─ Key: A
├─ Key: Left Arrow
└─ (可選) 手把: D-pad Left

move_down
├─ Key: S
├─ Key: Down Arrow
└─ (可選) 手把: D-pad Down

move_up
├─ Key: W
├─ Key: Up Arrow
└─ (可選) 手把: D-pad Up

start_game
├─ Key: Space
└─ Key: Enter
```

---

## 🎨 場景創建

### 場景 1: Player 場景

#### 創建步驟

1. 點擊 "Scene" > "New Scene"
2. 選擇 "Other Node" 並搜索 `Area2D`
3. 重命名為 `Player`

#### 節點結構

```
Player (Area2D)
├─ AnimatedSprite2D
└─ CollisionShape2D
```

#### 詳細配置

**Player (Area2D):**
```
Node 標籤:
└─ Name: Player

Inspector:
└─ Collision > Layer: 1
└─ Collision > Mask: 2
```

**AnimatedSprite2D:**
```
1. 在 Scene 面板右鍵 Player > Add Child Node
2. 搜索並添加 "AnimatedSprite2D"

Inspector:
└─ Animation > Frames: [創建新 SpriteFrames]

點擊 SpriteFrames 進入編輯器:
1. 創建動畫 "walk"
2. 添加精靈圖幀（至少2幀形成動畫）
3. 設置 FPS: 5
4. 勾選 "Playing"
```

**CollisionShape2D:**
```
1. 添加 CollisionShape2D 子節點

Inspector:
└─ Shape: [New CapsuleShape2D]
   ├─ Radius: 27
   └─ Height: 47
```

#### 附加腳本

右鍵 Player 節點 > "Attach Script"
- 路徑: `res://scripts/Player.gd`
- 模板: Empty
- 粘貼 `scripts/Player.gd` 的內容

#### 保存場景

`Scene` > `Save Scene As...` > `res://Player.tscn`

---

### 場景 2: Mob 場景

#### 創建步驟

1. "Scene" > "New Scene"
2. 選擇 `RigidBody2D`
3. 重命名為 `Mob`

#### 節點結構

```
Mob (RigidBody2D)
├─ AnimatedSprite2D
├─ CollisionShape2D
└─ VisibleOnScreenNotifier2D
```

#### 詳細配置

**Mob (RigidBody2D):**
```
Inspector:
├─ Gravity Scale: 0
├─ Collision > Layer: 2
└─ Collision > Mask: 0
```

**AnimatedSprite2D:**
```
Animation > Frames:
1. 創建動畫: "fly", "swim", "walk"
2. 每個動畫添加 2-4 幀
3. FPS: 3-5
```

**CollisionShape2D:**
```
Shape: [New CapsuleShape2D]
├─ Radius: 30
└─ Height: 40

Note: 記得啟用 "Disabled" 初始為 false
```

**VisibleOnScreenNotifier2D:**
```
Transform > Scale: (1, 1)

用途: 檢測怪物是否離開螢幕
```

#### 附加腳本

附加 `res://scripts/Mob.gd`

#### 保存場景

`res://Mob.tscn`

---

### 場景 3: HUD 場景

#### 創建步驟

1. "Scene" > "New Scene"
2. 選擇 `CanvasLayer`
3. 重命名為 `HUD`

#### 節點結構

```
HUD (CanvasLayer)
├─ ScoreLabel (Label)
├─ Message (Label)
├─ StartButton (Button)
└─ MessageTimer (Timer)
```

#### 詳細配置

**HUD (CanvasLayer):**
```
Inspector:
└─ Layer: 1
```

**ScoreLabel (Label):**
```
添加 Label 節點

Layout:
├─ Anchors Preset: Top Wide
└─ Offset:
    ├─ Left: 0
    ├─ Top: 0
    ├─ Right: 0
    └─ Bottom: 78

Control > Text:
└─ Text: "0"

Theme Overrides > Font Sizes:
└─ Font Size: 64

Theme Overrides > Colors:
└─ Font Color: #000000 (黑色)

Horizontal Alignment: Center
```

**Message (Label):**
```
Layout:
├─ Anchors Preset: Center
└─ Offset (調整使其居中):
    ├─ Left: -240
    ├─ Top: -150
    ├─ Right: 240
    └─ Bottom: 150

Control:
├─ Text: "Dodge the\nCreeps!"
└─ Horizontal Alignment: Center
└─ Vertical Alignment: Center

Theme Overrides:
├─ Font Size: 64
└─ Font Color: #FFFFFF (白色)
```

**StartButton (Button):**
```
Layout:
├─ Anchors Preset: Center Bottom
└─ Offset:
    ├─ Left: -100
    ├─ Top: -140
    ├─ Right: 100
    └─ Bottom: -40

Control:
└─ Text: "Start"

Theme Overrides:
└─ Font Size: 32
```

**MessageTimer (Timer):**
```
Inspector:
├─ Wait Time: 2.0
└─ One Shot: true (勾選)
```

#### 附加腳本

附加 `res://scripts/HUD.gd`

#### 保存場景

`res://HUD.tscn`

---

### 場景 4: Main 場景

#### 創建步驟

1. "Scene" > "New Scene"
2. 選擇 `Node`
3. 重命名為 `Main`

#### 節點結構

```
Main (Node)
├─ Player
├─ MobTimer (Timer)
├─ ScoreTimer (Timer)
├─ StartTimer (Timer)
├─ StartPosition (Marker2D)
├─ MobPath (Path2D)
│   └─ MobSpawnLocation (PathFollow2D)
├─ HUD
├─ Music (AudioStreamPlayer)
└─ DeathSound (AudioStreamPlayer)
```

#### 詳細配置

**Main (Node):**
```
Scene > Instantiate Child Scene:
└─ 選擇 Player.tscn
```

**MobTimer (Timer):**
```
添加 Timer 節點

Inspector:
├─ Wait Time: 0.5
└─ Autostart: false
```

**ScoreTimer (Timer):**
```
Inspector:
├─ Wait Time: 1.0
└─ Autostart: false
```

**StartTimer (Timer):**
```
Inspector:
├─ Wait Time: 2.0
└─ One Shot: true
```

**StartPosition (Marker2D):**
```
添加 Marker2D 節點

Transform:
└─ Position: (240, 450)

用途: 玩家起始位置
```

**MobPath (Path2D):**
```
添加 Path2D 節點

繪製路徑:
1. 選中 MobPath 節點
2. 在上方工具欄點擊 "Add Point"
3. 繪製一個包圍遊戲區域的矩形路徑
4. 建議路徑稍微超出螢幕邊界

推薦座標 (順時針):
├─ Point 0: (0, 0)
├─ Point 1: (480, 0)
├─ Point 2: (480, 720)
├─ Point 3: (0, 720)
└─ 閉合路徑

Inspector:
└─ Curve > Closed: true (勾選)
```

**MobSpawnLocation (PathFollow2D):**
```
右鍵 MobPath > Add Child Node > PathFollow2D

重命名為: MobSpawnLocation

用途: 在路徑上隨機選擇怪物生成位置
```

**HUD:**
```
Scene > Instantiate Child Scene:
└─ 選擇 HUD.tscn
```

**Music (AudioStreamPlayer):**
```
添加 AudioStreamPlayer 節點

Inspector:
└─ Stream: [選擇你的背景音樂檔案]
└─ Autoplay: false

(音樂檔案格式: .ogg, .mp3, .wav)
```

**DeathSound (AudioStreamPlayer):**
```
添加另一個 AudioStreamPlayer

Inspector:
└─ Stream: [選擇死亡音效]
└─ Autoplay: false
```

#### 連接信號

選中 Main 節點，點擊 "Node" 標籤查看信號。

**HUD 信號連接:**
```
選中 HUD 節點 > Node 標籤 > Signals

start_game (自定義信號，在 HUD.gd 中定義)
└─ 連接到 Main 節點的 _on_start_game() 方法
```

**Player 信號連接:**
```
選中 Player 節點 > Node 標籤 > Signals

hit (自定義信號，在 Player.gd 中定義)
└─ 連接到 Main 節點的 _on_player_hit() 方法
```

**Timer 信號連接:**
```
MobTimer > timeout
└─ 連接到: Main._on_mob_timer_timeout()

ScoreTimer > timeout
└─ 連接到: Main._on_score_timer_timeout()

StartTimer > timeout
└─ 連接到: Main._on_start_timer_timeout()
```

**MessageTimer (在 HUD 中) 信號:**
```
選中 HUD > MessageTimer > timeout
└─ 連接到: HUD._on_message_timer_timeout()
```

**StartButton 信號:**
```
選中 HUD > StartButton > pressed
└─ 連接到: HUD._on_start_button_pressed()
```

**Mob 信號 (將在生成時連接):**
```
在 Main.gd 的 _on_mob_timer_timeout() 中:

var mob = mob_scene.instantiate()
# ... 設置 mob
mob.get_node("VisibleOnScreenNotifier2D").screen_exited.connect(mob.queue_free)
```

#### 附加腳本

附加 `res://scripts/Main.gd`

#### 設置場景屬性

在 Main.gd 的 `@export` 變數中設置:

```gdscript
@export var mob_scene: PackedScene

# 在 Inspector 中拖入 Mob.tscn
```

#### 保存並設為主場景

1. `Scene` > `Save Scene As...` > `res://Main.tscn`
2. `Project` > `Project Settings` > `Application` > `Run`
3. `Main Scene`: 設置為 `res://Main.tscn`

---

## 🎯 詳細配置

### 碰撞層級設置

Godot 使用碰撞層 (Layer) 和碰撞遮罩 (Mask) 來控制物體間的交互。

```
Layer 1: 玩家
Layer 2: 敵人
```

**Player (Area2D):**
- Collision Layer: 1 (玩家在第 1 層)
- Collision Mask: 2 (檢測第 2 層的敵人)

**Mob (RigidBody2D):**
- Collision Layer: 2 (敵人在第 2 層)
- Collision Mask: 0 (敵人不檢測任何層)

這樣設置後:
- 玩家能檢測到敵人
- 敵人不會互相碰撞
- 敵人不檢測玩家（避免推動玩家)

### 動畫設置

#### 創建 SpriteFrames

1. 選中 AnimatedSprite2D 節點
2. Inspector > Animation > Frames > [New SpriteFrames]
3. 點擊 SpriteFrames 打開編輯器

#### 添加動畫幀

**如果沒有美術資源:**
```
1. 使用純色矩形代替:
   - FileSystem > 右鍵 > "Create New" > "Resource"
   - 選擇 "ImageTexture"
   - 使用 Godot 內建的圖標作為臨時素材

2. 或下載免費素材:
   - Kenney.nl
   - OpenGameArt.org
   - itch.io
```

**添加動畫:**
```
在 SpriteFrames 編輯器:
1. 點擊 "Add Animation" 按鈕
2. 命名動畫 (如 "walk")
3. 從 FileSystem 拖動圖片到動畫幀列表
4. 設置 FPS (5-10 比較合適)
5. 勾選 "Autoplay on Load" (可選)
```

### 音效設置

#### 導入音頻

```
1. 將音頻檔案拖入 FileSystem
2. 支援格式:
   - .ogg (推薦，體積小)
   - .mp3
   - .wav

3. 選中音頻檔案 > Import 標籤
   - Loop: 背景音樂勾選
   - Import as: 保持默認
```

#### 使用音效

```gdscript
# 在腳本中播放
$Music.play()
$DeathSound.play()

# 設置音量
$Music.volume_db = -10  # 降低 10dB
```

---

## 🧪 測試與調整

### 基本測試

1. **按 F5 運行遊戲**
2. **測試檢查清單:**

```
□ 玩家能正常移動
□ 玩家不能移出螢幕邊界
□ 怪物從邊緣生成
□ 怪物朝隨機方向移動
□ 碰到怪物時玩家消失
□ 分數正常增加
□ 開始按鈕正常工作
□ 音效播放正常
```

### 性能調整

#### 怪物生成速度

```gdscript
# Main.gd
func _on_mob_timer_timeout():
    # 調整怪物生成間隔
    $MobTimer.wait_time = 0.5  # 越小怪物越多
```

#### 怪物速度

```gdscript
# Main.gd
func _on_mob_timer_timeout():
    # ...
    var velocity = Vector2(randf_range(150.0, 250.0), 0.0)
    # 調整數值: 150-250 之間
```

#### 玩家速度

```gdscript
# Player.gd
@export var speed = 400  # 調整這個值
```

### 難度調整

**簡單模式:**
```
- 怪物生成間隔: 0.8 秒
- 怪物速度: 100-150
- 玩家速度: 500
```

**困難模式:**
```
- 怪物生成間隔: 0.3 秒
- 怪物速度: 200-300
- 玩家速度: 350
```

**漸進難度:**
```gdscript
# Main.gd
var difficulty = 1.0

func _on_score_timer_timeout():
    score += 1
    $HUD.update_score(score)

    # 每 10 分增加難度
    if score % 10 == 0:
        difficulty += 0.1
        $MobTimer.wait_time = max(0.2, 0.5 / difficulty)
```

---

## 🐛 常見問題

### Q: 遊戲啟動後沒有怪物生成

**A:** 檢查以下幾點:
```
1. MobTimer 的 timeout 信號是否連接到 Main
2. Main.gd 中 mob_scene 是否在 Inspector 中設置
3. MobPath 路徑是否繪製且閉合
4. 查看 Output 面板是否有錯誤訊息
```

### Q: 玩家和怪物沒有碰撞檢測

**A:** 檢查碰撞設置:
```
1. Player 的 CollisionShape2D 是否有 Shape
2. Mob 的 CollisionShape2D 是否有 Shape
3. 碰撞層級設置是否正確:
   - Player: Layer 1, Mask 2
   - Mob: Layer 2, Mask 0
4. Player 的 hit 信號是否觸發
```

### Q: 動畫不播放

**A:** 檢查:
```
1. AnimatedSprite2D 的 SpriteFrames 是否設置
2. 動畫名稱是否正確 (Player.gd 中的 "walk")
3. Animation > Playing 是否勾選
4. 動畫是否有足夠的幀
```

### Q: 怪物離開螢幕後不消失

**A:** 檢查:
```
1. Mob 是否有 VisibleOnScreenNotifier2D 子節點
2. screen_exited 信號是否連接
3. 在 Main._on_mob_timer_timeout() 中:
   mob.get_node("VisibleOnScreenNotifier2D").screen_exited.connect(mob.queue_free)
```

### Q: 分數不增加

**A:** 檢查:
```
1. ScoreTimer 的 timeout 信號是否連接
2. HUD 是否實例化在 Main 場景中
3. HUD.update_score() 方法是否存在
4. ScoreLabel 節點名稱是否正確
```

### Q: 開始按鈕不工作

**A:** 檢查:
```
1. StartButton 的 pressed 信號是否連接到 HUD
2. HUD 是否發出 start_game 信號
3. Main 是否連接 HUD 的 start_game 信號
```

### Q: 音效不播放

**A:** 檢查:
```
1. 音頻檔案是否正確導入
2. AudioStreamPlayer 的 Stream 是否設置
3. 音量是否太小 (volume_db)
4. 是否呼叫了 .play() 方法
```

---

## 🎨 進階功能

### 添加粒子效果

```gdscript
# Player.gd
@onready var particles = $GPUParticles2D

func start():
    # ...
    particles.emitting = true
```

### 添加背景

```
Main 場景:
├─ ParallaxBackground
│   ├─ ParallaxLayer (遠景)
│   │   └─ Sprite2D
│   └─ ParallaxLayer (近景)
│       └─ Sprite2D
```

### 添加道具系統

```
創建 PowerUp.tscn (Area2D)
├─ Sprite2D
└─ CollisionShape2D

在 Main.gd 中隨機生成道具
玩家碰到道具時獲得特殊能力
```

---

## 📚 學習資源

### 官方教程
- [Godot 官方文檔](https://docs.godotengine.org/)
- [Your First 2D Game](https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html)

### 視頻教程
- [GDQuest](https://www.gdquest.com/)
- [HeartBeast](https://www.youtube.com/user/uheartbeast)
- [Brackeys (Godot 系列)](https://www.youtube.com/user/Brackeys)

### 美術資源
- [Kenney.nl](https://kenney.nl/assets) - 免費遊戲素材
- [OpenGameArt.org](https://opengameart.org/)
- [itch.io](https://itch.io/game-assets/free)

---

## 🎉 完成!

恭喜! 你已經完成了 Dodge 遊戲的完整設置。

**下一步:**
- 添加更多敵人類型
- 創建難度等級
- 添加高分系統
- 發布你的遊戲!

**🎮 享受遊戲開發的樂趣！**

---

**最後更新**: 2025-11-18
**Godot 版本**: 4.2+
**難度**: 初級
