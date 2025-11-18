# Rollback System - 回滾系統實現

## 概述

實現完整的 A/B 分區回滾系統，支持自動回滾檢測、啟動計數、版本管理和健康檢查，確保 OTA 更新失敗時能夠安全恢復到穩定版本。

## 功能特點

- **A/B 分區管理**: 雙分區無縫切換
- **自動回滾**: 啟動失敗自動回滾到舊版本
- **啟動計數**: 跟踪啟動嘗試次數
- **版本檢查**: 版本號解析、比較和驗證
- **啟動標誌**: 持久化啟動狀態和計數器
- **健康檢查**: 運行時健康狀態監控
- **手動回滾**: 支持手動觸發回滾

## 目錄結構

```
rollback-system/
├── rollback.h              # 回滾系統接口
├── rollback.c              # 回滾系統實現
├── boot_flag.h            # 啟動標誌接口
├── boot_flag.c            # 啟動標誌實現
├── version_check.h        # 版本檢查接口
├── version_check.c        # 版本檢查實現
├── test_rollback.c        # 測試程序
├── Makefile              # 構建文件
└── README.md             # 本文檔
```

## A/B 分區架構

```
+------------------+     +------------------+
| Partition A      |     | Partition B      |
|   (Active)       |     |   (Inactive)     |
|                  |     |                  |
| Firmware v1.0    |     | Firmware v1.1    |
| State: ACTIVE    |     | State: INACTIVE  |
| Boot count: 0    |     | Boot count: 0    |
+------------------+     +------------------+
         |                        |
         +----------+-------------+
                    |
              Boot Loader
                    |
            +----------------+
            | Boot Flag      |
            | - Active: A    |
            | - Boot count   |
            | - Success flag |
            +----------------+
```

## API 接口

### 回滾系統 API

#### 初始化回滾系統

```c
rollback_config_t config = {
    .max_boot_attempts = 3,
    .watchdog_timeout_ms = 30000,
    .auto_rollback = true,
    .verify_checksum = true,
    .partition_a_path = "/dev/mtd0",
    .partition_b_path = "/dev/mtd1",
    .boot_flag_path = "/data/boot_flag.bin"
};

rollback_context_t ctx;
int ret = rollback_init(&ctx, &config);

if (ret == 0) {
    printf("Rollback system initialized\n");
}
```

#### 獲取活動分區

```c
partition_slot_t active_slot = rollback_get_active_slot(&ctx);
partition_slot_t inactive_slot = rollback_get_inactive_slot(&ctx);

printf("Active partition: %c\n", (active_slot == PARTITION_SLOT_A) ? 'A' : 'B');
```

#### 切換分區

```c
/* 在新分區更新完成後切換 */
ret = rollback_set_active_slot(&ctx, PARTITION_SLOT_B);

if (ret == 0) {
    printf("Switched to partition B\n");
}
```

#### 標記啟動成功

```c
/* 在應用完全初始化後調用 */
ret = rollback_mark_boot_successful(&ctx);

if (ret == 0) {
    printf("Boot marked as successful\n");
}
```

#### 檢查並執行回滾

```c
/* 在啟動時檢查 */
if (rollback_should_rollback(&ctx)) {
    printf("Rollback required\n");

    ret = rollback_perform(&ctx);
    if (ret == 0) {
        printf("Rollback completed\n");
        /* 重啟系統 */
        system_reboot();
    }
}
```

#### 獲取分區信息

```c
partition_info_t info;
ret = rollback_get_partition_info(&ctx, PARTITION_SLOT_A, &info);

if (ret == 0) {
    printf("Partition A:\n");
    printf("  State: %d\n", info.state);
    printf("  Version: %s\n", info.version);
    printf("  Boot count: %u\n", info.boot_count);
    printf("  Successful boots: %u\n", info.successful_boots);
}
```

### 啟動標誌 API

```c
/* 初始化啟動標誌 */
boot_flag_t boot_flag;
boot_flag_init(&boot_flag);

/* 讀取啟動標誌 */
ret = boot_flag_read(&boot_flag, "/data/boot_flag.bin");

/* 增加啟動計數 */
boot_flag_increment_boot_count(&boot_flag, PARTITION_SLOT_A);

/* 標記啟動成功 */
boot_flag_mark_boot_successful(&boot_flag, PARTITION_SLOT_A);

/* 寫入啟動標誌 */
ret = boot_flag_write(&boot_flag, "/data/boot_flag.bin");
```

