/**
 * @file patch_generator.c
 * @brief 差分補丁生成器實現
 */

#include "patch_generator.h"
#include "block_diff.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/sha.h>
#include <openssl/evp.h>

#define BUFFER_SIZE (64 * 1024)

/**
 * @brief 計算文件 SHA256
 */
static int calculate_file_sha256(const char *file_path, uint8_t *output)
{
    FILE *fp = fopen(file_path, "rb");
    if (!fp) {
        return -1;
    }

    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    if (!mdctx) {
        fclose(fp);
        return -1;
    }

    unsigned char buffer[8192];
    size_t bytes;

    EVP_DigestInit_ex(mdctx, EVP_sha256(), NULL);

    while ((bytes = fread(buffer, 1, sizeof(buffer), fp)) > 0) {
        EVP_DigestUpdate(mdctx, buffer, bytes);
    }

    EVP_DigestFinal_ex(mdctx, output, NULL);
    EVP_MD_CTX_free(mdctx);
    fclose(fp);

    return 0;
}

/**
 * @brief 創建補丁生成器
 */
patch_generator_context_t* patch_generator_create(const patch_generator_config_t *config)
{
    patch_generator_context_t *ctx = (patch_generator_context_t *)calloc(1, sizeof(patch_generator_context_t));
    if (!ctx) {
        return NULL;
    }

    if (config) {
        memcpy(&ctx->config, config, sizeof(patch_generator_config_t));
    } else {
        /* 默認配置 */
        ctx->config.block_size = 4096;
        ctx->config.enable_compression = false;
        ctx->config.verbose = false;
        ctx->config.match_threshold = 32;
    }

    ctx->buffer_size = BUFFER_SIZE;
    ctx->old_buffer = (uint8_t *)malloc(ctx->buffer_size);
    ctx->new_buffer = (uint8_t *)malloc(ctx->buffer_size);

    if (!ctx->old_buffer || !ctx->new_buffer) {
        patch_generator_destroy(ctx);
        return NULL;
    }

    return ctx;
}

/**
 * @brief 銷毀補丁生成器
 */
void patch_generator_destroy(patch_generator_context_t *ctx)
{
    if (!ctx) {
        return;
    }

    if (ctx->old_file) {
        fclose(ctx->old_file);
    }

    if (ctx->new_file) {
        fclose(ctx->new_file);
    }

    if (ctx->patch_file) {
        fclose(ctx->patch_file);
    }

    if (ctx->old_buffer) {
        free(ctx->old_buffer);
    }

    if (ctx->new_buffer) {
        free(ctx->new_buffer);
    }

    free(ctx);
}

/**
 * @brief 寫入補丁頭部
 */
static int write_patch_header(patch_generator_context_t *ctx,
                               const char *old_firmware_path,
                               const char *new_firmware_path)
{
    delta_patch_header_t header;
    memset(&header, 0, sizeof(header));

    header.magic = DELTA_MAGIC;
    header.version = DELTA_VERSION;
    header.old_size = ctx->old_size;
    header.new_size = ctx->new_size;
    header.block_size = ctx->config.block_size;
    header.compression = ctx->config.enable_compression ? 1 : 0;

    /* 計算校驗和 */
    calculate_file_sha256(old_firmware_path, header.old_checksum);
    calculate_file_sha256(new_firmware_path, header.new_checksum);

    /* 設置版本號（簡化版） */
    strncpy(header.old_version, "old", sizeof(header.old_version) - 1);
    strncpy(header.new_version, "new", sizeof(header.new_version) - 1);

    /* 寫入頭部 */
    size_t written = fwrite(&header, 1, sizeof(header), ctx->patch_file);
    if (written != sizeof(header)) {
        return -1;
    }

    return 0;
}

/**
 * @brief 尋找最長匹配
 */
static uint32_t find_longest_match(const uint8_t *old_data, uint32_t old_size,
                                    const uint8_t *new_data, uint32_t new_size,
                                    uint32_t *match_offset)
{
    uint32_t max_length = 0;
    *match_offset = 0;

    /* 簡化的匹配算法 - 實際應使用更高效的算法如 rolling hash */
    for (uint32_t i = 0; i < old_size && i < new_size; i++) {
        uint32_t length = 0;
        while (i + length < old_size && i + length < new_size &&
               old_data[i + length] == new_data[i + length]) {
            length++;
        }

        if (length > max_length) {
            max_length = length;
            *match_offset = i;
        }
    }

    return max_length;
}

