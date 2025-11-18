/**
 * @file boot_flag.h
 * @brief 啟動標誌管理接口
 * @details 管理 A/B 分區啟動標誌和計數器
 */

#ifndef BOOT_FLAG_H
#define BOOT_FLAG_H

#include <stdint.h>
#include <stdbool.h>
#include "rollback.h"

#ifdef __cplusplus
extern "C" {
#endif

#define BOOT_FLAG_MAGIC 0x42544C47  /* "BTLG" - BootLoader Flag */
#define BOOT_FLAG_VERSION 1

/* 啟動標誌 */
typedef struct {
    uint32_t magic;                  /* 魔數 */
    uint32_t version;                /* 版本 */
    partition_slot_t active_slot;    /* 活動槽位 */
    partition_slot_t boot_slot;      /* 啟動槽位 */
    uint32_t boot_count_a;           /* 分區A啟動次數 */
    uint32_t boot_count_b;           /* 分區B啟動次數 */
    uint32_t successful_boots_a;     /* 分區A成功啟動次數 */
    uint32_t successful_boots_b;     /* 分區B成功啟動次數 */
    uint32_t flags;                  /* 標誌位 */
    uint32_t checksum;               /* 校驗和 */
} boot_flag_t;

/**
 * @brief 讀取啟動標誌
 * @param boot_flag 啟動標誌輸出
 * @param path 標誌文件路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int boot_flag_read(boot_flag_t *boot_flag, const char *path);

/**
 * @brief 寫入啟動標誌
 * @param boot_flag 啟動標誌
 * @param path 標誌文件路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int boot_flag_write(const boot_flag_t *boot_flag, const char *path);

/**
 * @brief 初始化啟動標誌
 * @param boot_flag 啟動標誌
 */
void boot_flag_init(boot_flag_t *boot_flag);

/**
 * @brief 驗證啟動標誌
 * @param boot_flag 啟動標誌
 * @return true: 有效, false: 無效
 */
bool boot_flag_validate(const boot_flag_t *boot_flag);

/**
 * @brief 增加啟動計數
 * @param boot_flag 啟動標誌
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int boot_flag_increment_boot_count(boot_flag_t *boot_flag, partition_slot_t slot);

/**
 * @brief 重置啟動計數
 * @param boot_flag 啟動標誌
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int boot_flag_reset_boot_count(boot_flag_t *boot_flag, partition_slot_t slot);

/**
 * @brief 標記啟動成功
 * @param boot_flag 啟動標誌
 * @param slot 分區槽位
 * @return 0: 成功, <0: 錯誤碼
 */
int boot_flag_mark_boot_successful(boot_flag_t *boot_flag, partition_slot_t slot);

/**
 * @brief 計算校驗和
 * @param boot_flag 啟動標誌
 * @return 校驗和
 */
uint32_t boot_flag_calculate_checksum(const boot_flag_t *boot_flag);

#ifdef __cplusplus
}
#endif

#endif /* BOOT_FLAG_H */
