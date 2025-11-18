## 物品基類 - Resource
## 定義遊戲中所有物品的基本屬性
extends Resource
class_name Item

## 物品類型枚舉
enum ItemType {
	WEAPON,      # 武器
	ARMOR,       # 防具
	CONSUMABLE,  # 消耗品
	MATERIAL,    # 材料
	QUEST        # 任務物品
}

## 物品稀有度
enum Rarity {
	COMMON,      # 普通 (白色)
	UNCOMMON,    # 非凡 (綠色)
	RARE,        # 稀有 (藍色)
	EPIC,        # 史詩 (紫色)
	LEGENDARY    # 傳說 (橙色)
}

## 基本屬性
@export var item_id: String = ""
@export var item_name: String = "Item"
@export var description: String = ""
@export var icon: Texture2D
@export var item_type: ItemType = ItemType.MATERIAL
@export var rarity: Rarity = Rarity.COMMON

## 數量和價值
@export var max_stack: int = 99
@export var value: int = 0
@export var weight: float = 0.0

## 使用相關
@export var is_usable: bool = false
@export var is_equippable: bool = false
@export var is_tradable: bool = true

## 獲取稀有度顏色
func get_rarity_color() -> Color:
	match rarity:
		Rarity.COMMON:
			return Color.WHITE
		Rarity.UNCOMMON:
			return Color.GREEN
		Rarity.RARE:
			return Color.DODGER_BLUE
		Rarity.EPIC:
			return Color.PURPLE
		Rarity.LEGENDARY:
			return Color.ORANGE
		_:
			return Color.WHITE

## 使用物品 (由子類覆寫)
func use(target) -> bool:
	return false

## 獲取物品信息文本
func get_info_text() -> String:
	var info = "[b]%s[/b]\n" % item_name
	info += "%s\n\n" % description
	info += "類型: %s\n" % ItemType.keys()[item_type]
	info += "稀有度: %s\n" % Rarity.keys()[rarity]
	info += "價值: %d\n" % value

	if weight > 0:
		info += "重量: %.1f\n" % weight

	return info