/**
 * @brief 生成差分補丁
 */
int patch_generator_generate(patch_generator_context_t *ctx,
                              const char *old_firmware_path,
                              const char *new_firmware_path,
                              const char *patch_path)
{
    if (!ctx || !old_firmware_path || !new_firmware_path || !patch_path) {
        return DELTA_ERR_INVALID_PARAM;
    }

    /* 打開文件 */
    ctx->old_file = fopen(old_firmware_path, "rb");
    if (!ctx->old_file) {
        return DELTA_ERR_IO;
    }

    ctx->new_file = fopen(new_firmware_path, "rb");
    if (!ctx->new_file) {
        return DELTA_ERR_IO;
    }

    ctx->patch_file = fopen(patch_path, "wb");
    if (!ctx->patch_file) {
        return DELTA_ERR_IO;
    }

    /* 獲取文件大小 */
    fseek(ctx->old_file, 0, SEEK_END);
    ctx->old_size = ftell(ctx->old_file);
    fseek(ctx->old_file, 0, SEEK_SET);

    fseek(ctx->new_file, 0, SEEK_END);
    ctx->new_size = ftell(ctx->new_file);
    fseek(ctx->new_file, 0, SEEK_SET);

    if (ctx->config.verbose) {
        printf("[Patch Generator] Generating patch...\n");
        printf("  Old size: %u bytes\n", ctx->old_size);
        printf("  New size: %u bytes\n", ctx->new_size);
    }

    /* 寫入頭部 */
    if (write_patch_header(ctx, old_firmware_path, new_firmware_path) != 0) {
        return DELTA_ERR_IO;
    }

    /* 使用塊差分算法生成補丁 */
    block_diff_context_t *diff_ctx = block_diff_create(ctx->config.block_size);
    if (!diff_ctx) {
        return DELTA_ERR_NO_MEMORY;
    }

    int ret = block_diff_generate(diff_ctx, ctx->old_file, ctx->new_file, ctx->patch_file);

    if (ret == 0) {
        block_diff_stats_t stats;
        block_diff_get_stats(diff_ctx, &stats);

        ctx->copy_bytes = stats.copy_bytes;
        ctx->add_bytes = stats.add_bytes;
        ctx->run_bytes = stats.run_bytes;

        fseek(ctx->patch_file, 0, SEEK_END);
        ctx->patch_size = ftell(ctx->patch_file);

        if (ctx->config.verbose) {
            printf("[Patch Generator] Patch generated successfully\n");
            printf("  Patch size: %u bytes\n", ctx->patch_size);
            printf("  Copy operations: %u bytes\n", ctx->copy_bytes);
            printf("  Add operations: %u bytes\n", ctx->add_bytes);
            printf("  Run operations: %u bytes\n", ctx->run_bytes);
            printf("  Compression ratio: %.2f%%\n",
                   patch_generator_get_compression_ratio(ctx));
        }
    }

    block_diff_destroy(diff_ctx);

    return ret;
}

/**
 * @brief 獲取補丁統計信息
 */
int patch_generator_get_stats(const patch_generator_context_t *ctx,
                               uint32_t *copy_bytes,
                               uint32_t *add_bytes,
                               uint32_t *run_bytes)
{
    if (!ctx) {
        return DELTA_ERR_INVALID_PARAM;
    }

    if (copy_bytes) *copy_bytes = ctx->copy_bytes;
    if (add_bytes) *add_bytes = ctx->add_bytes;
    if (run_bytes) *run_bytes = ctx->run_bytes;

    return DELTA_ERR_NONE;
}

/**
 * @brief 獲取壓縮比
 */
float patch_generator_get_compression_ratio(const patch_generator_context_t *ctx)
{
    if (!ctx || ctx->new_size == 0) {
        return 0.0f;
    }

    return ((float)ctx->patch_size / (float)ctx->new_size) * 100.0f;
}
