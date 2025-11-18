# Godot Roguelike 物品系統指南
🎒 **完整的物品與物品欄系統** 🚀

本指南介紹如何使用和擴展 Roguelike 遊戲的物品系統。

## 📋 目錄

- [系統概述](#系統概述)
- [物品類別](#物品類別)
- [物品欄系統](#物品欄系統)
- [物品數據庫](#物品數據庫)
- [使用指南](#使用指南)
- [擴展功能](#擴展功能)

---

## 🎯 系統概述

### 架構

```
物品系統架構:
├─ Item (Resource) - 基礎物品類
│   ├─ ConsumableItem - 消耗品
│   ├─ WeaponItem - 武器 (可擴展)
│   └─ ArmorItem - 防具 (可擴展)
│
├─ Inventory (Node) - 物品欄管理
│   ├─ 添加/移除物品
│   ├─ 使用物品
│   ├─ 裝備系統
│   └─ 保存/載入
│
└─ ItemDatabase (Autoload) - 物品數據庫
    ├─ 物品註冊
    ├─ 物品查詢
    └─ 隨機掉落
```

### 特性

- ✅ 基於 Resource 的物品系統
- ✅ 完整的物品欄管理
- ✅ 物品堆疊系統
- ✅ 裝備系統
- ✅ 消耗品效果
- ✅ 稀有度系統
- ✅ 物品數據庫
- ✅ 隨機掉落系統
- ✅ 信號事件系統

---

## 📦 物品類別

### Item (基礎類)

所有物品的基類，使用 Resource 方便序列化和保存。

**屬性:**
```gdscript
@export var item_id: String = ""           # 唯一ID
@export var item_name: String = "Item"     # 名稱
@export var description: String = ""       # 描述
@export var icon: Texture2D                # 圖示
@export var item_type: ItemType            # 類型
@export var rarity: Rarity                 # 稀有度
@export var max_stack: int = 99            # 最大堆疊
@export var value: int = 0                 # 價值
@export var weight: float = 0.0            # 重量
```

**物品類型:**
```gdscript
enum ItemType {
    WEAPON,      # 武器
    ARMOR,       # 防具
    CONSUMABLE,  # 消耗品
    MATERIAL,    # 材料
    QUEST        # 任務物品
}
```

**稀有度:**
```gdscript
enum Rarity {
    COMMON,      # 普通 (白色)
    UNCOMMON,    # 非凡 (綠色)
    RARE,        # 稀有 (藍色)
    EPIC,        # 史詩 (紫色)
    LEGENDARY    # 傳說 (橙色)
}
```

### ConsumableItem (消耗品)

可使用的消耗品物品。

**效果類型:**
```gdscript
enum EffectType {
    HEAL,           # 恢復生命
    RESTORE_MANA,   # 恢復魔力
    BUFF_ATTACK,    # 增加攻擊力
    BUFF_DEFENSE,   # 增加防禦力
    BUFF_SPEED,     # 增加速度
    CURE_POISON,    # 解毒
    TELEPORT        # 傳送
}
```

**使用方法:**
```gdscript
var potion = ConsumableItem.new()
potion.effect_type = ConsumableItem.EffectType.HEAL
potion.effect_value = 50

# 使用物品
var success = potion.use(player)
```

---

## 🎒 物品欄系統

### Inventory 類

管理玩家的物品收集和使用。

#### 基本操作

**添加物品:**
```gdscript
var inventory = Inventory.new()
var health_potion = ItemDatabase.get_item("potion_health_small")

# 添加 3 個生命藥水
inventory.add_item(health_potion, 3)
```

**移除物品:**
```gdscript
# 移除 1 個物品
inventory.remove_item("potion_health_small", 1)
```

**使用物品:**
```gdscript
# 使用生命藥水
inventory.use_item("potion_health_small", player)
```

**檢查物品:**
```gdscript
# 檢查是否有物品
if inventory.has_item("potion_health_small", 3):
    print("有足夠的藥水")

# 獲取物品數量
var amount = inventory.get_item_amount("potion_health_small")
```

#### 裝備系統

**裝備物品:**
```gdscript
# 裝備武器
inventory.equip_item("weapon_sword_iron")

# 訪問已裝備物品
var weapon = inventory.equipped_weapon
var armor = inventory.equipped_armor
```

**卸下裝備:**
```gdscript
inventory.unequip_weapon()
inventory.unequip_armor()
```

#### 信號系統

```gdscript
# 連接信號
inventory.item_added.connect(_on_item_added)
inventory.item_removed.connect(_on_item_removed)
inventory.item_used.connect(_on_item_used)
inventory.inventory_full.connect(_on_inventory_full)
inventory.inventory_changed.connect(_on_inventory_changed)

func _on_item_added(item: Item, amount: int):
    print("獲得 %s x%d" % [item.item_name, amount])

func _on_inventory_full():
    print("物品欄已滿!")
```

#### 實用功能

**獲取所有物品:**
```gdscript
var all_items = inventory.get_all_items()
for item_data in all_items:
    var item: Item = item_data["item"]
    var amount: int = item_data["amount"]
    print("%s: %d" % [item.item_name, amount])
```

**排序物品:**
```gdscript
# 按稀有度排序
inventory.sort_by_rarity()
```

**統計信息:**
```gdscript
# 總價值
var total_value = inventory.get_total_value()

# 總重量
var total_weight = inventory.get_total_weight()
```

---

## 📚 物品數據庫

### ItemDatabase (Autoload)

全局物品數據庫，管理所有遊戲物品。

#### 設置 Autoload

1. 保存 `item_database.gd` 腳本
2. `Project > Project Settings > Autoload`
3. 添加腳本，命名為 `ItemDatabase`

#### 使用方法

**獲取物品:**
```gdscript
# 通過 ID 獲取物品
var health_potion = ItemDatabase.get_item("potion_health_small")

if health_potion:
    inventory.add_item(health_potion, 1)
```

**獲取所有物品:**
```gdscript
var all_items = ItemDatabase.get_all_items()
```

**按類型獲取:**
```gdscript
# 獲取所有武器
var weapons = ItemDatabase.get_items_by_type(Item.ItemType.WEAPON)

# 獲取所有消耗品
var consumables = ItemDatabase.get_items_by_type(Item.ItemType.CONSUMABLE)
```

**按稀有度獲取:**
```gdscript
# 獲取所有稀有物品
var rare_items = ItemDatabase.get_items_by_rarity(Item.Rarity.RARE)
```

**隨機掉落:**
```gdscript
# 根據等級生成隨機物品
var random_item = ItemDatabase.create_random_item(player_level)

if random_item:
    inventory.add_item(random_item, 1)
```

#### 添加新物品

在 `item_database.gd` 中添加:

```gdscript
func _create_consumables():
    # ... 現有物品 ...

    # 新物品
    var magic_potion = ConsumableItem.new()
    magic_potion.item_id = "potion_magic"
    magic_potion.item_name = "魔法藥水"
    magic_potion.description = "恢復魔力"
    magic_potion.effect_type = ConsumableItem.EffectType.RESTORE_MANA
    magic_potion.effect_value = 50
    magic_potion.value = 20
    magic_potion.rarity = Item.Rarity.UNCOMMON
    register_item(magic_potion)
```

---

## 🎮 使用指南

### 在玩家腳本中使用

```gdscript
extends CharacterBody2D

# 玩家物品欄
var inventory: Inventory

func _ready():
    # 創建物品欄
    inventory = Inventory.new()
    inventory.max_slots = 20

    # 連接信號
    inventory.item_added.connect(_on_item_picked_up)
    inventory.item_used.connect(_on_item_used)

    # 給予初始物品
    var starting_potion = ItemDatabase.get_item("potion_health_small")
    if starting_potion:
        inventory.add_item(starting_potion, 3)

func _input(event):
    # 按 E 使用第一個消耗品
    if event.is_action_pressed("use_item"):
        use_health_potion()

func use_health_potion():
    # 嘗試使用生命藥水
    if inventory.use_item("potion_health_small", self):
        print("使用了生命藥水")

# 治療方法 (被消耗品呼叫)
func heal(amount: float):
    health += amount
    health = min(health, max_health)
    print("恢復了 %.0f 生命值" % amount)

func _on_item_picked_up(item: Item, amount: int):
    # 顯示拾取提示
    print("拾取: %s x%d" % [item.item_name, amount])
```

### 物品掉落系統

```gdscript
# 在敵人死亡時掉落物品
func die():
    drop_loot()
    queue_free()

func drop_loot():
    # 隨機掉落物品
    if randf() < 0.3:  # 30% 機率
        var item = ItemDatabase.create_random_item(level)

        if item:
            # 創建物品掉落物
            var item_pickup = preload("res://scenes/ItemPickup.tscn").instantiate()
            item_pickup.item = item
            item_pickup.amount = randi_range(1, 3)
            item_pickup.global_position = global_position
            get_parent().add_child(item_pickup)
```

### 物品拾取物場景

```gdscript
# ItemPickup.gd
extends Area2D

var item: Item
var amount: int = 1

@onready var sprite = $Sprite2D
@onready var label = $Label

func _ready():
    if item:
        # 設置圖示
        if item.icon:
            sprite.texture = item.icon

        # 顯示稀有度顏色
        sprite.modulate = item.get_rarity_color()

        # 顯示名稱
        label.text = item.item_name

    # 連接拾取信號
    body_entered.connect(_on_body_entered)

func _on_body_entered(body):
    if body.has_method("get") and body.name == "Player":
        # 玩家拾取物品
        if body.inventory.add_item(item, amount):
            # 播放拾取音效
            $PickupSound.play()

            # 銷毀拾取物
            queue_free()
```

---

## 🚀 擴展功能

### 1. 創建武器類

```gdscript
extends Item
class_name WeaponItem

@export var damage: float = 10.0
@export var attack_speed: float = 1.0
@export var range: float = 100.0
@export_enum("Sword", "Bow", "Staff") var weapon_type: String = "Sword"

func _init():
    item_type = ItemType.WEAPON
    is_equippable = true
    max_stack = 1

func get_info_text() -> String:
    var info = super.get_info_text()
    info += "\n傷害: %.0f" % damage
    info += "\n攻速: %.1f" % attack_speed
    info += "\n範圍: %.0f" % range
    return info
```

### 2. 創建防具類

```gdscript
extends Item
class_name ArmorItem

@export var defense: float = 5.0
@export var health_bonus: float = 0.0
@export_enum("Head", "Chest", "Legs", "Boots") var armor_slot: String = "Chest"

func _init():
    item_type = ItemType.ARMOR
    is_equippable = true
    max_stack = 1

func get_info_text() -> String:
    var info = super.get_info_text()
    info += "\n防禦: %.0f" % defense
    if health_bonus > 0:
        info += "\n生命加成: %.0f" % health_bonus
    return info
```

### 3. 合成系統

```gdscript
class_name CraftingSystem

# 合成配方
var recipes: Dictionary = {
    "iron_sword": {
        "result": "weapon_sword_iron",
        "materials": {
            "material_iron_ore": 5,
            "material_wood": 2
        }
    }
}

func can_craft(recipe_id: String, inventory: Inventory) -> bool:
    if not recipes.has(recipe_id):
        return false

    var recipe = recipes[recipe_id]

    for material_id in recipe["materials"]:
        var required_amount = recipe["materials"][material_id]
        if not inventory.has_item(material_id, required_amount):
            return false

    return true

func craft(recipe_id: String, inventory: Inventory) -> bool:
    if not can_craft(recipe_id, inventory):
        return false

    var recipe = recipes[recipe_id]

    # 消耗材料
    for material_id in recipe["materials"]:
        var amount = recipe["materials"][material_id]
        inventory.remove_item(material_id, amount)

    # 給予成品
    var result_item = ItemDatabase.get_item(recipe["result"])
    if result_item:
        inventory.add_item(result_item, 1)
        return true

    return false
```

### 4. 商店系統

```gdscript
class_name ShopSystem

var shop_inventory: Array = []
var buy_price_multiplier: float = 1.0
var sell_price_multiplier: float = 0.5

func add_shop_item(item_id: String, stock: int = -1):
    shop_inventory.append({
        "item": ItemDatabase.get_item(item_id),
        "stock": stock  # -1 = 無限
    })

func buy_item(item_id: String, player_inventory: Inventory, player_gold: int) -> int:
    var shop_item = _find_shop_item(item_id)
    if not shop_item:
        return player_gold

    var item: Item = shop_item["item"]
    var price = int(item.value * buy_price_multiplier)

    if player_gold < price:
        print("金幣不足")
        return player_gold

    if shop_item["stock"] == 0:
        print("商品已售完")
        return player_gold

    # 購買
    player_inventory.add_item(item, 1)

    if shop_item["stock"] > 0:
        shop_item["stock"] -= 1

    return player_gold - price

func sell_item(item_id: String, player_inventory: Inventory, player_gold: int) -> int:
    if not player_inventory.has_item(item_id):
        return player_gold

    var item_data = player_inventory.items[item_id]
    var item: Item = item_data["item"]

    if not item.is_tradable:
        print("此物品無法出售")
        return player_gold

    var price = int(item.value * sell_price_multiplier)

    # 出售
    player_inventory.remove_item(item_id, 1)

    return player_gold + price
```

### 5. UI 整合

```gdscript
# InventoryUI.gd
extends Control

@onready var grid = $GridContainer
@onready var info_panel = $InfoPanel

var inventory: Inventory
var slot_scene = preload("res://ui/ItemSlot.tscn")

func setup(inv: Inventory):
    inventory = inv
    inventory.inventory_changed.connect(refresh)
    refresh()

func refresh():
    # 清空現有槽位
    for child in grid.get_children():
        child.queue_free()

    # 創建槽位
    for i in range(inventory.max_slots):
        var slot = slot_scene.instantiate()
        grid.add_child(slot)

    # 填充物品
    var items = inventory.get_all_items()
    for i in range(items.size()):
        var item_data = items[i]
        var slot = grid.get_child(i)
        slot.set_item(item_data["item"], item_data["amount"])
```

---

## 🎓 最佳實踐

### 1. 使用 Resource 保存物品數據

```gdscript
# 創建物品 Resource 文件
# res://items/potions/health_potion.tres
```

### 2. 分類管理物品

```
items/
├─ consumables/
│   ├─ potions/
│   └─ scrolls/
├─ weapons/
│   ├─ swords/
│   └─ bows/
└─ materials/
```

### 3. 使用信號通知 UI

```gdscript
# 讓 UI 監聽物品欄變化
inventory.inventory_changed.connect(ui.refresh)
```

### 4. 序列化保存

```gdscript
# 保存物品欄
var save_data = inventory.save_data()
var file = FileAccess.open("user://save.json", FileAccess.WRITE)
file.store_string(JSON.stringify(save_data))
```

---

## 🎉 總結

這個物品系統提供了:

- ✅ 完整的物品管理
- ✅ 靈活的擴展性
- ✅ 信號驅動的事件系統
- ✅ 易於使用的 API
- ✅ 可保存和載入

**🎮 開始創建你的物品和探索系統吧！**

---

**最後更新**: 2025-11-18
**Godot 版本**: 4.2+
**狀態**: ✅ 完整實現
