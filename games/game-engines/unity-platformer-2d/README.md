# Unity 2D 平台跳躍遊戲
🤖 **AI-Driven | AI-Native** 🚀

使用 Unity 引擎開發的 2D 平台跳躍遊戲，展示 Unity 2D 遊戲開發的核心功能。

## 📋 專案概述

這是一個經典的 2D 平台跳躍遊戲，玩家控制角色在平台間跳躍、收集金幣、避開障礙物。本專案展示了 Unity 2D 遊戲開發的基礎技術。

### 遊戲特色

- ✅ 流暢的角色移動與跳躍
- ✅ 物理碰撞系統
- ✅ 收集品系統（金幣、寶石）
- ✅ 相機跟隨系統
- ✅ 簡單的關卡設計
- ✅ UI 系統（分數、生命值）

## 🎮 遊戲玩法

- **移動**：A/D 或 左右方向鍵
- **跳躍**：Space 或 W
- **目標**：收集所有金幣到達終點

## 🛠️ 技術棧

### Unity 版本
- **Unity 2022 LTS** (推薦 2022.3.x)
- **Unity 6** (2023.x+) 也支援

### 核心技術

#### 2D 系統
- **Sprite Renderer** - 2D 圖形渲染
- **Tilemap** - 關卡地圖系統
- **2D Collider** - 碰撞檢測
- **Rigidbody2D** - 2D 物理系統

#### 腳本
- **C#** - 遊戲邏輯
- **MonoBehaviour** - Unity 生命週期
- **Input System** - 輸入處理

#### 動畫
- **Animator Controller** - 動畫控制
- **Animation Clips** - 動畫片段

## 📁 專案結構

```
unity-platformer-2d/
├── Assets/
│   ├── Scenes/
│   │   └── MainScene.unity         # 主場景
│   ├── Scripts/
│   │   ├── PlayerController.cs     # 玩家控制器
│   │   ├── CameraFollow.cs         # 相機跟隨
│   │   ├── Collectible.cs          # 收集品邏輯
│   │   ├── GameManager.cs          # 遊戲管理器
│   │   └── UIManager.cs            # UI 管理器
│   ├── Sprites/
│   │   ├── Player/                 # 玩家精靈圖
│   │   ├── Environment/            # 環境元素
│   │   └── Collectibles/           # 收集品圖片
│   ├── Prefabs/
│   │   ├── Player.prefab           # 玩家預製體
│   │   ├── Coin.prefab             # 金幣預製體
│   │   └── Platform.prefab         # 平台預製體
│   ├── Materials/
│   │   └── PhysicsMaterial2D/      # 物理材質
│   └── Audio/
│       ├── BGM/                    # 背景音樂
│       └── SFX/                    # 音效
├── ProjectSettings/
│   └── ProjectVersion.txt          # Unity 版本
├── Packages/
│   └── manifest.json               # 套件清單
└── README.md
```

## 🚀 快速開始

### 環境需求

- **Unity Hub** 2.0+
- **Unity 2022 LTS** 或更新版本
- **Visual Studio** 或 **Visual Studio Code**（用於編輯 C# 腳本）

### 安裝步驟

#### 1. 安裝 Unity

```bash
# 下載 Unity Hub
# https://unity.com/download

# 安裝 Unity 2022 LTS
# 通過 Unity Hub 安裝，選擇以下模組：
# - Android Build Support（如需移動平台）
# - iOS Build Support（如需 iOS）
# - WebGL Build Support（如需網頁平台）
```

#### 2. 打開專案

```bash
# 使用 Unity Hub 打開專案
# File > Open > 選擇專案資料夾

# 或使用命令列
unity -projectPath /path/to/unity-platformer-2d
```

#### 3. 運行遊戲

1. 在 Unity 編輯器中打開 `Assets/Scenes/MainScene.unity`
2. 點擊播放按鈕（或按 Ctrl+P / Cmd+P）
3. 使用鍵盤控制角色移動和跳躍

## 💻 核心腳本

### PlayerController.cs

