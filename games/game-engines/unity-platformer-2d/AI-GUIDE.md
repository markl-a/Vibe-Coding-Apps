# Unity AI 輔助開發指南
🤖 **AI-Native Development** 🚀

本指南介紹如何使用 AI 輔助工具加速 Unity 遊戲開發。

## 📋 目錄

- [AI 工具概述](#ai-工具概述)
- [內建 AI 工具](#內建-ai-工具)
- [AI 提示詞模板](#ai-提示詞模板)
- [實戰案例](#實戰案例)
- [最佳實踐](#最佳實踐)

---

## 🤖 AI 工具概述

### 已實現的腳本

本專案包含以下 AI 生成的實用腳本:

#### 核心系統
- ✅ **PlayerController.cs** - 玩家控制器（移動、跳躍）
- ✅ **PlayerHealth.cs** - 生命值系統（受傷、治療、無敵）
- ✅ **GameManager.cs** - 遊戲管理器（分數、關卡）
- ✅ **UIManager.cs** - UI 管理器

#### 遊戲玩法
- ✅ **EnemyAI.cs** - 敵人 AI（巡邏、追擊、攻擊）
- ✅ **PowerUp.cs** - 道具系統（多種道具類型）
- ✅ **Collectible.cs** - 收集品系統
- ✅ **MovingPlatform.cs** - 移動平台

#### 工具系統
- ✅ **SaveSystem.cs** - 存檔系統（JSON 格式）
- ✅ **CameraFollow.cs** - 相機跟隨
- ✅ **AICodeGenerator.cs** - AI 代碼生成器

---

## 🛠️ 內建 AI 工具

### AICodeGenerator

位於 `Assets/Scripts/AI-Tools/AICodeGenerator.cs`

#### 功能

1. **快速生成提示詞** - 預設模板
2. **編輯器菜單** - 一鍵訪問
3. **自動複製** - 提示詞自動複製到剪貼板

#### 使用方法

```csharp
// 方法 1: 使用編輯器菜單
Tools > AI Tools > Generate Player Controller
Tools > AI Tools > Generate Enemy AI
// ... 其他選項

// 方法 2: 在代碼中使用
string prompt = AICodeGenerator.GenerateFeaturePrompt(
    AICodeGenerator.Templates.PLAYER_CONTROLLER,
    new string[] {
        "添加衝刺功能",
        "支援手把控制",
        "添加粒子效果"
    }
);

AICodeGenerator.PrintToConsole(prompt);
// 複製 Console 中的提示詞，發送給 AI
```

---

## 📝 AI 提示詞模板

### 1. 創建新腳本

```
創建一個 Unity C# 腳本 'ScriptName'

描述: [腳本功能描述]

功能需求:
- 功能 1
- 功能 2
- 功能 3

請提供:
1. 完整的 C# 代碼
2. Inspector 可編輯變數
3. 詳細註解
4. 使用示例
```

### 2. 擴展現有腳本

```
在以下 Unity 腳本中添加 [新功能]:

現有代碼:
```csharp
[貼上代碼]
```

新功能需求:
- [具體需求]

請提供完整的修改後代碼，標註新增部分。
```

### 3. 調試錯誤

```
Unity 遊戲出現以下錯誤:

錯誤訊息:
[錯誤訊息]

相關代碼:
```csharp
[代碼片段]
```

場景設置:
[描述場景中的對象設置]

請分析問題並提供修復方案。
```

### 4. 性能優化

```
優化以下 Unity 代碼的性能:

```csharp
[代碼]
```

目標:
- 減少 GC 分配
- 提高運行效率
- 優化記憶體使用

請提供優化後的代碼和說明。
```

---

## 💡 實戰案例

### 案例 1: 創建雙跳功能

**AI 提示詞:**
```
在 PlayerController.cs 中添加雙跳功能:

現有代碼:
[貼上 PlayerController.cs]

需求:
1. 第一次跳躍在地面
2. 第二次跳躍在空中
3. 二跳力度為普通跳躍的 0.8 倍
4. 不同的跳躍音效
5. Inspector 中可開關雙跳功能

請提供修改後的完整代碼。
```

**結果:**
AI 會提供完整的雙跳實現，包括:
- 跳躍計數變數
- 地面檢測時重置
- 音效播放
- Inspector 參數

### 案例 2: 創建 Boss 戰系統

**AI 提示詞:**
```
創建一個 Unity Boss 戰系統:

需求:
1. 繼承自 EnemyAI
2. 多階段系統（血量到達閾值時切換）
3. 每個階段有不同攻擊模式
4. Boss 血條 UI
5. 特殊攻擊警告
6. 死亡動畫和獎勵

請提供:
- BossController.cs 完整代碼
- BossHealthBar.cs UI 代碼
- 使用說明
```

### 案例 3: 創建成就系統

**AI 提示詞:**
```
創建一個 Unity 成就系統:

需求:
1. 定義多個成就類型（殺敵、收集、通關等）
2. 進度追蹤
3. 解鎖條件檢查
4. 解鎖時顯示通知
5. 數據持久化
6. 成就列表 UI

請提供完整的實現代碼和使用示例。
```

---

## 🎯 最佳實踐

### 1. 編寫清晰的提示詞

**好的提示詞:**
```
創建一個 Unity 2D 敵人巡邏 AI:
- 在兩點間來回移動
- 使用 Rigidbody2D
- 檢測到懸崖時轉向
- 碰到障礙物時轉向
- 移動速度可調整
- Gizmos 顯示巡邏範圍
```

**不好的提示詞:**
```
做一個敵人 AI
```

### 2. 提供上下文

總是包含:
- 現有代碼（如果是擴展功能）
- 相關的其他腳本
- Unity 版本
- 使用的組件（Rigidbody2D, Animator 等）

### 3. 迭代改進

```
第一次提示: 創建基礎功能
第二次提示: "在上述代碼基礎上添加 [新功能]"
第三次提示: "優化性能並添加錯誤處理"
```

### 4. 測試和驗證

AI 生成的代碼可能需要:
- ✅ 檢查語法錯誤
- ✅ 調整參數
- ✅ 添加空值檢查
- ✅ 測試邊界情況

### 5. 保持代碼風格一致

要求 AI:
```
請遵循以下代碼風格:
- 使用 [Header] 和 [Tooltip] 屬性
- 變數命名使用 camelCase
- 方法使用 PascalCase
- 添加 XML 註解
- 使用 Unity 的命名約定
```

---

## 🚀 快速開始工作流

### 新功能開發流程

```
1. 規劃功能
   ↓
2. 使用 AICodeGenerator 生成提示詞
   ↓
3. 發送給 AI（ChatGPT, Claude, Copilot 等）
   ↓
4. 獲取代碼
   ↓
5. 在 Unity 中測試
   ↓
6. 如有問題，提供錯誤訊息給 AI 調試
   ↓
7. 迭代優化
```

### 調試流程

```
1. 發生錯誤
   ↓
2. 複製完整錯誤訊息
   ↓
3. 準備相關代碼片段
   ↓
4. 使用 AICodeGenerator.GetDebugPrompt()
   ↓
5. 發送給 AI
   ↓
6. 應用修復
```

---

## 📚 提示詞庫

### 常用提示詞

#### 創建選單系統
```
創建一個 Unity 主選單系統:
- 開始遊戲按鈕
- 設定按鈕
- 退出按鈕
- 背景音樂
- 按鈕音效
- 平滑過場動畫
```

#### 創建對話系統
```
創建一個 Unity 對話系統:
- 對話框 UI
- 打字機效果
- 選擇分支
- 角色頭像
- 對話歷史
- 跳過功能
```

#### 創建任務系統
```
創建一個 Unity 任務系統:
- 任務數據結構
- 任務追蹤
- 目標完成檢測
- 任務 UI
- 獎勵系統
- 任務日誌
```

---

## 🎮 實用工具腳本

### 快速測試 AI 提示詞

創建一個測試場景:

```csharp
using UnityEngine;

public class AIPromptTester : MonoBehaviour
{
    [ContextMenu("Test Player Controller Prompt")]
    void TestPlayerPrompt()
    {
        string prompt = AICodeGenerator.Templates.PLAYER_CONTROLLER;
        Debug.Log(prompt);
        GUIUtility.systemCopyBuffer = prompt;
    }

    [ContextMenu("Test Enemy AI Prompt")]
    void TestEnemyPrompt()
    {
        string prompt = AICodeGenerator.Templates.ENEMY_AI;
        Debug.Log(prompt);
        GUIUtility.systemCopyBuffer = prompt;
    }
}
```

右鍵點擊組件即可快速測試！

---

## 📖 學習資源

### AI 工具推薦

1. **ChatGPT** (OpenAI)
   - 優點: 強大的代碼生成能力
   - 適合: 創建新功能、調試問題

2. **Claude** (Anthropic)
   - 優點: 長上下文支援
   - 適合: 大型代碼重構、系統設計

3. **GitHub Copilot**
   - 優點: IDE 整合
   - 適合: 實時代碼補全

4. **Cursor**
   - 優點: 專為編程設計
   - 適合: 整體項目開發

### Unity + AI 學習

- [Unity Learn](https://learn.unity.com/) - 官方教程
- [Brackeys](https://www.youtube.com/user/Brackeys) - 基礎教學
- [Code Monkey](https://www.youtube.com/c/CodeMonkeyUnity) - 進階技巧

---

## 💬 提示詞技巧

### 技巧 1: 分步驟請求

不要:
```
創建一個完整的 RPG 系統
```

而是:
```
第一步: 創建裝備數據結構
第二步: 創建物品欄系統
第三步: 創建裝備系統
第四步: 整合以上系統
```

### 技巧 2: 要求解釋

```
請提供代碼並解釋:
1. 每個方法的作用
2. 為什麼這樣設計
3. 可能的替代方案
4. 性能考量
```

### 技巧 3: 要求測試用例

```
請提供:
1. 完整代碼
2. 測試場景設置說明
3. 測試用例
4. 預期行為描述
```

---

## 🎉 總結

### AI 輔助開發的優勢

- ⚡ **快速原型** - 幾分鐘生成可用代碼
- 📚 **學習工具** - 透過 AI 代碼學習最佳實踐
- 🐛 **調試助手** - 快速找到和修復問題
- 💡 **創意激發** - AI 提供多種實現方案

### 注意事項

- ⚠️ 始終理解 AI 生成的代碼
- ⚠️ 測試所有生成的功能
- ⚠️ 根據項目需求調整代碼
- ⚠️ 保持代碼整潔和可維護性

---

**🎮 使用 AI 加速你的 Unity 遊戲開發！**

**最後更新**: 2025-11-18
**適用版本**: Unity 2022 LTS+
**AI 工具**: ChatGPT, Claude, Copilot 等
