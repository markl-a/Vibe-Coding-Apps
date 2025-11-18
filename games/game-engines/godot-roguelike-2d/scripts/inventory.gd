## 物品欄系統
## 管理玩家的物品收集和使用
extends Node
class_name Inventory

## 信號
signal item_added(item: Item, amount: int)
signal item_removed(item: Item, amount: int)
signal item_used(item: Item)
signal inventory_full()
signal inventory_changed()

## 物品欄大小
@export var max_slots: int = 20

## 物品存儲
## 格式: { "item_id": { "item": Item, "amount": int } }
var items: Dictionary = {}

## 裝備欄 (可選)
var equipped_weapon: Item = null
var equipped_armor: Item = null

## 添加物品
func add_item(item: Item, amount: int = 1) -> bool:
	if not item:
		return false

	var item_id = item.item_id

	# 檢查是否可堆疊
	if items.has(item_id):
		# 已存在，增加數量
		var current_amount = items[item_id]["amount"]

		# 檢查堆疊上限
		if item.max_stack > 0 and current_amount + amount > item.max_stack:
			# 超過堆疊上限，計算可添加數量
			var can_add = item.max_stack - current_amount
			if can_add <= 0:
				inventory_full.emit()
				return false

			items[item_id]["amount"] = item.max_stack
			amount = can_add
		else:
			items[item_id]["amount"] += amount

		item_added.emit(item, amount)
		inventory_changed.emit()
		return true
	else:
		# 新物品，檢查空間
		if items.size() >= max_slots:
			inventory_full.emit()
			return false

		items[item_id] = {
			"item": item,
			"amount": amount
		}

		item_added.emit(item, amount)
		inventory_changed.emit()
		return true

## 移除物品
func remove_item(item_id: String, amount: int = 1) -> bool:
	if not items.has(item_id):
		return false

	var current_amount = items[item_id]["amount"]

	if current_amount < amount:
		return false

	items[item_id]["amount"] -= amount

	if items[item_id]["amount"] <= 0:
		var item = items[item_id]["item"]
		items.erase(item_id)
		item_removed.emit(item, amount)
	else:
		item_removed.emit(items[item_id]["item"], amount)

	inventory_changed.emit()
	return true

## 使用物品
func use_item(item_id: String, target = null) -> bool:
	if not items.has(item_id):
		return false

	var item_data = items[item_id]
	var item: Item = item_data["item"]

	if not item.is_usable:
		return false

	# 嘗試使用物品
	var success = item.use(target)

	if success:
		item_used.emit(item)

		# 消耗品使用後移除
		if item.item_type == Item.ItemType.CONSUMABLE:
			remove_item(item_id, 1)

		return true

	return false

## 獲取物品數量
func get_item_amount(item_id: String) -> int:
	if items.has(item_id):
		return items[item_id]["amount"]
	return 0

## 檢查是否有物品
func has_item(item_id: String, amount: int = 1) -> bool:
	return get_item_amount(item_id) >= amount

## 獲取所有物品
func get_all_items() -> Array:
	var result = []
	for item_id in items:
		result.append(items[item_id])
	return result

## 裝備物品
func equip_item(item_id: String) -> bool:
	if not items.has(item_id):
		return false

	var item: Item = items[item_id]["item"]

	if not item.is_equippable:
		return false

	match item.item_type:
		Item.ItemType.WEAPON:
			# 卸下當前武器
			if equipped_weapon:
				unequip_weapon()
			equipped_weapon = item
			inventory_changed.emit()
			return true

		Item.ItemType.ARMOR:
			# 卸下當前防具
			if equipped_armor:
				unequip_armor()
			equipped_armor = item
			inventory_changed.emit()
			return true

	return false

## 卸下武器
func unequip_weapon():
	if equipped_weapon:
		equipped_weapon = null
		inventory_changed.emit()

## 卸下防具
func unequip_armor():
	if equipped_armor:
		equipped_armor = null
		inventory_changed.emit()

## 清空物品欄
func clear():
	items.clear()
	equipped_weapon = null
	equipped_armor = null
	inventory_changed.emit()

## 獲取物品欄總價值
func get_total_value() -> int:
	var total = 0
	for item_id in items:
		var item: Item = items[item_id]["item"]
		var amount: int = items[item_id]["amount"]
		total += item.value * amount
	return total

## 獲取物品欄總重量
func get_total_weight() -> float:
	var total = 0.0
	for item_id in items:
		var item: Item = items[item_id]["item"]
		var amount: int = items[item_id]["amount"]
		total += item.weight * amount
	return total

## 排序物品 (按稀有度)
func sort_by_rarity():
	var sorted_items = items.values()
	sorted_items.sort_custom(func(a, b):
		return a["item"].rarity > b["item"].rarity
	)

	# 重建字典
	items.clear()
	for item_data in sorted_items:
		var item: Item = item_data["item"]
		items[item.item_id] = item_data

	inventory_changed.emit()

## 保存物品欄數據
func save_data() -> Dictionary:
	var data = {
		"items": [],
		"equipped_weapon_id": equipped_weapon.item_id if equipped_weapon else "",
		"equipped_armor_id": equipped_armor.item_id if equipped_armor else ""
	}

	for item_id in items:
		data["items"].append({
			"item_id": item_id,
			"amount": items[item_id]["amount"]
		})

	return data

## 載入物品欄數據
func load_data(data: Dictionary):
	clear()

	if data.has("items"):
		for item_data in data["items"]:
			# 這裡需要從物品數據庫載入實際的 Item Resource
			# var item = ItemDatabase.get_item(item_data["item_id"])
			# add_item(item, item_data["amount"])
			pass

	# 載入裝備
	if data.has("equipped_weapon_id") and data["equipped_weapon_id"] != "":
		# equip_item(data["equipped_weapon_id"])
		pass

	if data.has("equipped_armor_id") and data["equipped_armor_id"] != "":
		# equip_item(data["equipped_armor_id"])
		pass
