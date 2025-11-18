using UnityEngine;

/// <summary>
/// AI 代碼生成器輔助工具
/// 提供常用的 AI 提示詞模板，幫助開發者快速生成代碼
/// </summary>
public static class AICodeGenerator
{
    /// <summary>
    /// 獲取創建新腳本的 AI 提示詞
    /// </summary>
    public static string GetCreateScriptPrompt(string scriptName, string description, string[] features)
    {
        string prompt = $@"創建一個 Unity C# 腳本 '{scriptName}'

描述: {description}

功能需求:
{string.Join("\n", features)}

請提供:
1. 完整的 C# 代碼
2. 必要的註解
3. Inspector 可編輯的公開變數
4. 適當的錯誤處理
5. Gizmos 可視化（如果需要）

代碼風格:
- 使用 [Tooltip] 屬性
- 使用 [Header] 分組
- 變數命名使用 camelCase
- 方法名使用 PascalCase
- 添加 XML 註解";

        return prompt;
    }

    /// <summary>
    /// 獲取優化腳本的 AI 提示詞
    /// </summary>
    public static string GetOptimizeScriptPrompt(string currentCode, string[] issues)
    {
        string prompt = $@"優化以下 Unity C# 代碼:

當前代碼:
```csharp
{currentCode}
```

已知問題:
{string.Join("\n", issues)}

請提供:
1. 優化後的代碼
2. 性能改進說明
3. 修復的問題列表
4. 最佳實踐建議";

        return prompt;
    }

    /// <summary>
    /// 獲取調試問題的 AI 提示詞
    /// </summary>
    public static string GetDebugPrompt(string errorMessage, string codeSnippet, string context)
    {
        string prompt = $@"Unity 遊戲開發調試:

錯誤訊息:
{errorMessage}

相關代碼:
```csharp
{codeSnippet}
```

上下文信息:
{context}

請提供:
1. 錯誤原因分析
2. 修復建議
3. 完整的修復代碼
4. 預防類似問題的建議";

        return prompt;
    }

    /// <summary>
    /// 獲取添加新功能的 AI 提示詞
    /// </summary>
    public static string GetAddFeaturePrompt(string existingCode, string newFeature)
    {
        string prompt = $@"在現有的 Unity 腳本中添加新功能:

現有代碼:
```csharp
{existingCode}
```

新功能需求:
{newFeature}

請提供:
1. 修改後的完整代碼
2. 新增的變數和方法說明
3. 使用方法示例
4. 可能需要的其他腳本或組件";

        return prompt;
    }

    /// <summary>
    /// 常用功能提示詞模板
    /// </summary>
    public static class Templates
    {
        public const string PLAYER_CONTROLLER = @"創建一個 Unity 2D 平台跳躍遊戲的玩家控制器:
- WASD/方向鍵移動
- 空格跳躍
- 地面檢測
- 支援雙跳（可選）
- 流暢的加速和減速
- 動畫狀態控制
- 包含可調整參數";

        public const string ENEMY_AI = @"創建一個智能敵人 AI:
- 巡邏行為
- 檢測並追擊玩家
- 攻擊行為
- 生命值系統
- 死亡處理和掉落物品
- Gizmos 顯示偵測範圍";

        public const string INVENTORY_SYSTEM = @"創建一個物品欄系統:
- 固定格子數量
- 物品可堆疊
- 拖拽功能
- 裝備系統
- 使用物品功能
- UI 更新
- 保存和載入";

        public const string SAVE_SYSTEM = @"創建一個完整的存檔系統:
- 使用 JSON 格式
- 保存玩家狀態
- 保存遊戲進度
- 自動保存功能
- 多存檔槽位
- 數據加密（可選）";

        public const string UI_MANAGER = @"創建一個 UI 管理器:
- 生命值顯示
- 分數顯示
- 主選單
- 暫停選單
- 遊戲結束畫面
- 設定選單
- 平滑的過場動畫";

        public const string AUDIO_MANAGER = @"創建一個音效管理器:
- 背景音樂播放
- 音效播放
- 音量控制
- 音樂淡入淡出
- 對象池（避免頻繁創建）
- 單例模式";

        public const string OBJECT_POOLER = @"創建一個對象池系統:
- 預先創建對象
- 對象重用
- 自動擴展（可選）
- 支援多種對象類型
- 性能優化
- 清理功能";

        public const string CAMERA_CONTROLLER = @"創建一個 2D 相機控制器:
- 平滑跟隨玩家
- 邊界限制
- 相機震動效果
- 視差效果支援
- 縮放功能
- 目標切換";
    }

    /// <summary>
    /// 生成完整的功能實現提示詞
    /// </summary>
    public static string GenerateFeaturePrompt(string featureTemplate, string[] customizations = null)
    {
        string prompt = featureTemplate;

        if (customizations != null && customizations.Length > 0)
        {
            prompt += "\n\n額外需求:\n" + string.Join("\n", customizations);
        }

        prompt += "\n\n請提供完整的 Unity C# 實現代碼，包含詳細註解和使用說明。";

        return prompt;
    }

    /// <summary>
    /// 輸出到控制台（方便複製）
    /// </summary>
    public static void PrintToConsole(string prompt)
    {
        Debug.Log("=== AI 提示詞 ===\n" + prompt + "\n================");
    }
}

#if UNITY_EDITOR
/// <summary>
/// Unity 編輯器工具 - 快速訪問 AI 代碼生成器
/// </summary>
public class AICodeGeneratorMenu
{
    [UnityEditor.MenuItem("Tools/AI Tools/Generate Player Controller")]
    static void GeneratePlayerController()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.PLAYER_CONTROLLER);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }

    [UnityEditor.MenuItem("Tools/AI Tools/Generate Enemy AI")]
    static void GenerateEnemyAI()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.ENEMY_AI);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }

    [UnityEditor.MenuItem("Tools/AI Tools/Generate Inventory System")]
    static void GenerateInventorySystem()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.INVENTORY_SYSTEM);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }

    [UnityEditor.MenuItem("Tools/AI Tools/Generate Save System")]
    static void GenerateSaveSystem()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.SAVE_SYSTEM);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }

    [UnityEditor.MenuItem("Tools/AI Tools/Generate UI Manager")]
    static void GenerateUIManager()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.UI_MANAGER);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }

    [UnityEditor.MenuItem("Tools/AI Tools/Generate Audio Manager")]
    static void GenerateAudioManager()
    {
        string prompt = AICodeGenerator.GenerateFeaturePrompt(AICodeGenerator.Templates.AUDIO_MANAGER);
        AICodeGenerator.PrintToConsole(prompt);
        GUIUtility.systemCopyBuffer = prompt;
        Debug.Log("提示詞已複製到剪貼板！");
    }
}
#endif
