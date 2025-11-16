# Unreal Engine 3D 第一人稱射擊遊戲
🤖 **AI-Driven | AI-Native** 🚀

使用 Unreal Engine 5 開發的 3D 第一人稱射擊遊戲，展示 UE5 的頂級圖形能力和 Blueprint/C++ 混合開發。

## 📋 專案概述

這是一個經典的 3D FPS 遊戲，具有流暢的第一人稱視角、武器系統、敵人 AI 和精美的 3D 圖形。本專案展示了 Unreal Engine 5 的核心功能，包括 Nanite、Lumen 和 Blueprint 可視化編程。

### 遊戲特色

- ✅ 流暢的第一人稱視角控制
- ✅ 多種武器系統（手槍、步槍、霰彈槍）
- ✅ 智能敵人 AI
- ✅ 物理碰撞與破壞系統
- ✅ Lumen 全局光照
- ✅ Nanite 虛擬幾何體
- ✅ Blueprint + C++ 混合開發

## 🎮 遊戲玩法

- **移動**: WASD
- **跳躍**: 空格鍵
- **奔跑**: Left Shift
- **射擊**: 滑鼠左鍵
- **瞄準**: 滑鼠右鍵
- **換彈**: R
- **切換武器**: 1/2/3 或滑鼠滾輪

## 🛠️ 技術棧

### Unreal Engine 版本
- **Unreal Engine 5.3+** (推薦最新穩定版)
- **Unreal Engine 4.27** 也支援（需調整部分功能）

### 核心技術

#### 圖形技術
- **Lumen** - 動態全局光照
- **Nanite** - 虛擬幾何體系統
- **Niagara** - 粒子系統
- **Ray Tracing** - 光線追蹤（可選）
- **Temporal Super Resolution** - 時間超採樣抗鋸齒

#### 編程
- **C++** - 核心遊戲邏輯
- **Blueprint** - 可視化腳本
- **UMG** - UI 系統
- **Enhanced Input** - 增強輸入系統

#### 物理與碰撞
- **Chaos Physics** - 物理引擎
- **Physics Materials** - 物理材質
- **Destructible Meshes** - 可破壞網格

## 📁 專案結構

```
unreal-fps-3d/
├── Content/
│   ├── Blueprints/
│   │   ├── Characters/
│   │   │   ├── BP_PlayerCharacter.uasset
│   │   │   └── BP_EnemyCharacter.uasset
│   │   ├── Weapons/
│   │   │   ├── BP_WeaponBase.uasset
│   │   │   ├── BP_Pistol.uasset
│   │   │   └── BP_Rifle.uasset
│   │   └── GameModes/
│   │       └── BP_FPSGameMode.uasset
│   ├── Maps/
│   │   ├── MainMenu.umap
│   │   ├── Level_01.umap
│   │   └── TestLevel.umap
│   ├── Materials/
│   │   ├── M_Character/
│   │   └── M_Environment/
│   ├── Meshes/
│   ├── Textures/
│   ├── Audio/
│   │   ├── Music/
│   │   └── SFX/
│   └── UI/
│       └── WBP_HUD.uasset
├── Source/
│   └── UnrealFPS/
│       ├── Public/
│       │   ├── FPSCharacter.h
│       │   ├── FPSPlayerController.h
│       │   ├── WeaponBase.h
│       │   └── EnemyAI.h
│       ├── Private/
│       │   ├── FPSCharacter.cpp
│       │   ├── FPSPlayerController.cpp
│       │   ├── WeaponBase.cpp
│       │   └── EnemyAI.cpp
│       └── UnrealFPS.Build.cs
├── Config/
│   ├── DefaultEngine.ini
│   ├── DefaultGame.ini
│   └── DefaultInput.ini
├── UnrealFPS.uproject
└── README.md
```

## 🚀 快速開始

### 環境需求