### 版本檢查 API

```c
version_t v1, v2;

/* 解析版本字符串 */
version_parse("1.2.3", &v1);
version_parse("1.3.0", &v2);

/* 比較版本 */
int cmp = version_compare(&v1, &v2);
if (cmp < 0) {
    printf("v1 < v2\n");
}

/* 檢查是否為升級 */
if (version_is_upgrade(&v1, &v2)) {
    printf("v2 is an upgrade from v1\n");
}

/* 檢查兼容性 */
if (version_is_compatible(&v1, &v2)) {
    printf("Versions are compatible\n");
}

/* 版本轉字符串 */
char ver_str[32];
version_to_string(&v2, ver_str, sizeof(ver_str));
printf("Version: %s\n", ver_str);
```

## 使用示例

### 完整的 OTA 更新流程（帶回滾）

```c
#include "rollback.h"
#include "boot_flag.h"

int main(void)
{
    /* 初始化回滾系統 */
    rollback_config_t config = {
        .max_boot_attempts = 3,
        .watchdog_timeout_ms = 30000,
        .auto_rollback = true,
        .verify_checksum = true,
        .partition_a_path = "/dev/mtd0",
        .partition_b_path = "/dev/mtd1",
        .boot_flag_path = "/data/boot_flag.bin"
    };

    rollback_context_t ctx;
    rollback_init(&ctx, &config);

    /* 檢查是否需要回滾 */
    if (rollback_should_rollback(&ctx)) {
        printf("Boot failed %u times, performing rollback...\n",
               config.max_boot_attempts);

        rollback_perform(&ctx);
        rollback_cleanup(&ctx);

        /* 重啟系統 */
        system("reboot");
        return 0;
    }

    /* 初始化應用 */
    printf("Initializing application...\n");

    /* 模擬應用初始化 */
    sleep(2);

    /* 執行健康檢查 */
    bool health_ok = true;

    if (!check_network()) {
        printf("Network check failed\n");
        health_ok = false;
    }

    if (!check_sensors()) {
        printf("Sensor check failed\n");
        health_ok = false;
    }

    if (health_ok) {
        /* 標記啟動成功 */
        rollback_mark_boot_successful(&ctx);
        printf("Application started successfully\n");
    } else {
        /* 健康檢查失敗，不標記成功 */
        printf("Health check failed, will retry on next boot\n");
    }

    rollback_cleanup(&ctx);

    return 0;
}
```

### OTA 更新中使用回滾

```c
int perform_ota_update(const char *firmware_path)
{
    rollback_context_t ctx;
    rollback_config_t config = {
        .max_boot_attempts = 3,
        .auto_rollback = true,
        .partition_a_path = "/dev/mtd0",
        .partition_b_path = "/dev/mtd1",
        .boot_flag_path = "/data/boot_flag.bin"
    };

    rollback_init(&ctx, &config);

    /* 獲取非活動分區 */
    partition_slot_t target_slot = rollback_get_inactive_slot(&ctx);
    const char *target_partition = (target_slot == PARTITION_SLOT_A) ?
                                    config.partition_a_path : config.partition_b_path;

    printf("Updating partition %c at %s\n",
           (target_slot == PARTITION_SLOT_A) ? 'A' : 'B',
           target_partition);

    /* 將新固件寫入非活動分區 */
    int ret = write_firmware_to_partition(firmware_path, target_partition);
    if (ret != 0) {
        printf("Failed to write firmware\n");
        rollback_cleanup(&ctx);
        return -1;
    }

    /* 驗證固件 */
    ret = rollback_verify_partition(&ctx, target_slot);
    if (ret != 0) {
        printf("Firmware verification failed\n");
        rollback_cleanup(&ctx);
        return -2;
    }

    /* 標記新分區為可啟動 */
    rollback_mark_bootable(&ctx, target_slot);

    /* 切換到新分區 */
    ret = rollback_set_active_slot(&ctx, target_slot);
    if (ret != 0) {
        printf("Failed to set active slot\n");
        rollback_cleanup(&ctx);
        return -3;
    }

    printf("OTA update completed, will boot from partition %c\n",
           (target_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    rollback_cleanup(&ctx);

    /* 重啟以啟動新固件 */
    system("reboot");

    return 0;
}
```

