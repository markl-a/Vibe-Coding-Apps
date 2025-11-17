extends CanvasLayer

signal start_game


func show_message(text):
	$Message.text = text
	$Message.show()
	$MessageTimer.start()


func show_game_over():
	show_message("遊戲結束")
	# 等待 MessageTimer 倒計時結束
	await $MessageTimer.timeout

	$Message.text = "躲避怪物!"
	$Message.show()
	# 創建一個單次計時器並等待它完成
	await get_tree().create_timer(1.0).timeout
	$StartButton.show()


func update_score(score):
	$ScoreLabel.text = str(score)


func _on_start_button_pressed():
	$StartButton.hide()
	start_game.emit()


func _on_message_timer_timeout():
	$Message.hide()
