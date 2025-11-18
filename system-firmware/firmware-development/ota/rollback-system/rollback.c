/**
 * @file rollback.c
 * @brief 回滾系統實現
 */

#include "rollback.h"
#include "boot_flag.h"
#include "version_check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * @brief 初始化回滾系統
 */
int rollback_init(rollback_context_t *ctx, const rollback_config_t *config)
{
    if (!ctx || !config) {
        return -1;
    }

    memset(ctx, 0, sizeof(rollback_context_t));
    memcpy(&ctx->config, config, sizeof(rollback_config_t));

    /* 初始化分區信息 */
    ctx->partition_a.slot = PARTITION_SLOT_A;
    ctx->partition_a.state = PARTITION_STATE_INACTIVE;

    ctx->partition_b.slot = PARTITION_SLOT_B;
    ctx->partition_b.state = PARTITION_STATE_INACTIVE;

    /* 讀取啟動標誌 */
    boot_flag_t boot_flag;
    if (boot_flag_read(&boot_flag, ctx->config.boot_flag_path) == 0) {
        ctx->current_slot = boot_flag.active_slot;
        ctx->boot_slot = boot_flag.boot_slot;

        /* 更新分區信息 */
        if (ctx->current_slot == PARTITION_SLOT_A) {
            ctx->partition_a.boot_count = boot_flag.boot_count_a;
            ctx->partition_a.successful_boots = boot_flag.successful_boots_a;
            ctx->partition_a.state = PARTITION_STATE_ACTIVE;
        } else if (ctx->current_slot == PARTITION_SLOT_B) {
            ctx->partition_b.boot_count = boot_flag.boot_count_b;
            ctx->partition_b.successful_boots = boot_flag.successful_boots_b;
            ctx->partition_b.state = PARTITION_STATE_ACTIVE;
        }
    } else {
        /* 默認使用分區 A */
        ctx->current_slot = PARTITION_SLOT_A;
        ctx->boot_slot = PARTITION_SLOT_A;
        ctx->partition_a.state = PARTITION_STATE_ACTIVE;
    }

    printf("[Rollback] Initialized\n");
    printf("  Current slot: %c\n", (ctx->current_slot == PARTITION_SLOT_A) ? 'A' : 'B');
    printf("  Max boot attempts: %u\n", ctx->config.max_boot_attempts);
    printf("  Auto rollback: %s\n", ctx->config.auto_rollback ? "enabled" : "disabled");

    return 0;
}

/**
 * @brief 清理回滾系統
 */
void rollback_cleanup(rollback_context_t *ctx)
{
    if (!ctx) {
        return;
    }

    /* 保存啟動標誌 */
    boot_flag_t boot_flag = {
        .magic = BOOT_FLAG_MAGIC,
        .version = BOOT_FLAG_VERSION,
        .active_slot = ctx->current_slot,
        .boot_slot = ctx->boot_slot,
        .boot_count_a = ctx->partition_a.boot_count,
        .boot_count_b = ctx->partition_b.boot_count,
        .successful_boots_a = ctx->partition_a.successful_boots,
        .successful_boots_b = ctx->partition_b.successful_boots,
        .flags = 0
    };

    boot_flag_write(&boot_flag, ctx->config.boot_flag_path);

    printf("[Rollback] Cleaned up\n");
}

/**
 * @brief 獲取當前活動分區
 */
partition_slot_t rollback_get_active_slot(const rollback_context_t *ctx)
{
    if (!ctx) {
        return PARTITION_SLOT_INVALID;
    }

    return ctx->current_slot;
}

/**
 * @brief 獲取非活動分區
 */
partition_slot_t rollback_get_inactive_slot(const rollback_context_t *ctx)
{
    if (!ctx) {
        return PARTITION_SLOT_INVALID;
    }

    if (ctx->current_slot == PARTITION_SLOT_A) {
        return PARTITION_SLOT_B;
    } else if (ctx->current_slot == PARTITION_SLOT_B) {
        return PARTITION_SLOT_A;
    }

    return PARTITION_SLOT_INVALID;
}

/**
 * @brief 獲取分區信息
 */
int rollback_get_partition_info(const rollback_context_t *ctx,
                                 partition_slot_t slot,
                                 partition_info_t *info)
{
    if (!ctx || !info) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        memcpy(info, &ctx->partition_a, sizeof(partition_info_t));
    } else if (slot == PARTITION_SLOT_B) {
        memcpy(info, &ctx->partition_b, sizeof(partition_info_t));
    } else {
        return -2;
    }

    return 0;
}

/**
 * @brief 設置活動分區
 */
int rollback_set_active_slot(rollback_context_t *ctx, partition_slot_t slot)
{
    if (!ctx) {
        return -1;
    }

    if (slot != PARTITION_SLOT_A && slot != PARTITION_SLOT_B) {
        return -2;
    }

    /* 更新狀態 */
    if (ctx->current_slot == PARTITION_SLOT_A) {
        ctx->partition_a.state = PARTITION_STATE_INACTIVE;
    } else if (ctx->current_slot == PARTITION_SLOT_B) {
        ctx->partition_b.state = PARTITION_STATE_INACTIVE;
    }

    ctx->current_slot = slot;

    if (slot == PARTITION_SLOT_A) {
        ctx->partition_a.state = PARTITION_STATE_ACTIVE;
    } else {
        ctx->partition_b.state = PARTITION_STATE_ACTIVE;
    }

    printf("[Rollback] Active slot changed to %c\n",
           (slot == PARTITION_SLOT_A) ? 'A' : 'B');

    return 0;
}

