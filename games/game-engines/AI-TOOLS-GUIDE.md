# 遊戲引擎 AI 輔助工具集合
🤖 **Cross-Engine AI Development Tools** 🚀

跨引擎的 AI 輔助開發完整指南，適用於 Unity、Godot、Unreal Engine 等主流遊戲引擎。

## 📋 目錄

- [概述](#概述)
- [通用 AI 提示詞模板](#通用-ai-提示詞模板)
- [引擎特定工具](#引擎特定工具)
- [AI 工作流程](#ai-工作流程)
- [最佳實踐](#最佳實踐)

---

## 🎯 概述

本專案為每個主流遊戲引擎提供了 AI 輔助開發工具:

### 已實現工具

| 引擎 | 工具文件 | 功能 |
|------|---------|------|
| **Unity** | `unity-platformer-2d/AI-GUIDE.md`<br>`Assets/Scripts/AI-Tools/AICodeGenerator.cs` | • 10+ 預設模板<br>• 編輯器菜單整合<br>• 自動複製到剪貼板 |
| **Godot** | `godot-dodge-game/AI-GUIDE.md`<br>`scripts/AIHelper.gd` | • GDScript 專用模板<br>• EditorScript 支援<br>• 場景設置提示詞 |
| **Unreal** | `unreal-fps-3d/README.md` | • C++ / Blueprint 模板<br>• UE5 特定提示詞 |

---

## 🌐 通用 AI 提示詞模板

### 1. 創建新功能

```
創建一個 [引擎名稱] 的 [功能名稱]:

需求:
- [具體需求 1]
- [具體需求 2]
- [具體需求 3]

請提供:
1. 完整的代碼實現
2. 使用方法和示例
3. 場景/節點設置說明 (如需要)
4. 最佳實踐建議

引擎版本: [版本號]
語言: [C#/GDScript/C++/Blueprint]
```

### 2. 調試問題

```
[引擎名稱] 遊戲出現以下問題:

錯誤訊息:
[完整錯誤訊息]

相關代碼:
```[語言]
[代碼片段]
```

場景結構:
[描述對象/節點結構]

已嘗試的解決方案:
- [方案 1]
- [方案 2]

請提供:
1. 問題根本原因分析
2. 完整的修復方案
3. 預防類似問題的建議
```

### 3. 優化性能

```
優化以下 [引擎名稱] 代碼的性能:

```[語言]
[當前代碼]
```

性能問題:
- [具體問題描述]
- FPS: [當前] → [目標]

優化目標:
- 減少 CPU/GPU 使用
- 降低內存佔用
- 減少 GC/分配

請提供優化後的代碼和性能改進說明。
```

### 4. 實現設計模式

```
在 [引擎名稱] 中實現 [設計模式]:

使用場景:
[描述使用場景]

需求:
- [具體需求]

請提供:
1. 完整的代碼實現
2. 使用示例
3. 優缺點分析
4. 適用場景說明
```

---

## 🎮 引擎特定工具

### Unity

**位置**: `games/game-engines/unity-platformer-2d/`

**使用方法**:
```csharp
// 在編輯器中
Tools > AI Tools > Generate [功能名稱]

// 在代碼中
string prompt = AICodeGenerator.GenerateFeaturePrompt(
    AICodeGenerator.Templates.PLAYER_CONTROLLER
);
AICodeGenerator.PrintToConsole(prompt);
```

**特點**:
- ✅ 編輯器菜單整合
- ✅ 10+ 預設模板
- ✅ 自動複製功能
- ✅ Unity 特定語法

**詳細文檔**: [Unity AI-GUIDE.md](unity-platformer-2d/AI-GUIDE.md)

---

### Godot

**位置**: `games/game-engines/godot-dodge-game/`

**使用方法**:
```gdscript
# 方法 1: 作為 EditorScript
@tool
extends EditorScript

func _run():
    var prompt = AIHelper.generate_common_prompt("player")
    print(prompt)
    DisplayServer.clipboard_set(prompt)

# 方法 2: 在遊戲中
func _ready():
    var prompt = AIHelper.get_create_script_prompt(
        "EnemyAI",
        "智能敵人 AI 系統",
        ["巡邏", "追擊", "攻擊"]
    )
    AIHelper.copy_to_clipboard(prompt)
```

**特點**:
- ✅ GDScript 專用
- ✅ 10+ 預設模板
- ✅ Godot 4.x 語法
- ✅ 場景設置提示詞

**詳細文檔**: [Godot AI-GUIDE.md](godot-dodge-game/AI-GUIDE.md)

---

### Unreal Engine

**提示詞技巧**:

**C++ 代碼生成**:
```
創建一個 Unreal Engine C++ 類:

繼承自: [基類]
功能: [描述]

需求:
- 使用 UPROPERTY 和 UFUNCTION
- 包含藍圖可訪問的函數
- 遵循 UE5 命名規範

請提供完整的 .h 和 .cpp 實現。
```

**Blueprint 邏輯**:
```
描述一個 Unreal Blueprint 邏輯:

觸發條件: [條件]
執行步驟:
1. [步驟 1]
2. [步驟 2]
3. [步驟 3]

請提供節點連接邏輯說明。
```

---

## 🔄 AI 工作流程

### 完整開發流程

```
1. 規劃功能
   ├─ 明確需求
   ├─ 選擇引擎
   └─ 確定實現方式
   ↓
2. 生成提示詞
   ├─ 使用內建工具
   ├─ 或手動編寫
   └─ 包含所有上下文
   ↓
3. 發送給 AI
   ├─ ChatGPT
   ├─ Claude
   ├─ Copilot
   └─ 其他 AI 工具
   ↓
4. 獲取代碼
   ├─ 審查代碼
   ├─ 理解邏輯
   └─ 調整適配
   ↓
5. 實現到專案
   ├─ 創建文件
   ├─ 設置場景
   └─ 連接組件
   ↓
6. 測試驗證
   ├─ 功能測試
   ├─ 性能測試
   └─ 邊界測試
   ↓
7. 迭代優化
   ├─ 發現問題
   ├─ AI 輔助調試
   └─ 持續改進
```

### 快速原型流程

```
1. 描述功能 → AI 生成代碼
2. 複製貼上 → 快速測試
3. 有問題? → AI 調試
4. 滿意後 → 重構優化
```

---

## 💡 最佳實踐

### 1. 編寫高質量提示詞

**✅ 好的提示詞**:
```
創建一個 Unity C# 敵人 AI 系統:

需求:
- 繼承自 MonoBehaviour
- 使用狀態機模式 (Idle, Patrol, Chase, Attack)
- 使用 NavMeshAgent 導航
- 檢測範圍可視化 (Gizmos)
- 攻擊範圍 2米，檢測範圍 10米
- 支援 Inspector 調整參數

Unity 版本: 2022 LTS
目標平台: PC

請提供完整代碼和使用說明。
```

**❌ 不好的提示詞**:
```
幫我做一個敵人AI
```

### 2. 提供充足上下文

**包含**:
- 引擎版本
- 目標平台
- 相關代碼
- 場景結構
- 已嘗試的方案

### 3. 分步驟請求

**不要**:
```
創建完整的 RPG 系統
```

**而是**:
```
第一步: 創建角色數據結構
第二步: 創建物品欄系統
第三步: 創建裝備系統
第四步: 整合所有系統
```

### 4. 要求解釋和替代方案

```
請提供:
1. 完整代碼
2. 每個方法的作用說明
3. 設計思路解釋
4. 至少兩種不同實現方案
5. 優缺點對比
```

### 5. 引擎特定注意事項

**Unity**:
```
請使用:
- [Header] 和 [Tooltip] 屬性
- [SerializeField] for private 變數
- OnDrawGizmos 可視化
- Unity 命名約定 (camelCase)
```

**Godot**:
```
請使用:
- Godot 4.x 語法 (@export, @onready)
- snake_case 命名
- ## 文檔註解
- 信號系統
```

**Unreal**:
```
請使用:
- UPROPERTY 和 UFUNCTION 宏
- BlueprintCallable 標記
- UE5 命名約定
- GENERATED_BODY()
```

### 6. 測試和驗證

```
AI 生成代碼後:
□ 檢查語法錯誤
□ 理解每行代碼
□ 測試基本功能
□ 測試邊界情況
□ 檢查性能影響
□ 添加錯誤處理
```

---

## 🚀 進階技巧

### 1. 組合多個功能

```
創建一個集成系統，包含:
1. 先前創建的 [系統A]
2. 新的 [系統B]
3. 兩者的整合邏輯

請提供整合後的完整代碼。
```

### 2. 代碼重構

```
重構以下代碼，應用以下模式:
- 單一職責原則
- 依賴注入
- 事件驅動架構

原代碼:
```[語言]
[代碼]
```

請提供重構後的代碼和改進說明。
```

### 3. 跨平台適配

```
調整以下 [引擎] 代碼以支援:
- PC
- 移動設備
- 主機

當前代碼:
[代碼]

請提供適配後的代碼和平台特定注意事項。
```

### 4. AI 輔助學習

```
解釋以下 [引擎] 代碼:

```[語言]
[代碼]
```

請提供:
1. 逐行註解
2. 設計模式說明
3. 為什麼這樣實現
4. 可能的改進方向
5. 相關學習資源
```

---

## 📚 資源和工具

### AI 工具推薦

| 工具 | 適用場景 | 優勢 |
|------|---------|------|
| **ChatGPT** | 代碼生成、學習 | 通用性強 |
| **Claude** | 大型重構、分析 | 長上下文 |
| **GitHub Copilot** | 實時補全 | IDE 整合 |
| **Cursor** | 專業開發 | 專為編程設計 |

### 學習資源

**Unity**:
- [Unity Learn](https://learn.unity.com/)
- [Brackeys](https://www.youtube.com/user/Brackeys)

**Godot**:
- [Godot Docs](https://docs.godotengine.org/)
- [GDQuest](https://www.gdquest.com/)

**Unreal**:
- [UE Documentation](https://docs.unrealengine.com/)
- [Unreal Online Learning](https://www.unrealengine.com/learn)

---

## 🎯 專案中的實現

### Unity 示例

查看 `unity-platformer-2d/Assets/Scripts/` 中的實現:
- EnemyAI.cs - 完整的敵人 AI
- PowerUp.cs - 道具系統
- SaveSystem.cs - 存檔系統

### Godot 示例

查看 `godot-roguelike-2d/scripts/` 中的實現:
- inventory.gd - 物品欄系統
- item_database.gd - 物品數據庫
- consumable_item.gd - 消耗品系統

---

## 🎉 總結

### AI 輔助開發的價值

- ⚡ **效率提升**: 5-10倍開發速度
- 📚 **學習加速**: 透過代碼學習最佳實踐
- 🐛 **快速調試**: 分鐘級問題解決
- 💡 **創意激發**: 多種實現方案
- 🔄 **迭代優化**: 持續改進代碼

### 使用原則

1. **理解優先**: 不要盲目使用 AI 代碼
2. **測試驗證**: 所有代碼必須測試
3. **適度依賴**: AI 是工具，不是替代品
4. **持續學習**: 從 AI 代碼中學習
5. **質量把控**: 維護代碼質量標準

---

**🎮 使用 AI 加速你的遊戲開發！**

**最後更新**: 2025-11-18
**專案狀態**: ✅ 活躍維護
**貢獻**: 歡迎提交改進建議
