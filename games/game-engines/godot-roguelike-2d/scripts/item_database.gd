## 物品數據庫 - 管理所有遊戲物品
## 使用 Autoload (單例) 模式
extends Node

## 物品庫
var items: Dictionary = {}

## 初始化物品數據庫
func _ready():
	load_items()

## 載入所有物品
func load_items():
	# 清空現有物品
	items.clear()

	# 創建預設物品
	_create_consumables()
	_create_weapons()
	_create_materials()

	print("物品數據庫已載入: %d 個物品" % items.size())

## 創建消耗品
func _create_consumables():
	# 小型生命藥水
	var health_potion_small = ConsumableItem.new()
	health_potion_small.item_id = "potion_health_small"
	health_potion_small.item_name = "小型生命藥水"
	health_potion_small.description = "恢復 30 點生命值"
	health_potion_small.effect_type = ConsumableItem.EffectType.HEAL
	health_potion_small.effect_value = 30
	health_potion_small.value = 10
	health_potion_small.rarity = Item.Rarity.COMMON
	health_potion_small.max_stack = 10
	register_item(health_potion_small)

	# 大型生命藥水
	var health_potion_large = ConsumableItem.new()
	health_potion_large.item_id = "potion_health_large"
	health_potion_large.item_name = "大型生命藥水"
	health_potion_large.description = "恢復 100 點生命值"
	health_potion_large.effect_type = ConsumableItem.EffectType.HEAL
	health_potion_large.effect_value = 100
	health_potion_large.value = 50
	health_potion_large.rarity = Item.Rarity.UNCOMMON
	health_potion_large.max_stack = 5
	register_item(health_potion_large)

	# 力量藥水
	var strength_potion = ConsumableItem.new()
	strength_potion.item_id = "potion_strength"
	strength_potion.item_name = "力量藥水"
	strength_potion.description = "增加 10 點攻擊力，持續 30 秒"
	strength_potion.effect_type = ConsumableItem.EffectType.BUFF_ATTACK
	strength_potion.effect_value = 10
	strength_potion.duration = 30.0
	strength_potion.value = 30
	strength_potion.rarity = Item.Rarity.RARE
	strength_potion.max_stack = 5
	register_item(strength_potion)

	# 傳送卷軸
	var teleport_scroll = ConsumableItem.new()
	teleport_scroll.item_id = "scroll_teleport"
	teleport_scroll.item_name = "傳送卷軸"
	teleport_scroll.description = "立即傳送到安全房間"
	teleport_scroll.effect_type = ConsumableItem.EffectType.TELEPORT
	teleport_scroll.value = 100
	teleport_scroll.rarity = Item.Rarity.EPIC
	teleport_scroll.max_stack = 3
	register_item(teleport_scroll)

## 創建武器 (基礎示例)
func _create_weapons():
	var wooden_sword = Item.new()
	wooden_sword.item_id = "weapon_sword_wooden"
	wooden_sword.item_name = "木劍"
	wooden_sword.description = "普通的木製劍"
	wooden_sword.item_type = Item.ItemType.WEAPON
	wooden_sword.rarity = Item.Rarity.COMMON
	wooden_sword.value = 20
	wooden_sword.max_stack = 1
	wooden_sword.is_equippable = true
	register_item(wooden_sword)

	var iron_sword = Item.new()
	iron_sword.item_id = "weapon_sword_iron"
	iron_sword.item_name = "鐵劍"
	iron_sword.description = "鋒利的鐵製劍"
	iron_sword.item_type = Item.ItemType.WEAPON
	iron_sword.rarity = Item.Rarity.UNCOMMON
	iron_sword.value = 100
	iron_sword.max_stack = 1
	iron_sword.is_equippable = true
	register_item(iron_sword)

## 創建材料
func _create_materials():
	var wood = Item.new()
	wood.item_id = "material_wood"
	wood.item_name = "木材"
	wood.description = "普通的木材，可用於製作"
	wood.item_type = Item.ItemType.MATERIAL
	wood.rarity = Item.Rarity.COMMON
	wood.value = 1
	wood.max_stack = 99
	register_item(wood)

	var iron_ore = Item.new()
	iron_ore.item_id = "material_iron_ore"
	iron_ore.item_name = "鐵礦石"
	iron_ore.description = "珍貴的鐵礦石"
	iron_ore.item_type = Item.ItemType.MATERIAL
	iron_ore.rarity = Item.Rarity.UNCOMMON
	iron_ore.value = 5
	iron_ore.max_stack = 50
	register_item(iron_ore)

	var magic_crystal = Item.new()
	magic_crystal.item_id = "material_magic_crystal"
	magic_crystal.item_name = "魔法水晶"
	magic_crystal.description = "散發神秘光芒的水晶"
	magic_crystal.item_type = Item.ItemType.MATERIAL
	magic_crystal.rarity = Item.Rarity.RARE
	magic_crystal.value = 50
	magic_crystal.max_stack = 20
	register_item(magic_crystal)

## 註冊物品到數據庫
func register_item(item: Item):
	if not item or item.item_id == "":
		push_error("無法註冊物品：缺少 item_id")
		return

	if items.has(item.item_id):
		push_warning("物品已存在：%s" % item.item_id)
		return

	items[item.item_id] = item

## 獲取物品
func get_item(item_id: String) -> Item:
	if items.has(item_id):
		return items[item_id]

	push_warning("物品不存在: %s" % item_id)
	return null

## 獲取所有物品
func get_all_items() -> Array:
	return items.values()

## 按類型獲取物品
func get_items_by_type(type: Item.ItemType) -> Array:
	var result = []
	for item in items.values():
		if item.item_type == type:
			result.append(item)
	return result

## 按稀有度獲取物品
func get_items_by_rarity(rarity: Item.Rarity) -> Array:
	var result = []
	for item in items.values():
		if item.rarity == rarity:
			result.append(item)
	return result

## 創建隨機物品 (用於戰利品)
func create_random_item(level: int = 1) -> Item:
	# 根據等級決定稀有度機率
	var rarity_roll = randf()
	var rarity: Item.Rarity

	if level < 5:
		# 低等級: 主要掉落普通和非凡
		if rarity_roll < 0.7:
			rarity = Item.Rarity.COMMON
		elif rarity_roll < 0.95:
			rarity = Item.Rarity.UNCOMMON
		else:
			rarity = Item.Rarity.RARE
	elif level < 10:
		# 中等級
		if rarity_roll < 0.4:
			rarity = Item.Rarity.COMMON
		elif rarity_roll < 0.7:
			rarity = Item.Rarity.UNCOMMON
		elif rarity_roll < 0.95:
			rarity = Item.Rarity.RARE
		else:
			rarity = Item.Rarity.EPIC
	else:
		# 高等級
		if rarity_roll < 0.2:
			rarity = Item.Rarity.COMMON
		elif rarity_roll < 0.4:
			rarity = Item.Rarity.UNCOMMON
		elif rarity_roll < 0.7:
			rarity = Item.Rarity.RARE
		elif rarity_roll < 0.95:
			rarity = Item.Rarity.EPIC
		else:
			rarity = Item.Rarity.LEGENDARY

	# 從對應稀有度的物品中隨機選擇
	var possible_items = get_items_by_rarity(rarity)

	if possible_items.size() > 0:
		return possible_items[randi() % possible_items.size()]

	# 如果沒有對應稀有度的物品，返回普通物品
	possible_items = get_items_by_rarity(Item.Rarity.COMMON)
	if possible_items.size() > 0:
		return possible_items[randi() % possible_items.size()]

	return null

## 物品是否存在
func has_item(item_id: String) -> bool:
	return items.has(item_id)