- **Unreal Engine 5.3+**
- **Visual Studio 2022** (Windows) 或 **Xcode** (macOS)
- **顯示卡**: RTX 2060 或更高（建議 RTX 3060+）
- **RAM**: 16 GB 以上
- **儲存空間**: 50 GB 以上

### 安裝步驟

#### 1. 安裝 Unreal Engine

```bash
# 下載 Epic Games Launcher
# https://www.unrealengine.com/download

# 通過 Launcher 安裝 Unreal Engine 5.3
# 選擇以下組件：
# - Starter Content
# - Engine Source（可選，用於深度開發）
```

#### 2. 打開專案

```bash
# 方法 1: 雙擊 UnrealFPS.uproject

# 方法 2: 通過 Epic Games Launcher
# 選擇 "Library" > "Add" > 選擇專案路徑

# 方法 3: 通過命令列
UE5Editor.exe "C:\path\to\UnrealFPS.uproject"
```

#### 3. 編譯 C++ 代碼

- 在 Unreal Editor 中選擇 **Build** > **Build Solution**
- 或使用 Visual Studio 打開 `.sln` 檔案進行編譯

#### 4. 運行遊戲

- 在編輯器中按 **Play** 按鈕（Alt+P）
- 或選擇 **Play** > **Standalone Game**

## 💻 核心 C++ 代碼

### FPSCharacter.h

第一人稱角色類別定義。

```cpp
// FPSCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "FPSCharacter.generated.h"

UCLASS()
class UNREALFPS_API AFPSCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AFPSCharacter();

    // 移動輸入
    void MoveForward(float Value);
    void MoveRight(float Value);

    // 視角輸入
    void LookUp(float Value);
    void Turn(float Value);

    // 動作輸入
    void StartJump();
    void StopJump();
    void StartSprint();
    void StopSprint();

    // 射擊
    void StartFire();
    void StopFire();

    // 武器系統
    void EquipWeapon(class AWeaponBase* NewWeapon);
    void SwitchWeapon(int32 WeaponIndex);

    // 生命值系統
    UFUNCTION(BlueprintCallable, Category = "Health")
    void TakeDamage(float Damage);

    UFUNCTION(BlueprintCallable, Category = "Health")
    void Heal(float Amount);

protected:
    virtual void BeginPlay() override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

public:
    virtual void Tick(float DeltaTime) override;

    // 組件
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera")
    class UCameraComponent* FirstPersonCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Mesh")
    class USkeletalMeshComponent* FirstPersonMesh;

    // 屬性
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float WalkSpeed = 600.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
    float SprintSpeed = 900.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float MaxHealth = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "Health")
    float CurrentHealth;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    TSubclassOf<class AWeaponBase> DefaultWeaponClass;

private:
    bool bIsSprinting = false;
    class AWeaponBase* CurrentWeapon;
    TArray<class AWeaponBase*> Weapons;
};
```

### FPSCharacter.cpp

第一人稱角色實現。

