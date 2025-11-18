/**
 * @file delta_updater.h
 * @brief 差分更新應用器接口
 * @details 應用差分補丁到舊固件生成新固件
 */

#ifndef DELTA_UPDATER_H
#define DELTA_UPDATER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 差分更新錯誤碼 */
typedef enum {
    DELTA_ERR_NONE = 0,
    DELTA_ERR_INVALID_PARAM = -1,
    DELTA_ERR_NO_MEMORY = -2,
    DELTA_ERR_IO = -3,
    DELTA_ERR_CORRUPT_PATCH = -4,
    DELTA_ERR_VERSION_MISMATCH = -5,
    DELTA_ERR_CHECKSUM = -6,
    DELTA_ERR_SIZE = -7,
    DELTA_ERR_UNSUPPORTED = -8
} delta_error_t;

/* 差分補丁頭部 */
typedef struct {
    uint32_t magic;                 /* 魔數 "DPAT" */
    uint32_t version;               /* 補丁版本 */
    uint32_t old_size;              /* 舊固件大小 */
    uint32_t new_size;              /* 新固件大小 */
    uint8_t old_checksum[32];       /* 舊固件 SHA256 */
    uint8_t new_checksum[32];       /* 新固件 SHA256 */
    char old_version[32];           /* 舊版本號 */
    char new_version[32];           /* 新版本號 */
    uint32_t patch_size;            /* 補丁數據大小 */
    uint32_t block_size;            /* 塊大小 */
    uint32_t compression;           /* 壓縮算法 (0=none, 1=zlib) */
    uint32_t reserved[8];           /* 保留字段 */
} delta_patch_header_t;

/* 差分操作類型 */
typedef enum {
    DELTA_OP_COPY = 0,      /* 從舊固件複製 */
    DELTA_OP_ADD = 1,       /* 添加新數據 */
    DELTA_OP_RUN = 2        /* 運行長度編碼 */
} delta_op_type_t;

/* 差分操作 */
typedef struct {
    delta_op_type_t type;
    uint32_t offset;        /* 源偏移（COPY）或目標偏移 */
    uint32_t length;        /* 長度 */
    uint8_t *data;          /* 數據（ADD） */
} delta_operation_t;

/* 差分更新上下文 */
typedef struct {
    FILE *old_file;
    FILE *patch_file;
    FILE *new_file;

    delta_patch_header_t header;

    uint8_t *buffer;
    size_t buffer_size;

    uint32_t processed_bytes;
    uint32_t total_bytes;

    bool verify_checksum;
} delta_context_t;

/* 進度回調 */
typedef void (*delta_progress_callback_t)(uint32_t current, uint32_t total, void *user_data);

/**
 * @brief 初始化差分更新上下文
 * @param ctx 差分更新上下文
 * @param old_firmware_path 舊固件路徑
 * @param patch_path 補丁路徑
 * @param new_firmware_path 新固件輸出路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int delta_updater_init(delta_context_t *ctx,
                       const char *old_firmware_path,
                       const char *patch_path,
                       const char *new_firmware_path);

/**
 * @brief 清理差分更新上下文
 * @param ctx 差分更新上下文
 */
void delta_updater_cleanup(delta_context_t *ctx);

/**
 * @brief 驗證補丁頭部
 * @param ctx 差分更新上下文
 * @return 0: 成功, <0: 錯誤碼
 */
int delta_updater_validate_header(delta_context_t *ctx);

/**
 * @brief 應用差分補丁
 * @param ctx 差分更新上下文
 * @param callback 進度回調
 * @param user_data 用戶數據
 * @return 0: 成功, <0: 錯誤碼
 */
int delta_updater_apply_patch(delta_context_t *ctx,
                               delta_progress_callback_t callback,
                               void *user_data);

/**
 * @brief 驗證生成的固件
 * @param ctx 差分更新上下文
 * @return 0: 成功, <0: 錯誤碼
 */
int delta_updater_verify(delta_context_t *ctx);

/**
 * @brief 讀取補丁頭部
 * @param patch_path 補丁路徑
 * @param header 頭部輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int delta_updater_read_header(const char *patch_path, delta_patch_header_t *header);

/**
 * @brief 獲取進度百分比
 * @param ctx 差分更新上下文
 * @return 進度百分比 (0-100)
 */
uint8_t delta_updater_get_progress(const delta_context_t *ctx);

/**
 * @brief 設置校驗和驗證
 * @param ctx 差分更新上下文
 * @param verify 是否驗證
 */
void delta_updater_set_verify(delta_context_t *ctx, bool verify);

#ifdef __cplusplus
}
#endif

#endif /* DELTA_UPDATER_H */
