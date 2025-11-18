/**
 * @file rollback.h
 * @brief 回滾系統接口
 * @details A/B 分區管理和固件回滾機制
 */

#ifndef ROLLBACK_H
#define ROLLBACK_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 分區槽位 */
typedef enum {
    PARTITION_SLOT_A = 0,
    PARTITION_SLOT_B = 1,
    PARTITION_SLOT_INVALID = 0xFF
} partition_slot_t;

/* 分區狀態 */
typedef enum {
    PARTITION_STATE_INACTIVE = 0,   /* 未激活 */
    PARTITION_STATE_ACTIVE,          /* 激活中 */
    PARTITION_STATE_BOOTABLE,        /* 可啟動 */
    PARTITION_STATE_UNBOOTABLE,      /* 不可啟動 */
    PARTITION_STATE_CORRUPTED        /* 已損壞 */
} partition_state_t;

/* 分區信息 */
typedef struct {
    partition_slot_t slot;           /* 槽位 */
    partition_state_t state;         /* 狀態 */
    char version[32];                /* 版本號 */
    uint32_t size;                   /* 大小 */
    uint8_t checksum[32];            /* SHA256 校驗和 */
    uint32_t boot_count;             /* 啟動次數 */
    uint32_t successful_boots;       /* 成功啟動次數 */
    uint32_t timestamp;              /* 時間戳 */
    uint32_t priority;               /* 優先級 */
} partition_info_t;

/* 回滾配置 */
typedef struct {
    uint32_t max_boot_attempts;      /* 最大啟動嘗試次數 */
    uint32_t watchdog_timeout_ms;    /* 看門狗超時 */
    bool auto_rollback;              /* 自動回滾 */
    bool verify_checksum;            /* 驗證校驗和 */
    const char *partition_a_path;    /* 分區A路徑 */
    const char *partition_b_path;    /* 分區B路徑 */
    const char *boot_flag_path;      /* 啟動標誌路徑 */
} rollback_config_t;

/* 回滾上下文 */
typedef struct {
    rollback_config_t config;
    partition_info_t partition_a;
    partition_info_t partition_b;
    partition_slot_t current_slot;
    partition_slot_t boot_slot;
    bool rollback_triggered;
} rollback_context_t;

/**
 * @brief 初始化回滾系統
 * @param ctx 回滾上下文
 * @param config 配置參數
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_init(rollback_context_t *ctx, const rollback_config_t *config);

/**
 * @brief 清理回滾系統
 * @param ctx 回滾上下文
 */
void rollback_cleanup(rollback_context_t *ctx);

/**
 * @brief 獲取當前活動分區
 * @param ctx 回滾上下文
 * @return 分區槽位
 */
partition_slot_t rollback_get_active_slot(const rollback_context_t *ctx);

/**
 * @brief 獲取非活動分區
 * @param ctx 回滾上下文
 * @return 分區槽位
 */
partition_slot_t rollback_get_inactive_slot(const rollback_context_t *ctx);

/**
 * @brief 獲取分區信息
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @param info 分區信息輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_get_partition_info(const rollback_context_t *ctx,
                                 partition_slot_t slot,
                                 partition_info_t *info);

/**
 * @brief 設置活動分區
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_set_active_slot(rollback_context_t *ctx, partition_slot_t slot);

/**
 * @brief 標記分區為可啟動
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_mark_bootable(rollback_context_t *ctx, partition_slot_t slot);

/**
 * @brief 標記分區為不可啟動
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_mark_unbootable(rollback_context_t *ctx, partition_slot_t slot);

/**
 * @brief 標記當前啟動為成功
 * @param ctx 回滾上下文
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_mark_boot_successful(rollback_context_t *ctx);

/**
 * @brief 檢查是否需要回滾
 * @param ctx 回滾上下文
 * @return true: 需要回滾, false: 不需要
 */
bool rollback_should_rollback(const rollback_context_t *ctx);

/**
 * @brief 執行回滾
 * @param ctx 回滾上下文
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_perform(rollback_context_t *ctx);

/**
 * @brief 驗證分區完整性
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_verify_partition(const rollback_context_t *ctx, partition_slot_t slot);

/**
 * @brief 獲取分區版本
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @param version 版本號輸出緩衝區
 * @param size 緩衝區大小
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_get_partition_version(const rollback_context_t *ctx,
                                    partition_slot_t slot,
                                    char *version,
                                    size_t size);

/**
 * @brief 重置啟動計數器
 * @param ctx 回滾上下文
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int rollback_reset_boot_counter(rollback_context_t *ctx, partition_slot_t slot);

#ifdef __cplusplus
}
#endif

#endif /* ROLLBACK_H */