玩家角色控制器，處理移動、跳躍和動畫。

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [Header("移動設定")]
    public float moveSpeed = 5f;
    public float jumpForce = 10f;

    [Header("地面檢測")]
    public Transform groundCheck;
    public float groundCheckRadius = 0.2f;
    public LayerMask groundLayer;

    private Rigidbody2D rb;
    private Animator animator;
    private bool isGrounded;
    private float moveInput;

    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        animator = GetComponent<Animator>();
    }

    void Update()
    {
        // 獲取輸入
        moveInput = Input.GetAxisRaw("Horizontal");

        // 地面檢測
        isGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer);

        // 跳躍
        if (Input.GetButtonDown("Jump") && isGrounded)
        {
            rb.velocity = new Vector2(rb.velocity.x, jumpForce);
        }

        // 動畫更新
        animator.SetFloat("Speed", Mathf.Abs(moveInput));
        animator.SetBool("IsGrounded", isGrounded);

        // 翻轉角色
        if (moveInput > 0)
            transform.localScale = new Vector3(1, 1, 1);
        else if (moveInput < 0)
            transform.localScale = new Vector3(-1, 1, 1);
    }

    void FixedUpdate()
    {
        // 移動
        rb.velocity = new Vector2(moveInput * moveSpeed, rb.velocity.y);
    }

    void OnDrawGizmosSelected()
    {
        if (groundCheck == null) return;
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
    }
}
```

### CameraFollow.cs

相機平滑跟隨玩家。

```csharp
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [Header("跟隨設定")]
    public Transform target;
    public float smoothSpeed = 0.125f;
    public Vector3 offset = new Vector3(0, 0, -10);

    [Header("邊界限制")]
    public bool useBounds = false;
    public float minX, maxX, minY, maxY;

    void LateUpdate()
    {
        if (target == null) return;

        Vector3 desiredPosition = target.position + offset;

        // 應用邊界限制
        if (useBounds)
        {
            desiredPosition.x = Mathf.Clamp(desiredPosition.x, minX, maxX);
            desiredPosition.y = Mathf.Clamp(desiredPosition.y, minY, maxY);
        }

        Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed);
        transform.position = smoothedPosition;
    }
}
```

### Collectible.cs

收集品（金幣、寶石）邏輯。

```csharp
using UnityEngine;

public class Collectible : MonoBehaviour
{
    [Header("收集品設定")]
    public int value = 10;
    public AudioClip collectSound;

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.CompareTag("Player"))
        {
            // 播放音效
            if (collectSound != null)
                AudioSource.PlayClipAtPoint(collectSound, transform.position);

            // 增加分數
            GameManager.Instance?.AddScore(value);

            // 銷毀收集品
            Destroy(gameObject);
        }
    }
}
```

### GameManager.cs

遊戲管理器，處理分數、生命等遊戲狀態。

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    [Header("遊戲狀態")]
    public int score = 0;
    public int lives = 3;

    private UIManager uiManager;

    void Awake()
    {
        // 單例模式
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Start()
    {
        uiManager = FindObjectOfType<UIManager>();
        UpdateUI();
    }

    public void AddScore(int points)
    {
        score += points;
        UpdateUI();
    }

    public void LoseLife()
    {
        lives--;
        UpdateUI();

        if (lives <= 0)
        {
            GameOver();
        }
    }

    void UpdateUI()
    {
        if (uiManager != null)
        {
            uiManager.UpdateScore(score);
            uiManager.UpdateLives(lives);
        }
    }

    void GameOver()
    {
        Debug.Log("Game Over!");
        // 重新載入場景
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }

    public void RestartGame()
    {
        score = 0;
        lives = 3;
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}
```

### UIManager.cs

UI 管理器，更新分數、生命值顯示。

```csharp
using UnityEngine;
using UnityEngine.UI;

public class UIManager : MonoBehaviour
{
    [Header("UI 元素")]
    public Text scoreText;
    public Text livesText;

    public void UpdateScore(int score)
    {
        if (scoreText != null)
            scoreText.text = "分數: " + score;
    }

    public void UpdateLives(int lives)
    {
        if (livesText != null)
            livesText.text = "生命: " + lives;
    }
}
```

## 🎨 美術資源

### 免費資源推薦

- **Kenney Assets** - https://kenney.nl/assets
  - 高品質免費 2D 遊戲素材
  - 包含角色、平台、收集品

- **OpenGameArt** - https://opengameart.org/
  - 社群貢獻的免費遊戲素材