/**
 * @brief 標記分區為可啟動
 */
int rollback_mark_bootable(rollback_context_t *ctx, partition_slot_t slot)
{
    if (!ctx) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        ctx->partition_a.state = PARTITION_STATE_BOOTABLE;
    } else if (slot == PARTITION_SLOT_B) {
        ctx->partition_b.state = PARTITION_STATE_BOOTABLE;
    } else {
        return -2;
    }

    printf("[Rollback] Partition %c marked as bootable\n",
           (slot == PARTITION_SLOT_A) ? 'A' : 'B');

    return 0;
}

/**
 * @brief 標記分區為不可啟動
 */
int rollback_mark_unbootable(rollback_context_t *ctx, partition_slot_t slot)
{
    if (!ctx) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        ctx->partition_a.state = PARTITION_STATE_UNBOOTABLE;
    } else if (slot == PARTITION_SLOT_B) {
        ctx->partition_b.state = PARTITION_STATE_UNBOOTABLE;
    } else {
        return -2;
    }

    printf("[Rollback] Partition %c marked as unbootable\n",
           (slot == PARTITION_SLOT_A) ? 'A' : 'B');

    return 0;
}

/**
 * @brief 標記當前啟動為成功
 */
int rollback_mark_boot_successful(rollback_context_t *ctx)
{
    if (!ctx) {
        return -1;
    }

    if (ctx->current_slot == PARTITION_SLOT_A) {
        ctx->partition_a.successful_boots++;
        printf("[Rollback] Partition A: successful boots = %u\n",
               ctx->partition_a.successful_boots);
    } else if (ctx->current_slot == PARTITION_SLOT_B) {
        ctx->partition_b.successful_boots++;
        printf("[Rollback] Partition B: successful boots = %u\n",
               ctx->partition_b.successful_boots);
    } else {
        return -2;
    }

    /* 重置啟動計數器 */
    return rollback_reset_boot_counter(ctx, ctx->current_slot);
}

/**
 * @brief 檢查是否需要回滾
 */
bool rollback_should_rollback(const rollback_context_t *ctx)
{
    if (!ctx || !ctx->config.auto_rollback) {
        return false;
    }

    uint32_t boot_count = 0;

    if (ctx->current_slot == PARTITION_SLOT_A) {
        boot_count = ctx->partition_a.boot_count;
    } else if (ctx->current_slot == PARTITION_SLOT_B) {
        boot_count = ctx->partition_b.boot_count;
    }

    /* 如果啟動次數超過最大嘗試次數，需要回滾 */
    if (boot_count >= ctx->config.max_boot_attempts) {
        printf("[Rollback] Boot count (%u) >= max attempts (%u)\n",
               boot_count, ctx->config.max_boot_attempts);
        return true;
    }

    return false;
}

/**
 * @brief 執行回滾
 */
int rollback_perform(rollback_context_t *ctx)
{
    if (!ctx) {
        return -1;
    }

    partition_slot_t old_slot = ctx->current_slot;
    partition_slot_t new_slot = rollback_get_inactive_slot(ctx);

    printf("[Rollback] Performing rollback: %c -> %c\n",
           (old_slot == PARTITION_SLOT_A) ? 'A' : 'B',
           (new_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    /* 標記當前分區為不可啟動 */
    rollback_mark_unbootable(ctx, old_slot);

    /* 切換到另一個分區 */
    int ret = rollback_set_active_slot(ctx, new_slot);
    if (ret != 0) {
        return ret;
    }

    /* 標記新分區為可啟動 */
    rollback_mark_bootable(ctx, new_slot);

    ctx->rollback_triggered = true;

    printf("[Rollback] Rollback completed successfully\n");

    return 0;
}

/**
 * @brief 驗證分區完整性
 */
int rollback_verify_partition(const rollback_context_t *ctx, partition_slot_t slot)
{
    if (!ctx) {
        return -1;
    }

    if (!ctx->config.verify_checksum) {
        return 0;  /* 不需要驗證 */
    }

    /* 實際實現中應該讀取分區並計算校驗和 */
    /* 這裡簡化處理 */

    printf("[Rollback] Verifying partition %c...\n",
           (slot == PARTITION_SLOT_A) ? 'A' : 'B');

    return 0;
}

/**
 * @brief 獲取分區版本
 */
int rollback_get_partition_version(const rollback_context_t *ctx,
                                    partition_slot_t slot,
                                    char *version,
                                    size_t size)
{
    if (!ctx || !version || size == 0) {
        return -1;
    }

    const char *ver = NULL;

    if (slot == PARTITION_SLOT_A) {
        ver = ctx->partition_a.version;
    } else if (slot == PARTITION_SLOT_B) {
        ver = ctx->partition_b.version;
    } else {
        return -2;
    }

    strncpy(version, ver, size - 1);
    version[size - 1] = '\0';

    return 0;
}

/**
 * @brief 重置啟動計數器
 */
int rollback_reset_boot_counter(rollback_context_t *ctx, partition_slot_t slot)
{
    if (!ctx) {
        return -1;
    }

    if (slot == PARTITION_SLOT_A) {
        ctx->partition_a.boot_count = 0;
        printf("[Rollback] Partition A boot counter reset\n");
    } else if (slot == PARTITION_SLOT_B) {
        ctx->partition_b.boot_count = 0;
        printf("[Rollback] Partition B boot counter reset\n");
    } else {
        return -2;
    }

    return 0;
}
