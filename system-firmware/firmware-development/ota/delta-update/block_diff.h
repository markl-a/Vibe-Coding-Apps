/**
 * @file block_diff.h
 * @brief 塊差分算法接口
 * @details 基於塊的差分算法，用於生成和應用補丁
 */

#ifndef BLOCK_DIFF_H
#define BLOCK_DIFF_H

#include <stdint.h>
#include <stdio.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 塊差分統計 */
typedef struct {
    uint32_t total_blocks;      /* 總塊數 */
    uint32_t matched_blocks;    /* 匹配的塊數 */
    uint32_t different_blocks;  /* 不同的塊數 */
    uint32_t copy_bytes;        /* 複製的字節數 */
    uint32_t add_bytes;         /* 添加的字節數 */
    uint32_t run_bytes;         /* 運行長度編碼字節數 */
} block_diff_stats_t;

/* 塊差分上下文 */
typedef struct block_diff_context block_diff_context_t;

/**
 * @brief 創建塊差分上下文
 * @param block_size 塊大小（字節）
 * @return 塊差分上下文指針
 */
block_diff_context_t* block_diff_create(uint32_t block_size);

/**
 * @brief 銷毀塊差分上下文
 * @param ctx 塊差分上下文
 */
void block_diff_destroy(block_diff_context_t *ctx);

/**
 * @brief 生成塊差分補丁
 * @param ctx 塊差分上下文
 * @param old_file 舊文件
 * @param new_file 新文件
 * @param patch_file 補丁輸出文件
 * @return 0: 成功, <0: 錯誤碼
 */
int block_diff_generate(block_diff_context_t *ctx,
                        FILE *old_file,
                        FILE *new_file,
                        FILE *patch_file);

/**
 * @brief 計算塊哈希值
 * @param data 數據緩衝區
 * @param size 數據大小
 * @return 哈希值
 */
uint32_t block_diff_hash(const uint8_t *data, size_t size);

/**
 * @brief 比較兩個塊是否相同
 * @param block1 塊1
 * @param block2 塊2
 * @param size 塊大小
 * @return true: 相同, false: 不同
 */
bool block_diff_compare(const uint8_t *block1, const uint8_t *block2, size_t size);

/**
 * @brief 獲取統計信息
 * @param ctx 塊差分上下文
 * @param stats 統計信息輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int block_diff_get_stats(const block_diff_context_t *ctx, block_diff_stats_t *stats);

/**
 * @brief 檢測運行長度編碼
 * @param data 數據緩衝區
 * @param size 數據大小
 * @param value 重複值輸出
 * @return 運行長度（0表示不適合RLE）
 */
uint32_t block_diff_detect_run(const uint8_t *data, size_t size, uint8_t *value);

#ifdef __cplusplus
}
#endif

#endif /* BLOCK_DIFF_H */
