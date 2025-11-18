/**
 * @file block_diff.c
 * @brief 塊差分算法實現
 */

#include "block_diff.h"
#include "delta_updater.h"
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

#define MIN_RUN_LENGTH 16  /* 最小運行長度 */

/* 塊差分上下文內部結構 */
struct block_diff_context {
    uint32_t block_size;
    block_diff_stats_t stats;

    uint8_t *old_block;
    uint8_t *new_block;
};

/**
 * @brief 創建塊差分上下文
 */
block_diff_context_t* block_diff_create(uint32_t block_size)
{
    if (block_size == 0) {
        return NULL;
    }

    block_diff_context_t *ctx = (block_diff_context_t *)calloc(1, sizeof(block_diff_context_t));
    if (!ctx) {
        return NULL;
    }

    ctx->block_size = block_size;

    ctx->old_block = (uint8_t *)malloc(block_size);
    ctx->new_block = (uint8_t *)malloc(block_size);

    if (!ctx->old_block || !ctx->new_block) {
        block_diff_destroy(ctx);
        return NULL;
    }

    return ctx;
}

/**
 * @brief 銷毀塊差分上下文
 */
void block_diff_destroy(block_diff_context_t *ctx)
{
    if (!ctx) {
        return;
    }

    if (ctx->old_block) {
        free(ctx->old_block);
    }

    if (ctx->new_block) {
        free(ctx->new_block);
    }

    free(ctx);
}

/**
 * @brief 計算塊哈希值（使用簡單的 djb2 哈希）
 */
uint32_t block_diff_hash(const uint8_t *data, size_t size)
{
    uint32_t hash = 5381;

    for (size_t i = 0; i < size; i++) {
        hash = ((hash << 5) + hash) + data[i];
    }

    return hash;
}

/**
 * @brief 比較兩個塊是否相同
 */
bool block_diff_compare(const uint8_t *block1, const uint8_t *block2, size_t size)
{
    return memcmp(block1, block2, size) == 0;
}

/**
 * @brief 檢測運行長度編碼
 */
uint32_t block_diff_detect_run(const uint8_t *data, size_t size, uint8_t *value)
{
    if (!data || size == 0) {
        return 0;
    }

    uint8_t first = data[0];
    uint32_t run_length = 1;

    for (size_t i = 1; i < size; i++) {
        if (data[i] == first) {
            run_length++;
        } else {
            break;
        }
    }

    if (run_length >= MIN_RUN_LENGTH) {
        if (value) {
            *value = first;
        }
        return run_length;
    }

    return 0;
}

/**
 * @brief 寫入 COPY 操作
 */
static int write_copy_op(FILE *patch_file, uint32_t offset, uint32_t length)
{
    uint8_t op_type = DELTA_OP_COPY;

    if (fwrite(&op_type, 1, 1, patch_file) != 1 ||
        fwrite(&offset, sizeof(uint32_t), 1, patch_file) != 1 ||
        fwrite(&length, sizeof(uint32_t), 1, patch_file) != 1) {
        return -1;
    }

    return 0;
}

/**
 * @brief 寫入 ADD 操作
 */
static int write_add_op(FILE *patch_file, const uint8_t *data, uint32_t length)
{
    uint8_t op_type = DELTA_OP_ADD;

    if (fwrite(&op_type, 1, 1, patch_file) != 1 ||
        fwrite(&length, sizeof(uint32_t), 1, patch_file) != 1 ||
        fwrite(data, 1, length, patch_file) != length) {
        return -1;
    }

    return 0;
}

/**
 * @brief 寫入 RUN 操作
 */
static int write_run_op(FILE *patch_file, uint8_t value, uint32_t length)
{
    uint8_t op_type = DELTA_OP_RUN;

    if (fwrite(&op_type, 1, 1, patch_file) != 1 ||
        fwrite(&value, 1, 1, patch_file) != 1 ||
        fwrite(&length, sizeof(uint32_t), 1, patch_file) != 1) {
        return -1;
    }

    return 0;
}

/**
 * @brief 生成塊差分補丁
 */
int block_diff_generate(block_diff_context_t *ctx,
                        FILE *old_file,
                        FILE *new_file,
                        FILE *patch_file)
{
    if (!ctx || !old_file || !new_file || !patch_file) {
        return DELTA_ERR_INVALID_PARAM;
    }

    memset(&ctx->stats, 0, sizeof(block_diff_stats_t));

    /* 獲取文件大小 */
    fseek(old_file, 0, SEEK_END);
    uint32_t old_size = ftell(old_file);
    fseek(old_file, 0, SEEK_SET);

    fseek(new_file, 0, SEEK_END);
    uint32_t new_size = ftell(new_file);
    fseek(new_file, 0, SEEK_SET);

    uint32_t old_pos = 0;
    uint32_t new_pos = 0;

    /* 處理新文件的每個塊 */
    while (new_pos < new_size) {
        size_t new_read = fread(ctx->new_block, 1, ctx->block_size, new_file);
        if (new_read == 0) {
            break;
        }

        ctx->stats.total_blocks++;

        /* 檢測運行長度編碼 */
        uint8_t run_value;
        uint32_t run_length = block_diff_detect_run(ctx->new_block, new_read, &run_value);

        if (run_length >= MIN_RUN_LENGTH) {
            /* 使用 RUN 操作 */
            if (write_run_op(patch_file, run_value, run_length) != 0) {
                return DELTA_ERR_IO;
            }

            ctx->stats.run_bytes += run_length;
            new_pos += run_length;

            /* 跳過運行長度部分 */
            fseek(new_file, new_pos, SEEK_SET);
            continue;
        }

        /* 嘗試在舊文件中查找匹配的塊 */
        bool found_match = false;

        if (old_pos < old_size) {
            fseek(old_file, old_pos, SEEK_SET);
            size_t old_read = fread(ctx->old_block, 1, ctx->block_size, old_file);

            if (old_read == new_read && block_diff_compare(ctx->old_block, ctx->new_block, new_read)) {
                /* 找到匹配 - 使用 COPY 操作 */
                if (write_copy_op(patch_file, old_pos, new_read) != 0) {
                    return DELTA_ERR_IO;
                }

                ctx->stats.matched_blocks++;
                ctx->stats.copy_bytes += new_read;
                found_match = true;
                old_pos += new_read;
            }
        }

        if (!found_match) {
            /* 沒有匹配 - 使用 ADD 操作 */
            if (write_add_op(patch_file, ctx->new_block, new_read) != 0) {
                return DELTA_ERR_IO;
            }

            ctx->stats.different_blocks++;
            ctx->stats.add_bytes += new_read;
        }

        new_pos += new_read;
    }

    return DELTA_ERR_NONE;
}

/**
 * @brief 獲取統計信息
 */
int block_diff_get_stats(const block_diff_context_t *ctx, block_diff_stats_t *stats)
{
    if (!ctx || !stats) {
        return DELTA_ERR_INVALID_PARAM;
    }

    memcpy(stats, &ctx->stats, sizeof(block_diff_stats_t));
    return DELTA_ERR_NONE;
}
