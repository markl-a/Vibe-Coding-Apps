## AI 輔助工具 - Godot 代碼生成提示詞生成器
## 這個腳本提供常用的 AI 提示詞模板，幫助快速生成 GDScript 代碼
## 使用方法: 在 Godot 編輯器中運行此腳本，或複製提示詞使用

extends Node

class_name AIHelper

## AI 提示詞模板庫
class PromptTemplates:
	## 玩家控制器模板
	const PLAYER_CONTROLLER = """創建一個 Godot GDScript 玩家控制器:
- 繼承自 CharacterBody2D
- WASD/方向鍵四向移動
- 速度可在 Inspector 中調整
- 邊界檢測，不能移出螢幕
- 包含動畫控制
- 使用 @export 變數

請提供完整的 GDScript 代碼。"""

	## 敵人 AI 模板
	const ENEMY_AI = """創建一個 Godot GDScript 敵人 AI:
- 繼承自 CharacterBody2D
- 巡邏行為（在兩點間來回）
- 檢測並追擊玩家
- 簡單的攻擊判定
- 生命值系統
- 死亡時發送信號

使用 Godot 4.x 語法，請提供完整代碼。"""

	## 物品欄系統模板
	const INVENTORY_SYSTEM = """創建一個 Godot GDScript 物品欄系統:
- 固定格子數量 (20格)
- 物品數據結構 (字典)
- 添加、移除、使用物品功能
- 物品堆疊
- 發送信號通知 UI 更新
- 使用 Resource 保存物品數據

請提供完整的 GDScript 實現。"""

	## UI 管理器模板
	const UI_MANAGER = """創建一個 Godot GDScript UI 管理器:
- 繼承自 CanvasLayer
- 管理生命值、分數、計時器顯示
- 暫停選單
- 遊戲結束畫面
- 淡入淡出效果
- 使用 @onready 獲取節點引用

請提供完整代碼和使用說明。"""

	## 存檔系統模板
	const SAVE_SYSTEM = """創建一個 Godot GDScript 存檔系統:
- 使用 FileAccess 讀寫文件
- JSON 格式保存數據
- 保存玩家狀態、遊戲進度
- 檢查存檔是否存在
- 錯誤處理
- 使用 user:// 路徑

請提供完整的實現代碼。"""

	## 狀態機模板
	const STATE_MACHINE = """創建一個 Godot GDScript 狀態機:
- 管理多個狀態 (Idle, Walk, Jump, Attack 等)
- 狀態切換邏輯
- 每個狀態的 enter、update、exit 方法
- 使用字典或類實現
- 易於擴展新狀態

請提供完整的狀態機實現。"""

	## 音效管理器模板
	const AUDIO_MANAGER = """創建一個 Godot GDScript 音效管理器:
- 單例模式 (Autoload)
- 播放背景音樂
- 播放音效 (支援多個同時播放)
- 音量控制
- 音樂淡入淡出
- 使用 AudioStreamPlayer 節點池

請提供完整代碼。"""

	## 對象池模板
	const OBJECT_POOL = """創建一個 Godot GDScript 對象池系統:
- 預先創建對象
- 對象重用機制
- 自動擴展 (可選)
- 支援多種對象類型
- 清理和重置對象
- 性能優化

請提供完整的實現。"""

	## 相機控制器模板
	const CAMERA_CONTROLLER = """創建一個 Godot GDScript 2D 相機控制器:
- 繼承自 Camera2D
- 平滑跟隨目標
- 邊界限制
- 相機震動效果
- 縮放功能
- Deadzone 設置

請提供完整代碼。"""

	## 對話系統模板
	const DIALOG_SYSTEM = """創建一個 Godot GDScript 對話系統:
- 對話數據結構 (JSON 或 Resource)
- 打字機效果
- 對話選項分支
- 角色頭像顯示
- 跳過對話功能
- 對話歷史記錄

請提供完整實現。"""

## 生成創建新腳本的提示詞
static func get_create_script_prompt(script_name: String, description: String, features: Array) -> String:
	var prompt = """創建一個 Godot GDScript 腳本 '%s'

描述: %s

功能需求:
%s

請提供:
1. 完整的 GDScript 代碼 (Godot 4.x 語法)
2. 使用 @export 讓變數可在 Inspector 中編輯
3. 使用 @onready 獲取節點引用
4. 添加詳細註解 (使用 ## 文檔註解)
5. 包含錯誤處理

代碼風格:
- 使用 snake_case 命名變數和函數
- 使用 PascalCase 命名類
- 常量使用 UPPER_CASE
- 適當的縮排 (使用 Tab)
""" % [script_name, description, "\n".join(features)]

	return prompt

