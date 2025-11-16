# ↩️ Rollback System - 回滾系統

## 概述

自動回滾系統，在更新失敗時恢復到上一個穩定版本。

## 功能特點

- ✅ 自動回滾檢測
- ✅ 啟動計數器
- ✅ 健康檢查
- ✅ 手動回滾觸發
- ✅ 版本歷史追蹤

## 回滾策略

### 啟動失敗檢測

```c
void boot_check(void)
{
    boot_info_t *info = get_boot_info();

    // 增加啟動計數
    info->boot_count++;

    // 如果連續啟動失敗3次，回滾
    if (info->boot_count >= 3 && !info->boot_successful) {
        printf("Boot failed 3 times, rolling back...\n");
        rollback_to_previous();
        system_reset();
    }

    // 設置看門狗，30秒內必須確認啟動成功
    watchdog_start(30000);
}

void app_initialized(void)
{
    // 應用初始化成功
    boot_info_t *info = get_boot_info();
    info->boot_successful = true;
    info->boot_count = 0;
    watchdog_stop();

    // 確認更新成功
    ota_confirm_update();
}
```

### 健康檢查

```c
void health_check_task(void *param)
{
    while (1) {
        // 檢查關鍵功能
        if (!check_network_connectivity()) {
            rollback_trigger_count++;
        }

        if (!check_sensor_health()) {
            rollback_trigger_count++;
        }

        // 如果健康檢查失敗超過閾值，觸發回滾
        if (rollback_trigger_count > 10) {
            printf("Health check failed, rolling back...\n");
            rollback_to_previous();
        }

        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}
```

## 手動回滾

```c
// 通過命令觸發回滾
void handle_rollback_command(void)
{
    printf("Manual rollback requested\n");
    rollback_to_previous();
    system_reset();
}
```

## 版本歷史

```c
typedef struct {
    uint32_t version;
    uint32_t install_time;
    uint32_t boot_count;
    bool stable;
} version_history_t;

version_history_t version_history[5] = {
    {0x010100, 1699000000, 150, true},   // v1.1.0 (穩定)
    {0x010200, 1700000000, 50, true},    // v1.2.0 (穩定)
    {0x010300, 1701000000, 2, false},    // v1.3.0 (當前，未確認)
};
```

**狀態**: ✅ 可用
