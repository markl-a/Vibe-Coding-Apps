# Godot 2D Roguelike 遊戲
🤖 **AI-Driven | AI-Native** 🚀

使用 Godot 引擎開發的 2D Roguelike 遊戲,展示 Godot 在 2D 遊戲開發中的強大能力。

## 📋 專案概述

這是一個經典的 2D Roguelike 遊戲,玩家在程序生成的地牢中探索、戰鬥、收集裝備,每次死亡後重新開始。本專案展示了 Godot 4.x 的核心功能和 GDScript 語言的優勢。

### 遊戲特色

- ✅ 程序生成地牢系統
- ✅ 回合制戰鬥機制
- ✅ 角色屬性與升級系統
- ✅ 裝備與物品系統
- ✅ 敵人 AI 系統
- ✅ 永久死亡機制
- ✅ 精美的像素藝術風格

## 🎮 遊戲玩法

- **移動**: WASD 或 方向鍵
- **攻擊**: 空格鍵 或 滑鼠左鍵
- **使用物品**: E 鍵
- **查看物品欄**: I 鍵
- **目標**: 深入地牢、擊敗敵人、收集寶藏

## 🛠️ 技術棧

### Godot 版本
- **Godot 4.2+** (推薦最新穩定版)
- **Godot 3.x** 也可使用,但需要調整部分 API

### 核心技術

#### 場景與節點系統
- **Scene** - Godot 的場景系統
- **Node2D** - 2D 遊戲基礎節點
- **TileMap** - 地圖瓦片系統
- **Sprite2D** - 精靈圖顯示

#### GDScript
- **類 Python 語法** - 簡單易學
- **類型提示** - 可選的靜態類型
- **信號系統** - 事件驅動架構

#### 物理與碰撞
- **Area2D** - 區域檢測
- **CharacterBody2D** - 角色控制器
- **CollisionShape2D** - 碰撞形狀

## 📁 專案結構

```
godot-roguelike-2d/
├── scenes/
│   ├── MainScene.tscn           # 主場景
│   ├── Player.tscn              # 玩家場景
│   ├── Enemy.tscn               # 敵人場景
│   ├── DungeonRoom.tscn         # 房間場景
│   └── UI/
│       ├── HUD.tscn             # 抬頭顯示
│       └── Inventory.tscn       # 物品欄
├── scripts/
│   ├── player.gd                # 玩家邏輯
│   ├── enemy.gd                 # 敵人邏輯
│   ├── dungeon_generator.gd     # 地牢生成器
│   ├── game_manager.gd          # 遊戲管理器
│   ├── inventory.gd             # 物品欄系統
│   └── item.gd                  # 物品類別
├── sprites/
│   ├── player/                  # 玩家圖片
│   ├── enemies/                 # 敵人圖片
│   ├── items/                   # 物品圖片
│   └── tiles/                   # 地圖瓦片
├── audio/
│   ├── bgm/                     # 背景音樂
│   └── sfx/                     # 音效
├── project.godot                # Godot 專案配置
└── README.md
```

## 🚀 快速開始

### 環境需求

- **Godot Engine 4.2+**
- 任何支援 Godot 的作業系統 (Windows, macOS, Linux)

### 安裝步驟

#### 1. 安裝 Godot

```bash
# Windows
# 從 https://godotengine.org/download 下載 Godot
# 解壓即可使用,無需安裝

# macOS
brew install --cask godot

# Linux
# 下載 AppImage 或使用套件管理器
sudo snap install godot
```

#### 2. 打開專案

```bash
# 啟動 Godot Engine
# 點擊 "Import"
# 選擇專案資料夾中的 project.godot 檔案

# 或使用命令列
godot --path /path/to/godot-roguelike-2d
```

#### 3. 運行遊戲

- 在 Godot 編輯器中按 **F5** 或點擊播放按鈕
- 開始遊戲!

## 💻 核心腳本

### player.gd

玩家角色控制器,處理移動、戰鬥和物品使用。