```cpp
// FPSCharacter.cpp
#include "FPSCharacter.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "WeaponBase.h"

AFPSCharacter::AFPSCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    // 設定碰撞膠囊體
    GetCapsuleComponent()->InitCapsuleSize(42.f, 96.f);

    // 設定視角旋轉
    bUseControllerRotationPitch = true;
    bUseControllerRotationYaw = true;
    bUseControllerRotationRoll = false;

    // 設定角色移動
    GetCharacterMovement()->bOrientRotationToMovement = false;
    GetCharacterMovement()->JumpZVelocity = 600.f;
    GetCharacterMovement()->AirControl = 0.2f;
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;

    // 創建第一人稱相機
    FirstPersonCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
    FirstPersonCamera->SetupAttachment(GetCapsuleComponent());
    FirstPersonCamera->SetRelativeLocation(FVector(0.f, 0.f, 64.f));
    FirstPersonCamera->bUsePawnControlRotation = true;

    // 創建第一人稱手臂網格
    FirstPersonMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("FirstPersonMesh"));
    FirstPersonMesh->SetupAttachment(FirstPersonCamera);
    FirstPersonMesh->SetOnlyOwnerSee(true);
    FirstPersonMesh->bCastDynamicShadow = false;
    FirstPersonMesh->CastShadow = false;

    // 隱藏第三人稱網格（從第一人稱視角）
    GetMesh()->SetOwnerNoSee(true);
}

void AFPSCharacter::BeginPlay()
{
    Super::BeginPlay();

    CurrentHealth = MaxHealth;

    // 生成默認武器
    if (DefaultWeaponClass)
    {
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        SpawnParams.Instigator = this;

        AWeaponBase* DefaultWeapon = GetWorld()->SpawnActor<AWeaponBase>(
            DefaultWeaponClass,
            FVector::ZeroVector,
            FRotator::ZeroRotator,
            SpawnParams
        );

        if (DefaultWeapon)
        {
            EquipWeapon(DefaultWeapon);
        }
    }
}

void AFPSCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void AFPSCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    // 移動綁定
    PlayerInputComponent->BindAxis("MoveForward", this, &AFPSCharacter::MoveForward);
    PlayerInputComponent->BindAxis("MoveRight", this, &AFPSCharacter::MoveRight);

    // 視角綁定
    PlayerInputComponent->BindAxis("LookUp", this, &AFPSCharacter::LookUp);
    PlayerInputComponent->BindAxis("Turn", this, &AFPSCharacter::Turn);

    // 動作綁定
    PlayerInputComponent->BindAction("Jump", IE_Pressed, this, &AFPSCharacter::StartJump);
    PlayerInputComponent->BindAction("Jump", IE_Released, this, &AFPSCharacter::StopJump);
    PlayerInputComponent->BindAction("Sprint", IE_Pressed, this, &AFPSCharacter::StartSprint);
    PlayerInputComponent->BindAction("Sprint", IE_Released, this, &AFPSCharacter::StopSprint);

    // 射擊綁定
    PlayerInputComponent->BindAction("Fire", IE_Pressed, this, &AFPSCharacter::StartFire);
    PlayerInputComponent->BindAction("Fire", IE_Released, this, &AFPSCharacter::StopFire);
}

void AFPSCharacter::MoveForward(float Value)
{
    if (Value != 0.0f)
    {
        AddMovementInput(GetActorForwardVector(), Value);
    }
}

void AFPSCharacter::MoveRight(float Value)
{
    if (Value != 0.0f)
    {
        AddMovementInput(GetActorRightVector(), Value);
    }
}

void AFPSCharacter::LookUp(float Value)
{
    AddControllerPitchInput(Value);
}

void AFPSCharacter::Turn(float Value)
{
    AddControllerYawInput(Value);
}

void AFPSCharacter::StartJump()
{
    Jump();
}

void AFPSCharacter::StopJump()
{
    StopJumping();
}

void AFPSCharacter::StartSprint()
{
    bIsSprinting = true;
    GetCharacterMovement()->MaxWalkSpeed = SprintSpeed;
}

void AFPSCharacter::StopSprint()
{
    bIsSprinting = false;
    GetCharacterMovement()->MaxWalkSpeed = WalkSpeed;
}

void AFPSCharacter::StartFire()
{
    if (CurrentWeapon)
    {
        CurrentWeapon->StartFire();
    }
}

void AFPSCharacter::StopFire()
{
    if (CurrentWeapon)
    {
        CurrentWeapon->StopFire();
    }
}

void AFPSCharacter::EquipWeapon(AWeaponBase* NewWeapon)
{
    if (!NewWeapon) return;

    // 卸下當前武器
    if (CurrentWeapon)
    {
        CurrentWeapon->OnUnequipped();
    }

    // 裝備新武器
    CurrentWeapon = NewWeapon;
    CurrentWeapon->SetOwner(this);
    CurrentWeapon->AttachToComponent(
        FirstPersonMesh,
        FAttachmentTransformRules::SnapToTargetNotIncludingScale,
        TEXT("GripPoint")
    );
    CurrentWeapon->OnEquipped();

    // 添加到武器列表
    Weapons.AddUnique(NewWeapon);
}

void AFPSCharacter::SwitchWeapon(int32 WeaponIndex)
{
    if (Weapons.IsValidIndex(WeaponIndex))
    {
        EquipWeapon(Weapons[WeaponIndex]);
    }
}

void AFPSCharacter::TakeDamage(float Damage)
{
    CurrentHealth -= Damage;
    CurrentHealth = FMath::Max(CurrentHealth, 0.f);

    UE_LOG(LogTemp, Warning, TEXT("受到 %.1f 傷害！剩餘生命值: %.1f"), Damage, CurrentHealth);

    if (CurrentHealth <= 0.f)
    {
        // 死亡邏輯
        UE_LOG(LogTemp, Warning, TEXT("玩家死亡！"));
        // TODO: 實現死亡處理
    }
}

void AFPSCharacter::Heal(float Amount)
{
    CurrentHealth += Amount;
    CurrentHealth = FMath::Min(CurrentHealth, MaxHealth);

    UE_LOG(LogTemp, Log, TEXT("恢復 %.1f 生命值！當前生命值: %.1f"), Amount, CurrentHealth);
}
```

