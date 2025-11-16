extends CharacterBody2D
## 玩家角色控制器
## 處理玩家移動、戰鬥和物品使用

# 玩家屬性
@export_group("移動屬性")
@export var speed: float = 200.0  ## 移動速度

@export_group("戰鬥屬性")
@export var max_health: int = 100  ## 最大生命值
@export var attack_damage: int = 10  ## 攻擊傷害
@export var attack_cooldown: float = 0.5  ## 攻擊冷卻時間

# 內部變數
var health: int = max_health
var is_alive: bool = true
var can_attack: bool = true

# 節點引用
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var attack_timer: Timer = $AttackTimer

func _ready():
	"""初始化玩家"""
	# 將自己添加到玩家群組
	add_to_group("player")

	# 初始化生命值
	health = max_health
	update_health_ui()

	# 設定攻擊計時器
	if not attack_timer:
		attack_timer = Timer.new()
		add_child(attack_timer)
		attack_timer.one_shot = true
		attack_timer.timeout.connect(_on_attack_timer_timeout)

func _physics_process(_delta):
	"""物理更新 - 處理移動和輸入"""
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
	if Input.is_action_just_pressed("attack") and can_attack:
		attack()

func update_animation(direction: Vector2):
	"""更新角色動畫和朝向"""
	if direction.length() > 0:
		# 移動動畫
		if animation_player.has_animation("walk"):
			animation_player.play("walk")

		# 翻轉精靈圖
		if direction.x < 0:
			sprite.flip_h = true
		elif direction.x > 0:
			sprite.flip_h = false
	else:
		# 閒置動畫
		if animation_player.has_animation("idle"):
			animation_player.play("idle")

func attack():
	"""執行攻擊"""
	can_attack = false

	# 播放攻擊動畫
	if animation_player.has_animation("attack"):
		animation_player.play("attack")

	# 檢測攻擊範圍內的敵人
	var enemies = get_tree().get_nodes_in_group("enemies")
	for enemy in enemies:
		if global_position.distance_to(enemy.global_position) < 50:
			if enemy.has_method("take_damage"):
				enemy.take_damage(attack_damage)
				print("攻擊敵人，造成 %d 傷害!" % attack_damage)

	# 啟動冷卻計時器
	attack_timer.start(attack_cooldown)

func _on_attack_timer_timeout():
	"""攻擊冷卻結束"""
	can_attack = true

func take_damage(damage: int):
	"""受到傷害"""
	if not is_alive:
		return

	health -= damage
	health = max(health, 0)

	print("玩家受到 %d 傷害！剩餘生命值: %d" % [damage, health])

	# 播放受傷動畫
	if animation_player.has_animation("hurt"):
		animation_player.play("hurt")

	# 更新 UI
	update_health_ui()

	# 檢查死亡
	if health <= 0:
		die()

func heal(amount: int):
	"""恢復生命值"""
	var old_health = health
	health += amount
	health = min(health, max_health)

	var actual_heal = health - old_health
	print("恢復 %d 生命值！" % actual_heal)

	update_health_ui()

func die():
	"""角色死亡"""
	is_alive = false
	print("玩家死亡...")

	# 播放死亡動畫
	if animation_player.has_animation("death"):
		animation_player.play("death")

	# 發送死亡信號
	if GameManager:
		GameManager.player_died.emit()

	# 等待動畫播放完畢後重新開始
	if animation_player:
		await animation_player.animation_finished

	# 重新載入場景
	await get_tree().create_timer(1.0).timeout
	get_tree().reload_current_scene()

func update_health_ui():
	"""更新生命值 UI"""
	if GameManager:
		GameManager.health_changed.emit(health, max_health)

func collect_item(item):
	"""收集物品"""
	if Inventory and Inventory.has_method("add_item"):
		Inventory.add_item(item)
		print("收集到物品: ", item.get("name", "未知物品"))
	else:
		print("收集到物品!")

func _on_area_entered(area: Area2D):
	"""碰撞檢測 - 用於收集物品或觸發事件"""
	if area.is_in_group("collectibles"):
		# 收集物品
		if area.has_method("collect"):
			area.collect()
		else:
			area.queue_free()

		collect_item({"name": "金幣", "value": 10})

	elif area.is_in_group("hazards"):
		# 受到陷阱傷害
		take_damage(10)
