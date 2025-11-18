## 消耗品物品類
extends Item
class_name ConsumableItem

## 消耗品效果類型
enum EffectType {
	HEAL,           # 恢復生命
	RESTORE_MANA,   # 恢復魔力
	BUFF_ATTACK,    # 增加攻擊力
	BUFF_DEFENSE,   # 增加防禦力
	BUFF_SPEED,     # 增加速度
	CURE_POISON,    # 解毒
	TELEPORT        # 傳送
}

## 效果屬性
@export var effect_type: EffectType = EffectType.HEAL
@export var effect_value: float = 0.0
@export var duration: float = 0.0  # 持續時間 (0 = 即時效果)

## 音效
@export var use_sound: AudioStream

func _init():
	item_type = ItemType.CONSUMABLE
	is_usable = true
	is_equippable = false

## 使用消耗品
func use(target) -> bool:
	if not target:
		return false

	match effect_type:
		EffectType.HEAL:
			if target.has_method("heal"):
				target.heal(effect_value)
				return true

		EffectType.RESTORE_MANA:
			if target.has_method("restore_mana"):
				target.restore_mana(effect_value)
				return true

		EffectType.BUFF_ATTACK:
			if target.has_method("add_buff"):
				target.add_buff("attack", effect_value, duration)
				return true

		EffectType.BUFF_DEFENSE:
			if target.has_method("add_buff"):
				target.add_buff("defense", effect_value, duration)
				return true

		EffectType.BUFF_SPEED:
			if target.has_method("add_buff"):
				target.add_buff("speed", effect_value, duration)
				return true

		EffectType.CURE_POISON:
			if target.has_method("remove_status"):
				target.remove_status("poison")
				return true

		EffectType.TELEPORT:
			# 傳送邏輯
			if target.has_method("teleport_to_safe_room"):
				target.teleport_to_safe_room()
				return true

	return false

## 獲取物品信息
func get_info_text() -> String:
	var info = super.get_info_text()

	match effect_type:
		EffectType.HEAL:
			info += "\n效果: 恢復 %.0f 生命值" % effect_value
		EffectType.RESTORE_MANA:
			info += "\n效果: 恢復 %.0f 魔力" % effect_value
		EffectType.BUFF_ATTACK:
			info += "\n效果: 增加 %.0f 攻擊力" % effect_value
			if duration > 0:
				info += " (持續 %.1f 秒)" % duration
		EffectType.BUFF_DEFENSE:
			info += "\n效果: 增加 %.0f 防禦力" % effect_value
			if duration > 0:
				info += " (持續 %.1f 秒)" % duration
		EffectType.BUFF_SPEED:
			info += "\n效果: 增加 %.0f%% 移動速度" % (effect_value * 100)
			if duration > 0:
				info += " (持續 %.1f 秒)" % duration
		EffectType.CURE_POISON:
			info += "\n效果: 解除中毒狀態"
		EffectType.TELEPORT:
			info += "\n效果: 傳送到安全房間"

	return info