### WeaponBase.h

武器基類。

```cpp
// WeaponBase.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WeaponBase.generated.h"

UCLASS()
class UNREALFPS_API AWeaponBase : public AActor
{
    GENERATED_BODY()

public:
    AWeaponBase();

    // 武器動作
    void StartFire();
    void StopFire();
    void Reload();

    // 生命週期
    void OnEquipped();
    void OnUnequipped();

protected:
    virtual void BeginPlay() override;
    virtual void Fire();
    virtual void FireProjectile();
    virtual void FireHitscan();

public:
    virtual void Tick(float DeltaTime) override;

    // 組件
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    class USkeletalMeshComponent* WeaponMesh;

    // 武器屬性
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    float Damage = 20.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    float FireRate = 0.1f;  // 每 0.1 秒一發

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    int32 MaxAmmo = 30;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    int32 CurrentAmmo = 30;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    float Range = 10000.f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
    bool bIsAutomatic = true;

    // 音效
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
    class USoundBase* FireSound;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
    class USoundBase* ReloadSound;

    // 粒子效果
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Effects")
    class UParticleSystem* MuzzleFlash;

private:
    bool bIsFiring = false;
    float LastFireTime = 0.f;
    FTimerHandle FireTimerHandle;
};
```

## 🎨 美術資源

### 推薦資源庫

- **Unreal Marketplace** - 官方資源商店
- **Quixel Megascans** - 高品質掃描素材（免費for UE）
- **Sketchfab** - 3D 模型
- **FreeSoundEffects** - 免費音效

## 🤖 AI 輔助開發

### 1. C++ 代碼生成

```
"創建一個 Unreal Engine C++ 類別：
- 繼承自 AWeaponBase
- 實現散彈槍邏輯
- 一次發射多個子彈
- 包含彈道擴散"
```

### 2. Blueprint 邏輯

```
"描述一個 UE5 Blueprint：
當玩家進入觸發區域時：
1. 播放警報音效
2. 生成 3 個敵人
3. 關閉入口門"
```

## 📚 學習資源

### 官方資源
- [Unreal Engine 文檔](https://docs.unrealengine.com/)
- [Unreal Online Learning](https://www.unrealengine.com/en-US/onlinelearning)

### 推薦教學
- **Unreal Sensei** - YouTube
- **Virtus Learning Hub** - 系統教程
- **Ryan Laley** - Blueprint 進階

## 📄 授權

本專案使用 MIT 授權條款。

---

**🎮 使用 Unreal Engine 和 AI 創造你的 AAA 級 FPS 遊戲！**

**最後更新**: 2025-11-16
**Unreal Engine 版本**: 5.3+
**維護狀態**: ✅ 活躍開發
