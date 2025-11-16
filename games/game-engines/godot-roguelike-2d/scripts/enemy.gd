extends CharacterBody2D
## 敵人 AI 控制器
## 包含巡邏、追擊和攻擊邏輯

# 敵人屬性
@export_group("移動屬性")
@export var speed: float = 100.0  ## 移動速度
@export var patrol_speed: float = 50.0  ## 巡邏速度

@export_group("戰鬥屬性")
@export var max_health: int = 50  ## 最大生命值
@export var attack_damage: int = 5  ## 攻擊傷害
@export var attack_cooldown: float = 1.0  ## 攻擊冷卻時間

@export_group("AI 設定")
@export var detection_range: float = 200.0  ## 偵測範圍
@export var attack_range: float = 40.0  ## 攻擊範圍
@export var patrol_enabled: bool = true  ## 是否啟用巡邏

# 內部變數
var health: int = max_health
var player: CharacterBody2D = null
var state: String = "idle"  # idle, patrol, chase, attack
var can_attack: bool = true
var patrol_direction: Vector2 = Vector2.RIGHT
var patrol_time: float = 0.0

# 節點引用
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var attack_timer: Timer = $AttackTimer
@onready var detection_area: Area2D = $DetectionArea

func _ready():
	"""初始化敵人"""
	# 將自己添加到敵人群組
	add_to_group("enemies")

	# 尋找玩家
	await get_tree().create_timer(0.1).timeout  # 等待場景載入完成
	player = get_tree().get_first_node_in_group("player")

	# 設定攻擊計時器
	if not attack_timer:
		attack_timer = Timer.new()
		add_child(attack_timer)
		attack_timer.one_shot = true
		attack_timer.timeout.connect(_on_attack_timer_timeout)

	# 隨機巡邏方向
	patrol_direction = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()

func _physics_process(delta):
	"""物理更新 - AI 邏輯"""
	if health <= 0:
		return

	# 更新巡邏計時器
	patrol_time += delta

	# 檢測玩家距離
	update_state()

	# AI 狀態機
	match state:
		"idle":
			idle_behavior()
		"patrol":
			patrol_behavior()
		"chase":
			chase_behavior()
		"attack":
			attack_behavior()

func update_state():
	"""更新 AI 狀態"""
	if not player:
		return

	var distance = global_position.distance_to(player.global_position)

	if distance < attack_range:
		state = "attack"
	elif distance < detection_range:
		state = "chase"
	elif patrol_enabled:
		state = "patrol"
	else:
		state = "idle"

func idle_behavior():
	"""閒置行為"""
	velocity = Vector2.ZERO

	if animation_player and animation_player.has_animation("idle"):
		animation_player.play("idle")

	move_and_slide()

func patrol_behavior():
	"""巡邏行為"""
	# 每隔一段時間改變巡邏方向
	if patrol_time > 3.0:
		patrol_direction = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()
		patrol_time = 0.0

	velocity = patrol_direction * patrol_speed

	# 更新朝向
	if patrol_direction.x < 0:
		sprite.flip_h = true
	elif patrol_direction.x > 0:
		sprite.flip_h = false

	if animation_player and animation_player.has_animation("walk"):
		animation_player.play("walk")

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
	elif direction.x > 0:
		sprite.flip_h = false

	if animation_player and animation_player.has_animation("walk"):
		animation_player.play("walk")

	move_and_slide()

func attack_behavior():
	"""攻擊行為"""
	velocity = Vector2.ZERO

	if animation_player and animation_player.has_animation("attack"):
		animation_player.play("attack")

	# 執行攻擊
	if can_attack and player:
		perform_attack()

	move_and_slide()

func perform_attack():
	"""執行攻擊"""
	can_attack = false

	# 傷害玩家
	if player and player.has_method("take_damage"):
		var distance = global_position.distance_to(player.global_position)
		if distance < attack_range:
			player.take_damage(attack_damage)
			print("敵人攻擊玩家，造成 %d 傷害!" % attack_damage)

	# 啟動冷卻計時器
	attack_timer.start(attack_cooldown)

func _on_attack_timer_timeout():
	"""攻擊冷卻結束"""
	can_attack = true

func take_damage(damage: int):
	"""受到傷害"""
	health -= damage
	health = max(health, 0)

	print("敵人受到 %d 傷害！剩餘生命值: %d" % [damage, health])

	# 播放受傷效果
	if animation_player and animation_player.has_animation("hurt"):
		animation_player.play("hurt")

	# 受擊後切換到追擊狀態
	if player and state == "patrol":
		state = "chase"

	# 檢查死亡
	if health <= 0:
		die()

func die():
	"""敵人死亡"""
	print("敵人被擊敗!")

	# 掉落戰利品
	drop_loot()

	# 播放死亡動畫
	if animation_player and animation_player.has_animation("death"):
		animation_player.play("death")
		await animation_player.animation_finished
	else:
		await get_tree().create_timer(0.5).timeout

	# 移除敵人
	queue_free()

func drop_loot():
	"""掉落戰利品"""
	# 增加分數
	if GameManager and GameManager.has_method("add_score"):
		GameManager.add_score(10)

	# 隨機掉落物品
	var drop_chance = randf()

	if drop_chance < 0.3:  # 30% 機率掉落物品
		spawn_collectible()

func spawn_collectible():
	"""生成收集品"""
	# 這裡可以實例化物品場景
	print("敵人掉落了物品!")
	# 實際實現需要載入物品預製場景
	# var item = preload("res://scenes/Collectible.tscn").instantiate()
	# item.global_position = global_position
	# get_parent().add_child(item)