### 啟動流程示例

```c
void bootloader_main(void)
{
    boot_flag_t boot_flag;

    /* 讀取啟動標誌 */
    if (boot_flag_read(&boot_flag, "/data/boot_flag.bin") != 0) {
        /* 首次啟動或數據損壞，初始化默認值 */
        boot_flag_init(&boot_flag);
        boot_flag.active_slot = PARTITION_SLOT_A;
    }

    /* 增加啟動計數 */
    boot_flag_increment_boot_count(&boot_flag, boot_flag.active_slot);

    /* 檢查是否超過最大嘗試次數 */
    uint32_t boot_count = (boot_flag.active_slot == PARTITION_SLOT_A) ?
                          boot_flag.boot_count_a : boot_flag.boot_count_b;

    if (boot_count >= MAX_BOOT_ATTEMPTS) {
        printf("Max boot attempts reached, switching partition\n");

        /* 切換到另一個分區 */
        boot_flag.active_slot = (boot_flag.active_slot == PARTITION_SLOT_A) ?
                                PARTITION_SLOT_B : PARTITION_SLOT_A;

        /* 重置新分區的計數 */
        boot_flag_reset_boot_count(&boot_flag, boot_flag.active_slot);
    }

    /* 保存啟動標誌 */
    boot_flag_write(&boot_flag, "/data/boot_flag.bin");

    /* 從活動分區啟動 */
    boot_from_partition(boot_flag.active_slot);
}
```

## 編譯和測試

### 編譯

```bash
make
```

### 運行測試

```bash
make test
```

### 安裝

```bash
sudo make install
```

### 清理

```bash
make clean
```

## 回滾策略

### 自動回滾觸發條件

1. **啟動失敗**: 連續啟動失敗次數達到閾值（默認 3 次）
2. **看門狗超時**: 應用在指定時間內未標記啟動成功
3. **健康檢查失敗**: 關鍵功能健康檢查失敗
4. **手動觸發**: 用戶或監控系統手動觸發

### 回滾流程

```
1. 檢測到失敗條件
    ↓
2. 標記當前分區為不可啟動
    ↓
3. 切換到備用分區
    ↓
4. 重置啟動計數器
    ↓
5. 重啟系統
    ↓
6. 從舊版本啟動
```

## 安全考慮

1. **數據持久化**
   - 啟動標誌使用校驗和驗證
   - 支持斷電恢復
   - 原子性寫入操作

2. **分區保護**
   - 活動分區不可覆寫
   - 更新僅寫入非活動分區
   - 驗證後才切換

3. **失敗恢復**
   - 多次失敗後強制回滾
   - 保留最後一個穩定版本
   - 防止無限重啟循環

## 故障排查

### 無限重啟循環

- 檢查兩個分區是否都損壞
- 驗證啟動標誌文件
- 降低 max_boot_attempts

### 回滾不生效

- 確認 auto_rollback 已啟用
- 檢查啟動計數是否正確更新
- 驗證分區狀態

### 版本檢查失敗

- 確保版本號格式正確
- 檢查版本號解析邏輯
- 驗證版本兼容性規則

## 最佳實踐

1. **設置合理的重試次數**: 通常 3 次足夠
2. **實現健康檢查**: 覆蓋關鍵功能
3. **及時標記成功**: 在確認系統穩定後立即標記
4. **保留日誌**: 記錄每次啟動和回滾事件
5. **定期驗證**: 定期檢查分區完整性
6. **測試回滾流程**: 在部署前充分測試

## 版本歷史

- **v1.0.0** - 初始版本
  - A/B 分區管理
  - 自動回滾機制
  - 啟動計數和標誌
  - 版本檢查功能

## 許可證

MIT License

## 相關文檔

- [Update Protocol](../update-protocol/README.md) - OTA 更新協議
- [Delta Update](../delta-update/README.md) - 差分更新
- [OTA Manager](../README.md) - OTA 管理器總覽
