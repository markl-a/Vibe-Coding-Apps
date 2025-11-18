# 🎮 遊戲引擎專案 (Game Engine Projects) - AI-Native

使用主流遊戲引擎（Unity、Godot、Unreal Engine）開發的跨平台遊戲專案。

## 📋 目錄

- [遊戲引擎概述](#遊戲引擎概述)
- [主流遊戲引擎對比](#主流遊戲引擎對比)
- [Unity 引擎](#unity-引擎)
- [Godot 引擎](#godot-引擎)
- [Unreal Engine](#unreal-engine)
- [其他遊戲引擎](#其他遊戲引擎)
- [AI 輔助開發優勢](#ai-輔助開發優勢)
- [推薦專案方向](#推薦專案方向)
- [開發路線圖](#開發路線圖)
- [引擎選擇指南](#引擎選擇指南)

---

## 🎯 遊戲引擎概述

遊戲引擎是集成了圖形渲染、物理模擬、音效系統、腳本語言等功能的完整開發框架，大幅降低遊戲開發門檻。現代遊戲引擎提供可視化編輯器、資源管理、跨平台導出等強大功能，讓獨立開發者也能創作出高品質遊戲。

### 💡 為什麼使用遊戲引擎？

- **降低門檻**：無需從零實現渲染、物理等底層系統
- **可視化開發**：場景編輯器、可視化腳本
- **跨平台**：一次開發，導出多平台
- **資源豐富**：資源商店、社群資源
- **完整工具鏈**：從開發到發布的全流程工具
- **性能優化**：引擎已優化好的渲染和物理
- **AI 協助強大**：AI 熟悉主流引擎 API

### 🎮 遊戲引擎 vs 從零開發

| 特性 | 遊戲引擎 | 從零開發 |
|------|---------|---------|
| 開發速度 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 學習曲線 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 靈活性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 跨平台 | ✅ 內建 | 需自行實現 |
| 工具支援 | ⭐⭐⭐⭐⭐ | ⭐ |
| 適合場景 | 大部分遊戲 | 特殊需求 |

---

## 🏆 主流遊戲引擎對比

### 綜合對比表

| 引擎 | 語言 | 2D | 3D | 跨平台 | 開源 | 學習曲線 | 市場份額 | AI友好度 | 推薦度 |
|------|------|----|----|--------|------|---------|---------|----------|--------|
| **Unity** | C# | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | 中 | 🥇 第一 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Godot** | GDScript/C# | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 低-中 | 🥉 成長快 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Unreal** | C++/Blueprint | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 高 | 🥈 第二 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **GameMaker** | GML | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ❌ | 低 | 2D專用 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Cocos Creator** | JS/TS | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | 中 | 亞洲流行 | ⭐⭐⭐⭐ | ⭐⭐⭐ |

### 適用場景

```
Unity: 適合幾乎所有類型遊戲
├─ 2D/3D 都優秀
├─ 移動遊戲首選
├─ VR/AR 遊戲
└─ 跨平台導出最完善

Godot: 適合獨立開發者
├─ 2D 遊戲特別出色
├─ 中小型 3D 遊戲
├─ 開源免費、無版稅
└─ 輕量、啟動快

Unreal: 適合 3D 高畫質遊戲
├─ AAA 級畫面
├─ 大型 3D 遊戲
├─ 建築可視化
└─ 影視級渲染
```

---

## 🔷 Unity 引擎

### 概述

Unity 是全球最流行的遊戲引擎，市場份額約 45%，特別在移動遊戲領域佔據統治地位（60%+）。

### 核心優勢

#### 1. **最廣泛的平台支援** ⭐⭐⭐⭐⭐
```
支援平台（20+ 個）：
移動端: iOS, Android
桌面端: Windows, macOS, Linux
Web: WebGL
主機: PlayStation, Xbox, Nintendo Switch
VR/AR: Oculus, HTC Vive, ARCore, ARKit
```

#### 2. **龐大的生態系統**
- **Asset Store**：數萬個資源（模型、音效、工具）
- **社群**：最大的遊戲開發社群
- **教程**：海量學習資源
- **職位**：遊戲公司最需要的技能

#### 3. **2D 與 3D 並重**
- **2D**：專用工具鏈（Tilemap、Sprite Editor）
- **3D**：強大的渲染管線（URP、HDRP）
- **物理**：2D 和 3D 物理引擎

#### 4. **易學的 C# 語言**
```csharp
// Unity C# 範例 - AI 友好
public class PlayerController : MonoBehaviour {
  public float speed = 5f;

  void Update() {
    // 簡單的移動邏輯
    float h = Input.GetAxis("Horizontal");
    float v = Input.GetAxis("Vertical");
    transform.Translate(new Vector3(h, 0, v) * speed * Time.deltaTime);
  }
}
```

### Unity 版本選擇

- **Unity 2022 LTS**（推薦）：長期支援版本
- **Unity 6 (2023+)**：最新功能
- **Unity Personal**：免費（年收入 < $100K）
- **Unity Plus/Pro**：付費版本

### Unity 適合的遊戲類型

#### 優秀 ⭐⭐⭐⭐⭐
- 移動遊戲（休閒、中度）
- 2D 獨立遊戲
- 3D 獨立遊戲
- VR/AR 應用
- 跨平台遊戲

#### 可行 ⭐⭐⭐⭐
- 大型 3D 遊戲（需優化）
- 多人在線遊戲
- 模擬遊戲

### Unity 學習資源

- [Unity Learn](https://learn.unity.com/) - 官方教程
- [Brackeys](https://www.youtube.com/user/Brackeys) - YouTube 教學（已停更但仍有價值）
- [Code Monkey](https://www.youtube.com/c/CodeMonkeyUnity) - 進階教程
- [Unity Asset Store](https://assetstore.unity.com/)

### Unity 成功案例

**移動遊戲**：
- Pokemon GO
- Genshin Impact
- Among Us
- Monument Valley
- Cuphead

**桌面/主機**：
- Hollow Knight
- Ori and the Blind Forest
- Rust
- Hearthstone

---

## 🟢 Godot 引擎

### 概述

Godot 是完全開源、免費的遊戲引擎，近年快速崛起，特別受獨立開發者喜愛。

### 核心優勢

#### 1. **完全開源、零版稅** ⭐⭐⭐⭐⭐
```
優勢：
✅ MIT 授權，完全免費
✅ 無論營收多少都不收費
✅ 可自行修改引擎源碼
✅ 社群驅動開發
```

#### 2. **2D 引擎一流** ⭐⭐⭐⭐⭐
- 專為 2D 設計的節點系統
- 優秀的 Tilemap 工具
- 靈活的動畫系統
- 2D 物理引擎出色

#### 3. **輕量、快速**
- 引擎下載僅 ~40MB
- 啟動快速
- 項目體積小
- 資源佔用低

#### 4. **節點與場景系統**
```
場景系統（獨特設計）：
場景 (Scene)
├─ 節點 (Node) - 基礎單位
│  ├─ Sprite - 圖片
│  ├─ AnimationPlayer - 動畫
│  └─ CollisionShape - 碰撞
└─ 場景可嵌套場景

一切皆節點，組合成場景
```

#### 5. **GDScript 語言**
```python
# GDScript - 類似 Python，AI 友好
extends KinematicBody2D

export var speed = 200

func _physics_process(delta):
  var velocity = Vector2()

  if Input.is_action_pressed("ui_right"):
    velocity.x += 1
  if Input.is_action_pressed("ui_left"):
    velocity.x -= 1

  velocity = velocity.normalized() * speed
  move_and_slide(velocity)
```

#### 6. **也支援 C#**
- Godot 3.x+：可用 C#
- 與 Unity 類似的開發體驗
- 適合 Unity 轉來的開發者

### Godot 版本

- **Godot 3.x**：穩定、成熟
- **Godot 4.x**：重大更新（Vulkan、C# 改進）
- 推薦：**Godot 4.2+**

### Godot 適合的遊戲類型

#### 優秀 ⭐⭐⭐⭐⭐
- 2D 獨立遊戲
- 像素遊戲
- 平台跳躍
- Roguelike/Roguelite
- 益智遊戲

#### 可行 ⭐⭐⭐⭐
- 中小型 3D 遊戲
- 模擬遊戲
- 策略遊戲

#### 不太適合 ⭐⭐
- 大型 3D 遊戲（性能限制）
- AAA 級畫面
- VR/AR（支援有限）

### Godot 學習資源

- [Godot 官方文檔](https://docs.godotengine.org/)
- [GDQuest](https://www.gdquest.com/) - 優質教程
- [HeartBeast](https://www.youtube.com/user/uheartbeast) - YouTube
- [KidsCanCode](https://kidscancode.org/godot_recipes/) - 實用技巧

### Godot 成功案例

- **Dome Keeper** - Roguelite
- **Sonic Colors: Ultimate** - 平台跳躍
- **Kingdoms of the Dump** - 策略
- 大量獨立 2D 遊戲

### 為什麼選擇 Godot？

```
適合你如果：
✅ 開發 2D 遊戲
✅ 想要完全免費的引擎
✅ 喜歡開源軟體
✅ 獨立開發者
✅ 不需要移動平台優化（Unity 更好）

不適合你如果：
❌ 需要 AAA 級 3D 畫面
❌ 開發移動遊戲（Unity 生態更好）
❌ 需要 VR/AR
❌ 大團隊協作（工具鏈不如 Unity/Unreal）
```

---

## 🔵 Unreal Engine

### 概述

Unreal Engine 是 Epic Games 開發的頂級遊戲引擎，以高品質 3D 圖形著稱，AAA 遊戲首選。

### 核心優勢

#### 1. **頂級圖形品質** ⭐⭐⭐⭐⭐
```
渲染技術：
✅ Nanite - 虛擬幾何體系統
✅ Lumen - 動態全局光照
✅ Niagara - 粒子系統
✅ Metahuman - 逼真人類角色
✅ Chaos - 物理與破壞系統
```

#### 2. **藍圖可視化編程** ⭐⭐⭐⭐⭐
```
Blueprint (藍圖):
- 無需編寫代碼
- 節點拖拽連接
- 實時預覽
- 快速原型開發
- 適合設計師、美術
```

#### 3. **C++ 深度控制**
```cpp
// Unreal C++ - 高性能
UCLASS()
class AMyCharacter : public ACharacter {
  GENERATED_BODY()

  UPROPERTY(EditAnywhere)
  float Speed = 600.f;

  void Tick(float DeltaTime) override {
    // 遊戲邏輯
  }
};
```

#### 4. **免費 + 版稅模式**
```
授權：
✅ 免費下載使用
✅ 源碼完全開放
✅ 營收 $1M 以下：0 版稅
✅ 營收 $1M 以上：5% 版稅
```

### Unreal 版本

- **Unreal Engine 5.x**（推薦）：最新技術
- **UE4**：仍被廣泛使用

### Unreal 適合的遊戲類型

#### 優秀 ⭐⭐⭐⭐⭐
- 3D AAA 級遊戲
- 第一人稱射擊
- 第三人稱動作
- 開放世界
- 建築可視化
- 虛擬製作（影視）

#### 可行 ⭐⭐⭐
- 中型 3D 遊戲
- VR/AR 應用

#### 不適合 ⭐
- 2D 遊戲（工具鏈不如 Unity/Godot）
- 移動遊戲（性能要求高）
- 簡單小遊戲（殺雞用牛刀）

### Unreal 學習資源

- [Unreal Online Learning](https://www.unrealengine.com/en-US/onlinelearning)
- [Unreal 官方文檔](https://docs.unrealengine.com/)
- [Virtus Learning Hub](https://www.youtube.com/c/VirtusEdu)

### Unreal 成功案例

**AAA 遊戲**：
- Fortnite
- Gears of War 系列
- Kingdom Hearts III
- Final Fantasy VII Remake
- Borderlands 3

**獨立遊戲**：
- Kena: Bridge of Spirits
- Little Nightmares II

### 為什麼選擇 Unreal？

```
適合你如果：
✅ 開發 3D 遊戲
✅ 追求頂級畫面
✅ 有 C++ 經驗或願意學習
✅ 開發主機/PC 遊戲
✅ 建築可視化、影視項目

不適合你如果：
❌ 開發 2D 遊戲
❌ 移動遊戲
❌ 初學者（學習曲線陡）
❌ 低端硬體開發
```

---

## 🎮 其他遊戲引擎

### GameMaker Studio 2

#### 特點
- **專注 2D**：2D 遊戲專用引擎
- **拖拽編輯**：可視化開發
- **GML 語言**：類 JavaScript
- **快速原型**：適合 Game Jam

#### 成功案例
- **Undertale** - 獨立 RPG 爆款
- **Hyper Light Drifter**
- **Hotline Miami**

#### 適合
- 2D 遊戲
- 獨立開發者
- 快速原型

### Cocos Creator

#### 特點
- **JavaScript/TypeScript**
- **開源免費**
- **亞洲流行**（特別是中國）
- **小遊戲**：微信、抖音小遊戲

#### 適合
- 休閒遊戲
- 小遊戲平台
- Web 遊戲

### Construct 3

#### 特點
- **無代碼**：完全可視化
- **瀏覽器開發**：基於 Web
- **快速**：極快原型開發

#### 適合
- 非程式設計師
- 教育用途
- 簡單 2D 遊戲

### RPG Maker

#### 特點
- **專為 RPG**：JRPG 專用
- **資料庫驅動**：角色、道具、技能
- **腳本支援**：Ruby（VX Ace）、JavaScript（MV/MZ）

#### 適合
- 2D RPG
- 日式 RPG
- 故事驅動遊戲

---

## 🤖 AI 輔助開發優勢

### 1. Unity AI 輔助

#### 腳本生成
```csharp
// AI 提示：創建一個第三人稱角色控制器
public class ThirdPersonController : MonoBehaviour {
  // AI 生成完整的控制器邏輯
  // - WASD 移動
  // - 滑鼠視角控制
  // - 空格跳躍
  // - Shift 衝刺
}
```

#### 系統設計
```
AI 提示：
"設計一個 RPG 裝備系統，包括：
- 裝備類型（武器、防具）
- 屬性加成
- 套裝效果
- 強化系統
請提供 C# 類別設計"
```

### 2. Godot AI 輔助

#### GDScript 生成
```python
# AI 提示：創建敵人 AI（追擊玩家）
extends KinematicBody2D

# AI 生成完整的敵人行為
# - 檢測玩家
# - 追擊移動
# - 攻擊判定
# - 受傷處理
```

### 3. Unreal AI 輔助

#### Blueprint 設計
```
AI 提示：
"描述 Unreal Blueprint 流程：
當玩家進入觸發區域時，
播放過場動畫，然後生成敵人波次"

AI 提供節點連接邏輯
```

#### C++ 代碼
```cpp
// AI 提示：實現一個可互動物品基類
UCLASS()
class AInteractableObject : public AActor {
  // AI 生成互動系統
};
```

### 4. 通用 AI 輔助

#### 算法實現
- **A* 尋路**：AI 生成尋路系統
- **程序生成**：地牢、地形生成算法
- **狀態機**：敵人 AI 狀態管理
- **物品系統**：裝備、物品欄

#### 優化建議
```
AI 提示：
"我的 Unity 遊戲在移動端 FPS 只有 30，
這是我的渲染設置：[貼上設置]
請提供優化建議"
```

#### 問題排查
```
AI 提示：
"Unity 中，玩家有時會穿過牆壁，
這是我的碰撞設置和移動代碼：[貼上代碼]
請幫我找出問題"
```

---

## 🎯 推薦專案方向

### Unity 專案

#### 初級（1-3 個月）⭐⭐
1. **2D 平台跳躍遊戲**
   - 關卡、收集品、敵人
   - 學習 Unity 2D 工具鏈

2. **3D 第一人稱探索**
   - 第一人稱控制器
   - 簡單解謎
   - 學習 3D 基礎

3. **塔防遊戲**
   - 建塔、敵人、升級
   - 學習 UI、尋路

#### 中級（3-6 個月）⭐⭐⭐⭐
4. **2D Roguelike**
   - 程序生成、永久死亡
   - 物品、戰鬥系統

5. **3D 動作遊戲**
   - 戰鬥系統、技能
   - 敵人 AI

6. **移動休閒遊戲**
   - 觸控操作
   - 內購、廣告整合

#### 高級（6+ 個月）⭐⭐⭐⭐⭐
7. **多人對戰遊戲**
   - Netcode/Mirror
   - 房間系統、匹配

8. **開放世界 RPG**
   - 大型地圖、任務系統
   - 裝備、技能樹

### Godot 專案

#### 初級（1-3 個月）⭐⭐
1. **2D 平台跳躍**
   - 學習 Godot 節點系統
   - Tilemap、動畫

2. **益智遊戲**
   - 物理益智、邏輯解謎
   - 關卡設計

#### 中級（3-6 個月）⭐⭐⭐⭐
3. **2D Roguelite**
   - 程序生成、戰鬥
   - 物品、升級

4. **像素 RPG**
   - 對話系統、任務
   - 戰鬥、裝備

#### 高級（6+ 個月）⭐⭐⭐⭐⭐
5. **2D Metroidvania**
   - 大型地圖、能力解鎖
   - Boss 戰

### Unreal 專案

#### 中級（3-6 個月）⭐⭐⭐⭐
1. **3D 第一人稱射擊**
   - FPS 控制器、武器
   - AI 敵人

2. **第三人稱冒險**
   - 動作、解謎
   - 環境互動

#### 高級（6+ 個月）⭐⭐⭐⭐⭐
3. **開放世界探索**
   - 大型場景、動態載入
   - 任務、對話系統

4. **多人競技遊戲**
   - Dedicated Server
   - 技能、排行榜

---

## 🗺️ 開發路線圖

### Unity 學習路徑

#### 第 1-2 週：基礎
```
1. Unity 界面熟悉
   - Scene、Hierarchy、Inspector
   - Project、Console

2. GameObject 與 Component
   - Transform、Renderer、Collider
   - 組件化設計

3. C# 基礎
   - 變數、函式、類別
   - MonoBehaviour 生命週期

4. 第一個專案
   - Roll-a-Ball 官方教程
```

#### 第 3-4 週：2D 遊戲
```
1. Unity 2D 工具
   - Sprite、Tilemap
   - 2D Collider、Rigidbody2D

2. 動畫系統
   - Animator Controller
   - Animation Clip

3. 第一個 2D 遊戲
   - 平台跳躍或射擊
```

#### 第 5-8 週：3D 遊戲
```
1. 3D 基礎
   - 材質、光照
   - 相機控制

2. 物理系統
   - Rigidbody、Collider
   - 射線檢測

3. 第一個 3D 遊戲
   - 第一人稱或第三人稱
```

#### 第 9-12 週：完整專案
```
1. UI 系統
   - Canvas、Button、Text
   - 主選單、HUD

2. 音效
   - AudioSource、AudioMixer

3. 存檔系統
   - PlayerPrefs、JSON

4. 完成一個完整遊戲
```

### Godot 學習路徑

#### 第 1-2 週：基礎
```
1. Godot 界面
   - 場景編輯器、節點系統

2. GDScript 語言
   - 類似 Python 的語法
   - 信號 (Signals) 系統

3. 第一個專案
   - 官方 Dodge the Creeps 教程
```

#### 第 3-6 週：2D 遊戲
```
1. 2D 節點
   - Sprite、AnimatedSprite
   - KinematicBody2D、Area2D

2. Tilemap 與場景
   - TileMap、TileSet
   - 場景實例化

3. 完成 2D 遊戲
```

### Unreal 學習路徑

#### 第 1-3 週：基礎
```
1. Unreal 界面
   - 視口、內容瀏覽器
   - 細節面板

2. Blueprint 基礎
   - 節點、變數、函式
   - 事件圖表

3. 第一個專案
   - 第三人稱模板修改
```

#### 第 4-8 週：進階
```
1. 材質系統
   - Material Editor
   - 程序化材質

2. 動畫與物理
   - Animation Blueprint
   - Physics

3. 完成簡單 3D 遊戲
```

---

## 🎓 引擎選擇指南

### 決策流程圖

```
你的遊戲類型？
│
├─ 2D 遊戲
│  ├─ 想要免費開源 → Godot ⭐⭐⭐⭐⭐
│  ├─ 需要移動平台 → Unity ⭐⭐⭐⭐⭐
│  └─ 超簡單遊戲 → GameMaker ⭐⭐⭐⭐
│
├─ 3D 遊戲
│  ├─ 小型獨立遊戲
│  │  ├─ 開源偏好 → Godot ⭐⭐⭐⭐
│  │  └─ 跨平台需求 → Unity ⭐⭐⭐⭐⭐
│  │
│  ├─ 中型遊戲 → Unity ⭐⭐⭐⭐⭐
│  │
│  └─ 高畫質/AAA → Unreal ⭐⭐⭐⭐⭐
│
├─ 移動遊戲 → Unity ⭐⭐⭐⭐⭐
│
├─ VR/AR → Unity 或 Unreal ⭐⭐⭐⭐⭐
│
└─ 多人遊戲
   ├─ 小型 → Unity + Mirror ⭐⭐⭐⭐
   └─ 大型 → Unreal ⭐⭐⭐⭐⭐
```

### 按經驗選擇

#### 初學者
- **首選**：Godot（簡單、免費）
- **次選**：Unity（資源多）
- **避免**：Unreal（太複雜）

#### 有程式設計經驗
- **首選**：Unity（生態好）
- **次選**：Godot（開源）
- **可選**：Unreal（高畫質需求）

#### 專業開發者
- **看需求**：根據專案選擇
- Unity：跨平台、移動
- Unreal：高畫質、主機

### 按預算選擇

#### 零預算
- **Godot** - 完全免費
- **Unity Personal** - 免費（有限制）
- **Unreal** - 免費（營收後收費）

#### 有預算
- **Unity Plus/Pro** - $40-$150/月
- **Unreal** - 免費但營收 5%

---

## 🎉 總結與建議

### ✅ 遊戲引擎開發是最佳選擇！

**理由**：
1. **降低門檻**：無需從零實現底層系統
2. **提高效率**：可視化工具、跨平台導出
3. **生態豐富**：資源商店、社群支援
4. **AI 協助強**：AI 熟悉主流引擎 API
5. **職業發展**：掌握 Unity/Unreal 是就業技能

### 🎯 推薦選擇

#### 大部分情況：Unity
- 跨平台最好
- 生態最豐富
- 學習資源最多
- 2D/3D 都優秀
- AI 友好度最高

#### 獨立開發 2D 遊戲：Godot
- 完全免費
- 2D 工具一流
- 輕量快速
- 社群友好

#### 追求頂級畫面：Unreal
- 3D 圖形最佳
- AAA 級品質
- Blueprint 易上手
- 適合主機/PC

### 🤖 AI 使用建議

```
優秀的 AI 提示詞：

"使用 Unity C# 創建一個庫存系統：
- 物品類別（裝備、消耗品、材料）
- 格子佈局（5x6 = 30 格）
- 拖拽功能
- 堆疊相同物品
- 裝備欄（頭、身、武器）
請提供完整的類別設計和 UI 邏輯"
```

---

## 🆕 最新更新

### AI 輔助開發工具 (2025-11-18)

本專案現已包含完整的 AI 輔助開發工具和範例！

#### Unity 專案增強 ✅
- **AICodeGenerator.cs** - Unity 編輯器整合的 AI 代碼生成器
  - 10+ 預設功能模板
  - 編輯器菜單快速訪問
  - 自動複製到剪貼板
- **新增實用腳本**:
  - EnemyAI.cs - 完整的敵人 AI (巡邏/追擊/攻擊)
  - PlayerHealth.cs - 生命值系統
  - PowerUp.cs - 多種道具系統
  - MovingPlatform.cs - 移動平台
  - SaveSystem.cs - JSON 存檔系統
- **AI-GUIDE.md** - 完整的 Unity AI 輔助開發指南

#### Godot 專案增強 ✅
- **AIHelper.gd** - Godot 專用 AI 提示詞生成器
  - GDScript 語法優化
  - EditorScript 支援
  - 場景設置提示詞
- **Dodge 遊戲**:
  - SETUP-GUIDE.md - 詳細的場景創建步驟指南
  - AI-GUIDE.md - Godot AI 輔助開發指南
- **Roguelike 遊戲**:
  - 完整的物品系統實作 (item.gd, inventory.gd)
  - 物品數據庫系統 (item_database.gd)
  - 消耗品和裝備系統
  - ITEM-SYSTEM-GUIDE.md - 物品系統完整文檔

#### 跨引擎 AI 工具 ✅
- **AI-TOOLS-GUIDE.md** - 跨引擎 AI 輔助工具集合
  - 通用提示詞模板
  - 引擎特定技巧
  - 完整開發流程
  - 最佳實踐指南

### 使用 AI 工具快速開始

**Unity**:
```csharp
// 在編輯器中
Tools > AI Tools > Generate Player Controller

// 或在代碼中
var prompt = AICodeGenerator.GenerateFeaturePrompt(
    AICodeGenerator.Templates.ENEMY_AI
);
AICodeGenerator.PrintToConsole(prompt);
```

**Godot**:
```gdscript
# 使用 AIHelper
var prompt = AIHelper.generate_common_prompt("inventory")
AIHelper.copy_to_clipboard(prompt)

# 或使用 EditorScript
@tool
extends EditorScript
func _run():
    print(AIHelper.PromptTemplates.PLAYER_CONTROLLER)
```

### 專案結構更新

```
game-engines/
├── AI-TOOLS-GUIDE.md          # 跨引擎 AI 工具指南 ✨ NEW
├── unity-platformer-2d/
│   ├── AI-GUIDE.md            # Unity AI 指南 ✨ NEW
│   └── Assets/Scripts/
│       ├── AI-Tools/
│       │   └── AICodeGenerator.cs  ✨ NEW
│       ├── EnemyAI.cs         ✨ NEW
│       ├── PlayerHealth.cs    ✨ NEW
│       ├── PowerUp.cs         ✨ NEW
│       ├── MovingPlatform.cs  ✨ NEW
│       └── SaveSystem.cs      ✨ NEW
├── godot-dodge-game/
│   ├── SETUP-GUIDE.md         # 完整場景設置指南 ✨ NEW
│   ├── AI-GUIDE.md            # Godot AI 指南 ✨ NEW
│   └── scripts/
│       └── AIHelper.gd        ✨ NEW
└── godot-roguelike-2d/
    ├── ITEM-SYSTEM-GUIDE.md   # 物品系統指南 ✨ NEW
    └── scripts/
        ├── item.gd            ✨ NEW
        ├── inventory.gd       ✨ NEW
        ├── consumable_item.gd ✨ NEW
        └── item_database.gd   ✨ NEW
```

### 查看詳細文檔

- [Unity AI 輔助開發指南](unity-platformer-2d/AI-GUIDE.md)
- [Godot AI 輔助開發指南](godot-dodge-game/AI-GUIDE.md)
- [Godot Dodge 遊戲設置指南](godot-dodge-game/SETUP-GUIDE.md)
- [Godot Roguelike 物品系統指南](godot-roguelike-2d/ITEM-SYSTEM-GUIDE.md)
- [跨引擎 AI 工具集合](AI-TOOLS-GUIDE.md)

---

**🎮 選擇適合的引擎，用 AI 加速開發，創造你的遊戲世界！**