```gdscript
extends CharacterBody2D

# 玩家屬性
@export var speed: float = 200.0
@export var max_health: int = 100
@export var attack_damage: int = 10

var health: int = max_health
var is_alive: bool = true

# 節點引用
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer

func _ready():
	# 初始化
	health = max_health
	update_health_ui()

func _physics_process(delta):
	if not is_alive:
		return

	# 獲取輸入方向
	var direction = Input.get_vector("move_left", "move_right", "move_up", "move_down")

	# 移動角色
	velocity = direction * speed
	move_and_slide()

	# 更新動畫
	update_animation(direction)

	# 攻擊輸入
	if Input.is_action_just_pressed("attack"):
		attack()

func update_animation(direction: Vector2):
	"""更新角色動畫"""
	if direction.length() > 0:
		animation_player.play("walk")

		# 翻轉精靈圖
		if direction.x < 0:
			sprite.flip_h = true
		elif direction.x > 0:
			sprite.flip_h = false
	else:
		animation_player.play("idle")

func attack():
	"""執行攻擊"""
	animation_player.play("attack")

	# 檢測攻擊範圍內的敵人
	var enemies = get_tree().get_nodes_in_group("enemies")
	for enemy in enemies:
		if global_position.distance_to(enemy.global_position) < 50:
			enemy.take_damage(attack_damage)

func take_damage(damage: int):
	"""受到傷害"""
	if not is_alive:
		return

	health -= damage
	health = max(health, 0)

	# 播放受傷動畫
	animation_player.play("hurt")

	# 更新 UI
	update_health_ui()

	# 檢查死亡
	if health <= 0:
		die()

func heal(amount: int):
	"""恢復生命值"""
	health += amount
	health = min(health, max_health)
	update_health_ui()

func die():
	"""角色死亡"""
	is_alive = false
	animation_player.play("death")

	# 通知遊戲管理器
	GameManager.player_died.emit()

	# 等待動畫播放完畢後重新開始
	await animation_player.animation_finished
	get_tree().reload_current_scene()

func update_health_ui():
	"""更新生命值 UI"""
	# 發送信號給 HUD
	GameManager.health_changed.emit(health, max_health)

func collect_item(item):
	"""收集物品"""
	Inventory.add_item(item)
	print("收集到物品: ", item.name)
```

### enemy.gd

敵人 AI 控制器,包含巡邏和追擊邏輯。

```gdscript
extends CharacterBody2D

# 敵人屬性
@export var speed: float = 100.0
@export var max_health: int = 50
@export var attack_damage: int = 5
@export var detection_range: float = 200.0
@export var attack_range: float = 40.0

var health: int = max_health
var player: CharacterBody2D = null
var state: String = "idle"  # idle, patrol, chase, attack

# 節點引用
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer

func _ready():
	# 將自己添加到敵人群組
	add_to_group("enemies")

	# 尋找玩家
	player = get_tree().get_first_node_in_group("player")

func _physics_process(delta):
	if health <= 0:
		return

	# AI 狀態機
	match state:
		"idle":
			idle_behavior()
		"chase":
			chase_behavior()
		"attack":
			attack_behavior()

	# 檢測玩家距離
	if player:
		var distance = global_position.distance_to(player.global_position)

		if distance < attack_range:
			state = "attack"
		elif distance < detection_range:
			state = "chase"
		else:
			state = "idle"

func idle_behavior():
	"""閒置行為"""
	velocity = Vector2.ZERO
	animation_player.play("idle")
	move_and_slide()

func chase_behavior():
	"""追擊行為"""
	if not player:
		return

	# 朝玩家方向移動
	var direction = (player.global_position - global_position).normalized()
	velocity = direction * speed

	# 更新朝向
	if direction.x < 0:
		sprite.flip_h = true
	else:
		sprite.flip_h = false

	animation_player.play("walk")
	move_and_slide()

func attack_behavior():
	"""攻擊行為"""
	velocity = Vector2.ZERO
	animation_player.play("attack")

	# 在攻擊動畫的特定幀傷害玩家
	if player and animation_player.current_animation_position > 0.3:
		player.take_damage(attack_damage)

func take_damage(damage: int):
	"""受到傷害"""
	health -= damage
	health = max(health, 0)

	# 播放受傷效果
	animation_player.play("hurt")

	# 檢查死亡
	if health <= 0:
		die()

func die():
	"""敵人死亡"""
	# 掉落物品或經驗值
	drop_loot()

	# 播放死亡動畫
	animation_player.play("death")
	await animation_player.animation_finished

	# 移除敵人
	queue_free()

func drop_loot():
	"""掉落戰利品"""
	# 隨機掉落物品
	var drop_chance = randf()

	if drop_chance < 0.3:  # 30% 機率掉落物品
		# 這裡可以實例化物品場景
		print("敵人掉落了物品!")
```