## 生成優化腳本的提示詞
static func get_optimize_script_prompt(current_code: String, issues: Array) -> String:
	var prompt = """優化以下 Godot GDScript 代碼:

當前代碼:
```gdscript
%s
```

已知問題:
%s

請提供:
1. 優化後的代碼
2. 性能改進說明
3. 使用 Godot 4.x 最佳實踐
4. 減少內存分配
5. 使用內建函數優化
""" % [current_code, "\n".join(issues)]

	return prompt

## 生成調試問題的提示詞
static func get_debug_prompt(error_message: String, code_snippet: String, context: String) -> String:
	var prompt = """Godot 遊戲開發調試:

錯誤訊息:
%s

相關代碼:
```gdscript
%s
```

上下文信息:
%s

請提供:
1. 錯誤原因分析
2. 修復建議
3. 完整的修復代碼
4. Godot 特定的注意事項
5. 預防類似問題的建議
""" % [error_message, code_snippet, context]

	return prompt

## 生成添加新功能的提示詞
static func get_add_feature_prompt(existing_code: String, new_feature: String) -> String:
	var prompt = """在現有的 Godot GDScript 中添加新功能:

現有代碼:
```gdscript
%s
```

新功能需求:
%s

請提供:
1. 修改後的完整代碼
2. 新增的變數和方法說明
3. 使用方法示例
4. 需要在場景中添加的節點（如果有）
5. 信號連接說明
""" % [existing_code, new_feature]

	return prompt

## 生成場景設置指南的提示詞
static func get_scene_setup_prompt(scene_description: String, node_structure: String) -> String:
	var prompt = """創建 Godot 場景設置指南:

場景描述:
%s

節點結構:
%s

請提供:
1. 詳細的節點添加步驟
2. 每個節點的 Inspector 設置
3. 腳本附加說明
4. 信號連接步驟
5. 常見問題和解決方案
""" % [scene_description, node_structure]

	return prompt

## 打印提示詞到控制台
static func print_prompt(prompt: String):
	print("=== AI 提示詞 ===")
	print(prompt)
	print("================")

## 將提示詞複製到剪貼板 (Godot 4.x)
static func copy_to_clipboard(text: String):
	DisplayServer.clipboard_set(text)
	print("✅ 提示詞已複製到剪貼板!")

## 快速生成常用功能的提示詞
static func generate_common_prompt(template_name: String, customizations: Array = []) -> String:
	var base_prompt = ""

	match template_name:
		"player":
			base_prompt = PromptTemplates.PLAYER_CONTROLLER
		"enemy":
			base_prompt = PromptTemplates.ENEMY_AI
		"inventory":
			base_prompt = PromptTemplates.INVENTORY_SYSTEM
		"ui":
			base_prompt = PromptTemplates.UI_MANAGER
		"save":
			base_prompt = PromptTemplates.SAVE_SYSTEM
		"state":
			base_prompt = PromptTemplates.STATE_MACHINE
		"audio":
			base_prompt = PromptTemplates.AUDIO_MANAGER
		"pool":
			base_prompt = PromptTemplates.OBJECT_POOL
		"camera":
			base_prompt = PromptTemplates.CAMERA_CONTROLLER
		"dialog":
			base_prompt = PromptTemplates.DIALOG_SYSTEM
		_:
			push_error("未知的模板名稱: " + template_name)
			return ""

	if customizations.size() > 0:
		base_prompt += "\n\n額外需求:\n" + "\n".join(customizations)

	base_prompt += "\n\n請提供完整的 Godot 4.x GDScript 實現代碼。"

	return base_prompt

## 使用示例（在 _ready() 中調用）
func _ready():
	# 示例 1: 生成玩家控制器提示詞
	var player_prompt = AIHelper.generate_common_prompt("player", [
		"添加衝刺功能",
		"支援手把輸入",
		"添加粒子效果"
	])
	AIHelper.print_prompt(player_prompt)
	AIHelper.copy_to_clipboard(player_prompt)

	# 示例 2: 創建自定義腳本提示詞
	var custom_prompt = AIHelper.get_create_script_prompt(
		"PowerUpManager",
		"管理遊戲中的所有道具",
		[
			"生成隨機道具",
			"道具效果計時",
			"道具堆疊判定",
			"道具特效顯示"
		]
	)
	AIHelper.print_prompt(custom_prompt)

## EditorScript 版本（在編輯器中運行）
## 將此腳本保存為 .gd 文件並在編輯器中執行
@tool
extends EditorScript

func _run():
	# 在編輯器中運行，生成提示詞
	var prompt = AIHelper.generate_common_prompt("player")
	print(prompt)
	DisplayServer.clipboard_set(prompt)
	print("✅ 提示詞已複製!")
