// Copyright Epic Games, Inc. All Rights Reserved.
// AI-Generated FPS Character Header

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "FPSCharacter.generated.h"

/**
 * 第一人稱射擊遊戲角色類別
 * 處理玩家移動、視角、射擊等核心功能
 */
UCLASS()
class UNREALFPS_API AFPSCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	/** 建構函式 */
	AFPSCharacter();

	/** 每幀更新 */
	virtual void Tick(float DeltaTime) override;

	/** 設定玩家輸入綁定 */
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	//====================
	// 移動與視角
	//====================

	/** 前後移動 */
	void MoveForward(float Value);

	/** 左右移動 */
	void MoveRight(float Value);

	/** 視角上下 */
	void LookUp(float Value);

	/** 視角左右 */
	void Turn(float Value);

	//====================
	// 動作
	//====================

	/** 開始跳躍 */
	void StartJump();

	/** 停止跳躍 */
	void StopJump();

	/** 開始衝刺 */
	void StartSprint();

	/** 停止衝刺 */
	void StopSprint();

	/** 蹲下切換 */
	void ToggleCrouch();

	//====================
	// 射擊與武器
	//====================

	/** 開始射擊 */
	void StartFire();

	/** 停止射擊 */
	void StopFire();

	/** 瞄準 */
	void StartAim();

	/** 停止瞄準 */
	void StopAim();

	/** 換彈 */
	void Reload();

	/** 裝備武器 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void EquipWeapon(class AWeaponBase* NewWeapon);

	/** 切換武器 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void SwitchWeapon(int32 WeaponIndex);

	//====================
	// 生命值系統
	//====================

	/** 受到傷害 */
	UFUNCTION(BlueprintCallable, Category = "Health")
	void TakeDamageCustom(float Damage);

	/** 恢復生命值 */
	UFUNCTION(BlueprintCallable, Category = "Health")
	void Heal(float Amount);

	/** 檢查是否存活 */
	UFUNCTION(BlueprintPure, Category = "Health")
	bool IsAlive() const { return CurrentHealth > 0.f; }

	/** 獲取當前生命值 */
	UFUNCTION(BlueprintPure, Category = "Health")
	float GetCurrentHealth() const { return CurrentHealth; }

	/** 獲取最大生命值 */
	UFUNCTION(BlueprintPure, Category = "Health")
	float GetMaxHealth() const { return MaxHealth; }

protected:
	/** 遊戲開始時調用 */
	virtual void BeginPlay() override;

	/** 死亡處理 */
	virtual void Die();

	//====================
	// 組件
	//====================

	/** 第一人稱相機 */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Camera", meta = (AllowPrivateAccess = "true"))
	class UCameraComponent* FirstPersonCamera;

	/** 第一人稱手臂網格 */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Mesh", meta = (AllowPrivateAccess = "true"))
	class USkeletalMeshComponent* FirstPersonMesh;

	//====================
	// 移動屬性
	//====================

	/** 行走速度 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float WalkSpeed = 600.f;

	/** 衝刺速度 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float SprintSpeed = 900.f;

	/** 蹲下速度 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float CrouchSpeed = 300.f;

	/** 瞄準速度倍率 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float AimSpeedMultiplier = 0.5f;

	//====================
	// 生命值屬性
	//====================

	/** 最大生命值 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
	float MaxHealth = 100.f;

	/** 當前生命值 */
	UPROPERTY(BlueprintReadOnly, Category = "Health")
	float CurrentHealth;

	//====================
	// 武器屬性
	//====================

	/** 預設武器類別 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon")
	TSubclassOf<class AWeaponBase> DefaultWeaponClass;

	/** 當前裝備的武器 */
	UPROPERTY(BlueprintReadOnly, Category = "Weapon")
	class AWeaponBase* CurrentWeapon;

	/** 武器列表 */
	UPROPERTY(BlueprintReadOnly, Category = "Weapon")
	TArray<class AWeaponBase*> Weapons;

	//====================
	// 音效
	//====================

	/** 受傷音效 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	class USoundBase* HurtSound;

	/** 死亡音效 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	class USoundBase* DeathSound;

private:
	/** 是否正在衝刺 */
	bool bIsSprinting = false;

	/** 是否正在瞄準 */
	bool bIsAiming = false;

	/** 是否正在蹲下 */
	bool bIsCrouching = false;
};