### dungeon_generator.gd

程序生成地牢系統。

```gdscript
extends Node2D

# 地牢生成參數
@export var room_count: int = 10
@export var room_min_size: Vector2 = Vector2(5, 5)
@export var room_max_size: Vector2 = Vector2(12, 12)
@export var map_size: Vector2 = Vector2(100, 100)

# 預製場景
@export var room_scene: PackedScene
@export var corridor_scene: PackedScene

var rooms: Array = []
var tilemap: TileMap

func _ready():
	tilemap = $TileMap
	generate_dungeon()

func generate_dungeon():
	"""生成地牢"""
	rooms.clear()

	# 1. 生成房間
	for i in range(room_count):
		create_random_room()

	# 2. 分離重疊的房間
	separate_rooms()

	# 3. 選擇主要房間
	var main_rooms = select_main_rooms()

	# 4. 連接房間
	connect_rooms(main_rooms)

	# 5. 填充瓦片
	fill_tiles()

	# 6. 生成敵人和物品
	spawn_entities()

	print("地牢生成完成! 房間數: ", main_rooms.size())

func create_random_room():
	"""創建隨機大小的房間"""
	var width = randi_range(room_min_size.x, room_max_size.x)
	var height = randi_range(room_min_size.y, room_max_size.y)
	var x = randi_range(0, map_size.x - width)
	var y = randi_range(0, map_size.y - height)

	var room = {
		"x": x,
		"y": y,
		"width": width,
		"height": height
	}

	rooms.append(room)

func separate_rooms():
	"""分離重疊的房間"""
	var max_iterations = 100
	var iteration = 0

	while iteration < max_iterations:
		var overlapping = false

		for i in range(rooms.size()):
			for j in range(i + 1, rooms.size()):
				if rooms_overlap(rooms[i], rooms[j]):
					# 推開房間
					push_rooms_apart(rooms[i], rooms[j])
					overlapping = true

		if not overlapping:
			break

		iteration += 1

func rooms_overlap(room1: Dictionary, room2: Dictionary) -> bool:
	"""檢查兩個房間是否重疊"""
	return not (room1.x + room1.width < room2.x or
				room2.x + room2.width < room1.x or
				room1.y + room1.height < room2.y or
				room2.y + room2.height < room1.y)

func push_rooms_apart(room1: Dictionary, room2: Dictionary):
	"""推開重疊的房間"""
	var center1 = Vector2(room1.x + room1.width / 2, room1.y + room1.height / 2)
	var center2 = Vector2(room2.x + room2.width / 2, room2.y + room2.height / 2)
	var direction = (center2 - center1).normalized()

	room2.x += int(direction.x * 2)
	room2.y += int(direction.y * 2)

func select_main_rooms() -> Array:
	"""選擇主要房間（足夠大的房間）"""
	var main_rooms = []

	for room in rooms:
		var area = room.width * room.height
		if area >= 30:  # 面積大於 30 的房間
			main_rooms.append(room)

	return main_rooms

func connect_rooms(main_rooms: Array):
	"""連接房間（使用走廊）"""
	for i in range(main_rooms.size() - 1):
		var room1 = main_rooms[i]
		var room2 = main_rooms[i + 1]

		create_corridor(room1, room2)

func create_corridor(room1: Dictionary, room2: Dictionary):
	"""在兩個房間之間創建走廊"""
	var center1 = Vector2(room1.x + room1.width / 2, room1.y + room1.height / 2)
	var center2 = Vector2(room2.x + room2.width / 2, room2.y + room2.height / 2)

	# 使用 L 型走廊連接
	if randf() > 0.5:
		# 先水平再垂直
		draw_horizontal_corridor(center1.x, center2.x, center1.y)
		draw_vertical_corridor(center1.y, center2.y, center2.x)
	else:
		# 先垂直再水平
		draw_vertical_corridor(center1.y, center2.y, center1.x)
		draw_horizontal_corridor(center1.x, center2.x, center2.y)

func draw_horizontal_corridor(x1: float, x2: float, y: float):
	"""繪製水平走廊"""
	var start_x = int(min(x1, x2))
	var end_x = int(max(x1, x2))

	for x in range(start_x, end_x + 1):
		tilemap.set_cell(0, Vector2i(x, int(y)), 0, Vector2i(1, 0))

func draw_vertical_corridor(y1: float, y2: float, x: float):
	"""繪製垂直走廊"""
	var start_y = int(min(y1, y2))
	var end_y = int(max(y1, y2))

	for y in range(start_y, end_y + 1):
		tilemap.set_cell(0, Vector2i(int(x), y), 0, Vector2i(1, 0))

func fill_tiles():
	"""填充房間瓦片"""
	for room in rooms:
		for x in range(room.x, room.x + room.width):
			for y in range(room.y, room.y + room.height):
				# 設定地板瓦片
				tilemap.set_cell(0, Vector2i(x, y), 0, Vector2i(0, 0))

func spawn_entities():
	"""生成敵人和物品"""
	for room in rooms:
		# 隨機決定是否生成敵人
		if randf() < 0.6:  # 60% 機率
			spawn_enemy_in_room(room)

		# 隨機決定是否生成物品
		if randf() < 0.3:  # 30% 機率
			spawn_item_in_room(room)

func spawn_enemy_in_room(room: Dictionary):
	"""在房間中生成敵人"""
	var enemy = preload("res://scenes/Enemy.tscn").instantiate()
	var spawn_x = room.x + randi_range(1, room.width - 1)
	var spawn_y = room.y + randi_range(1, room.height - 1)
	enemy.global_position = Vector2(spawn_x * 16, spawn_y * 16)  # 假設瓦片大小為 16x16
	add_child(enemy)

func spawn_item_in_room(room: Dictionary):
	"""在房間中生成物品"""
	# 實現物品生成邏輯
	print("在房間 ", room, " 生成物品")
```

