/**
 * @file patch_generator.h
 * @brief 差分補丁生成器接口
 * @details 生成舊固件到新固件的差分補丁
 */

#ifndef PATCH_GENERATOR_H
#define PATCH_GENERATOR_H

#include "delta_updater.h"
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 補丁生成器配置 */
typedef struct {
    uint32_t block_size;        /* 塊大小（默認 4096） */
    bool enable_compression;    /* 啟用壓縮 */
    bool verbose;               /* 詳細輸出 */
    uint32_t match_threshold;   /* 匹配閾值（字節） */
} patch_generator_config_t;

/* 補丁生成器上下文 */
typedef struct {
    FILE *old_file;
    FILE *new_file;
    FILE *patch_file;

    patch_generator_config_t config;

    uint8_t *old_buffer;
    uint8_t *new_buffer;
    size_t buffer_size;

    uint32_t old_size;
    uint32_t new_size;
    uint32_t patch_size;

    uint32_t copy_bytes;
    uint32_t add_bytes;
    uint32_t run_bytes;
} patch_generator_context_t;

/**
 * @brief 創建補丁生成器
 * @param config 配置參數
 * @return 補丁生成器上下文指針
 */
patch_generator_context_t* patch_generator_create(const patch_generator_config_t *config);

/**
 * @brief 銷毀補丁生成器
 * @param ctx 補丁生成器上下文
 */
void patch_generator_destroy(patch_generator_context_t *ctx);

/**
 * @brief 生成差分補丁
 * @param ctx 補丁生成器上下文
 * @param old_firmware_path 舊固件路徑
 * @param new_firmware_path 新固件路徑
 * @param patch_path 補丁輸出路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int patch_generator_generate(patch_generator_context_t *ctx,
                              const char *old_firmware_path,
                              const char *new_firmware_path,
                              const char *patch_path);

/**
 * @brief 獲取補丁統計信息
 * @param ctx 補丁生成器上下文
 * @param copy_bytes 複製字節數輸出
 * @param add_bytes 添加字節數輸出
 * @param run_bytes 運行長度字節數輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int patch_generator_get_stats(const patch_generator_context_t *ctx,
                               uint32_t *copy_bytes,
                               uint32_t *add_bytes,
                               uint32_t *run_bytes);

/**
 * @brief 獲取壓縮比
 * @param ctx 補丁生成器上下文
 * @return 壓縮比百分比
 */
float patch_generator_get_compression_ratio(const patch_generator_context_t *ctx);

#ifdef __cplusplus
}
#endif

#endif /* PATCH_GENERATOR_H */
