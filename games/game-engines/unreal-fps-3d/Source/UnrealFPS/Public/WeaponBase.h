// Copyright Epic Games, Inc. All Rights Reserved.
// AI-Generated Weapon Base Header

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WeaponBase.generated.h"

/**
 * 武器基類
 * 所有武器的父類，定義武器的基本功能
 */
UCLASS()
class UNREALFPS_API AWeaponBase : public AActor
{
	GENERATED_BODY()

public:
	/** 建構函式 */
	AWeaponBase();

	/** 每幀更新 */
	virtual void Tick(float DeltaTime) override;

	//====================
	// 武器動作
	//====================

	/** 開始射擊 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void StartFire();

	/** 停止射擊 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void StopFire();

	/** 換彈 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void Reload();

	//====================
	// 生命週期
	//====================

	/** 裝備時調用 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void OnEquipped();

	/** 卸下時調用 */
	UFUNCTION(BlueprintCallable, Category = "Weapon")
	void OnUnequipped();

	//====================
	// 取得資訊
	//====================

	/** 獲取當前彈藥 */
	UFUNCTION(BlueprintPure, Category = "Weapon")
	int32 GetCurrentAmmo() const { return CurrentAmmo; }

	/** 獲取最大彈藥 */
	UFUNCTION(BlueprintPure, Category = "Weapon")
	int32 GetMaxAmmo() const { return MaxAmmo; }

	/** 是否可以射擊 */
	UFUNCTION(BlueprintPure, Category = "Weapon")
	bool CanFire() const;

	/** 是否正在換彈 */
	UFUNCTION(BlueprintPure, Category = "Weapon")
	bool IsReloading() const { return bIsReloading; }

protected:
	/** 遊戲開始時調用 */
	virtual void BeginPlay() override;

	/** 執行射擊 */
	virtual void Fire();

	/** 射擊投射物 */
	virtual void FireProjectile();

	/** 射擊命中掃描（Hitscan） */
	virtual void FireHitscan();

	/** 處理命中 */
	virtual void ProcessHit(const FHitResult& Hit);

	/** 完成換彈 */
	virtual void FinishReload();

	//====================
	// 組件
	//====================

	/** 武器網格 */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	class USkeletalMeshComponent* WeaponMesh;

	//====================
	// 武器屬性
	//====================

	/** 武器名稱 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Info")
	FString WeaponName;

	/** 傷害 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	float Damage = 20.f;

	/** 射速（每秒發射次數） */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	float FireRate = 10.f;

	/** 射程 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	float Range = 10000.f;

	/** 最大彈藥 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Ammo")
	int32 MaxAmmo = 30;

	/** 當前彈藥 */
	UPROPERTY(BlueprintReadOnly, Category = "Weapon Ammo")
	int32 CurrentAmmo = 30;

	/** 換彈時間 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Ammo")
	float ReloadTime = 2.f;

	/** 是否為全自動 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	bool bIsAutomatic = true;

	/** 後座力 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	float Recoil = 1.f;

	/** 彈道擴散 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon Stats")
	float Spread = 0.f;

	//====================
	// 音效
	//====================

	/** 射擊音效 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	class USoundBase* FireSound;

	/** 換彈音效 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	class USoundBase* ReloadSound;

	/** 空彈音效 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Audio")
	class USoundBase* EmptySound;

	//====================
	// 粒子效果
	//====================

	/** 槍口火焰 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Effects")
	class UParticleSystem* MuzzleFlash;

	/** 彈道軌跡 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Effects")
	class UParticleSystem* TracerEffect;

	/** 擊中效果 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Effects")
	class UParticleSystem* ImpactEffect;

	//====================
	// 投射物（如果使用）
	//====================

	/** 投射物類別 */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Projectile")
	TSubclassOf<class AProjectile> ProjectileClass;

private:
	/** 是否正在射擊 */
	bool bIsFiring = false;

	/** 是否正在換彈 */
	bool bIsReloading = false;

	/** 上次射擊時間 */
	float LastFireTime = 0.f;

	/** 射擊計時器 */
	FTimerHandle FireTimerHandle;

	/** 換彈計時器 */
	FTimerHandle ReloadTimerHandle;

	/** 武器擁有者 */
	class AFPSCharacter* OwnerCharacter;
};