### game_manager.gd

遊戲狀態管理器（Autoload 單例）。

```gdscript
extends Node

# 信號定義
signal health_changed(current_health, max_health)
signal score_changed(new_score)
signal player_died()

# 遊戲狀態
var score: int = 0
var current_level: int = 1
var is_paused: bool = false

func _ready():
	# 連接玩家死亡信號
	player_died.connect(_on_player_died)

func _input(event):
	# ESC 鍵切換暫停
	if event.is_action_pressed("ui_cancel"):
		toggle_pause()

func add_score(points: int):
	"""增加分數"""
	score += points
	score_changed.emit(score)

func toggle_pause():
	"""切換暫停狀態"""
	is_paused = !is_paused
	get_tree().paused = is_paused

	# 顯示/隱藏暫停選單
	# 這裡需要連接到 UI 系統

func _on_player_died():
	"""玩家死亡處理"""
	print("玩家死亡! 最終分數: ", score)
	# 重置遊戲或顯示遊戲結束畫面
	await get_tree().create_timer(2.0).timeout
	reset_game()

func reset_game():
	"""重置遊戲"""
	score = 0
	current_level = 1
	get_tree().reload_current_scene()

func next_level():
	"""進入下一關"""
	current_level += 1
	get_tree().reload_current_scene()
```

## 🎨 美術資源

### 免費像素藝術資源

- **Kenney Assets** - https://kenney.nl/assets
- **OpenGameArt** - https://opengameart.org/
- **itch.io** - https://itch.io/game-assets/free/tag-pixel-art

### 建議尺寸

- **角色精靈圖**: 16x16 或 32x32 像素
- **地圖瓦片**: 16x16 像素
- **物品圖示**: 16x16 像素

## 🤖 AI 輔助開發

### 1. 功能實現

向 AI 描述需求:
```
"在 Godot GDScript 中實現一個簡單的物品欄系統:
- 固定格子數 (20 格)
- 物品可堆疊
- 拖拽功能
- 使用信號系統"
```

### 2. 問題排查

描述問題:
```
"我的 Godot 敵人 AI 在追擊玩家時會穿牆,
這是我的代碼: [貼上代碼]
請幫我修正這個問題。"
```

## 📚 學習資源

### 官方資源
- [Godot 官方文檔](https://docs.godotengine.org/)
- [GDScript 參考](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/)

### 推薦教學
- **HeartBeast** - YouTube Godot 教程
- **GDQuest** - 高品質 Godot 課程
- **KidsCanCode** - Godot Recipes

## 📄 授權

本專案使用 MIT 授權條款。

---

**🎮 使用 Godot 和 AI 創造你的 Roguelike 遊戲！**

**最後更新**: 2025-11-16
**Godot 版本**: 4.2+
**維護狀態**: ✅ 活躍開發
