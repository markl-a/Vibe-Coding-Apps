extends Node

@export var mob_scene: PackedScene
var score


func _ready():
	pass


func game_over():
	$ScoreTimer.stop()
	$MobTimer.stop()
	$HUD.show_game_over()
	$Music.stop()
	$DeathSound.play()


func new_game():
	score = 0
	$Player.start($StartPosition.position)
	$StartTimer.start()
	$HUD.update_score(score)
	$HUD.show_message("準備好!")
	get_tree().call_group("mobs", "queue_free")
	$Music.play()


func _on_start_timer_timeout():
	$MobTimer.start()
	$ScoreTimer.start()


func _on_score_timer_timeout():
	score += 1
	$HUD.update_score(score)


func _on_mob_timer_timeout():
	# 創建新的怪物實例
	var mob = mob_scene.instantiate()

	# 選擇 Path2D 上的隨機位置
	var mob_spawn_location = $MobPath/MobSpawnLocation
	mob_spawn_location.progress_ratio = randf()

	# 設置怪物的方向垂直於路徑方向
	var direction = mob_spawn_location.rotation + PI / 2

	# 設置怪物的位置在隨機位置
	mob.position = mob_spawn_location.position

	# 添加一些隨機性到方向
	direction += randf_range(-PI / 4, PI / 4)
	mob.rotation = direction

	# 選擇速度
	var velocity = Vector2(randf_range(150.0, 250.0), 0.0)
	mob.linear_velocity = velocity.rotated(direction)

	# 將怪物添加到場景
	add_child(mob)