- **itch.io** - https://itch.io/game-assets/free
  - 大量免費和付費素材

### 建議尺寸

- **玩家精靈圖**：64x64 或 128x128 像素
- **地板 Tile**：32x32 或 64x64 像素
- **收集品**：32x32 像素

## 🤖 AI 輔助開發

### 1. 腳本生成

向 AI 描述需求：
```
"創建一個 Unity C# 腳本，實現移動平台：
- 在兩點間來回移動
- 平滑移動
- 玩家站在上面會跟隨移動"
```

### 2. 功能擴展

請 AI 添加新功能：
```
"在我的 Unity 2D 平台遊戲中添加雙跳功能，
要求：
- 第一次跳躍在地面
- 第二次跳躍在空中，力度為第一次的 70%
- 使用不同的跳躍音效"
```

### 3. 問題排查

描述問題讓 AI 協助：
```
"我的 Unity 角色穿牆了，這是我的移動代碼：[貼上代碼]
請幫我找出問題並提供解決方案。"
```

## 📊 擴展功能建議

### 初級擴展
- [ ] 敵人 AI（簡單巡邏）
- [ ] 陷阱（尖刺、火焰）
- [ ] 多個關卡
- [ ] 音效和背景音樂

### 中級擴展
- [ ] 存檔系統
- [ ] 不同類型的收集品（加速、雙跳）
- [ ] Boss 戰
- [ ] 粒子效果

### 高級擴展
- [ ] 關卡編輯器
- [ ] 排行榜系統
- [ ] 多人模式
- [ ] 程序生成關卡

## 🐛 常見問題

### Q: 角色穿牆怎麼辦？
**A:**
- 確保使用 `Rigidbody2D` 的 `Continuous` 碰撞檢測
- 檢查移動速度不要太快
- 使用 `FixedUpdate()` 進行物理移動

### Q: 跳躍不流暢？
**A:**
- 調整 `Rigidbody2D` 的 `Gravity Scale`
- 使用變數跳躍高度（按住空格跳得更高）
- 添加 Coyote Time 和 Jump Buffer

### Q: 相機抖動？
**A:**
- 使用 `LateUpdate()` 更新相機位置
- 增加 `smoothSpeed` 值
- 確保相機 Z 軸位置正確（通常為 -10）

## 🚀 建置與發布

### Windows 建置
```
File > Build Settings
選擇 PC, Mac & Linux Standalone
Platform: Windows
Architecture: x86_64
點擊 Build
```

### WebGL 建置
```
File > Build Settings
選擇 WebGL
點擊 Build
上傳到 itch.io 或 GitHub Pages
```

### Android 建置
```
File > Build Settings
選擇 Android
Player Settings > 配置包名、圖標
點擊 Build
```

## 📚 學習資源

### 官方資源
- [Unity Learn](https://learn.unity.com/) - 官方教程
- [Unity Documentation](https://docs.unity3d.com/)
- [Unity Scripting API](https://docs.unity3d.com/ScriptReference/)

### YouTube 教學
- **Brackeys** - Unity 2D 教程（經典）
- **Code Monkey** - 進階技巧
- **Blackthornprod** - 美術與設計
- **Sebastian Lague** - 演算法與系統

### 推薦課程
- **Unity 2D Platformer** (Udemy)
- **Complete C# Unity Game Developer 2D** (GameDev.tv)

## 🎯 開發路線圖

### 第 1 週：基礎
- ✅ 角色移動與跳躍
- ✅ 簡單的關卡設計
- ✅ 收集品系統

### 第 2 週：遊戲性
- ✅ 敵人與障礙
- ✅ 多個關卡
- ✅ UI 系統

### 第 3 週：優化
- ✅ 音效和音樂
- ✅ 粒子效果
- ✅ 動畫優化

### 第 4 週：發布
- ✅ 測試與調試
- ✅ 建置各平台版本
- ✅ 發布到 itch.io

## 📄 授權

本專案使用 MIT 授權條款。

---

**🎮 使用 Unity 和 AI 創造你的 2D 平台遊戲！**

**最後更新**: 2025-11-16
**Unity 版本**: 2022 LTS
**維護狀態**: ✅ 活躍開發
