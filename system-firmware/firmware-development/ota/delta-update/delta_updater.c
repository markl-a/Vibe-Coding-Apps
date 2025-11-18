/**
 * @file delta_updater.c
 * @brief 差分更新應用器實現
 */

#include "delta_updater.h"
#include "block_diff.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/sha.h>
#include <openssl/evp.h>

#define DELTA_MAGIC 0x54415044  /* "DPAT" */
#define DELTA_VERSION 1
#define BUFFER_SIZE (64 * 1024) /* 64KB buffer */

/**
 * @brief 計算文件 SHA256
 */
static int calculate_file_sha256(FILE *fp, uint8_t *output)
{
    if (!fp || !output) {
        return -1;
    }

    fseek(fp, 0, SEEK_SET);

    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    if (!mdctx) {
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

    fseek(fp, 0, SEEK_SET);

    return 0;
}

/**
 * @brief 初始化差分更新上下文
 */
int delta_updater_init(delta_context_t *ctx,
                       const char *old_firmware_path,
                       const char *patch_path,
                       const char *new_firmware_path)
{
    if (!ctx || !old_firmware_path || !patch_path || !new_firmware_path) {
        return DELTA_ERR_INVALID_PARAM;
    }

    memset(ctx, 0, sizeof(delta_context_t));

    /* 打開文件 */
    ctx->old_file = fopen(old_firmware_path, "rb");
    if (!ctx->old_file) {
        return DELTA_ERR_IO;
    }

    ctx->patch_file = fopen(patch_path, "rb");
    if (!ctx->patch_file) {
        fclose(ctx->old_file);
        return DELTA_ERR_IO;
    }

    ctx->new_file = fopen(new_firmware_path, "wb");
    if (!ctx->new_file) {
        fclose(ctx->old_file);
        fclose(ctx->patch_file);
        return DELTA_ERR_IO;
    }

    /* 讀取補丁頭部 */
    size_t read = fread(&ctx->header, 1, sizeof(delta_patch_header_t), ctx->patch_file);
    if (read != sizeof(delta_patch_header_t)) {
        delta_updater_cleanup(ctx);
        return DELTA_ERR_IO;
    }

    /* 驗證魔數 */
    if (ctx->header.magic != DELTA_MAGIC) {
        delta_updater_cleanup(ctx);
        return DELTA_ERR_CORRUPT_PATCH;
    }

    /* 分配緩衝區 */
    ctx->buffer_size = BUFFER_SIZE;
    ctx->buffer = (uint8_t *)malloc(ctx->buffer_size);
    if (!ctx->buffer) {
        delta_updater_cleanup(ctx);
        return DELTA_ERR_NO_MEMORY;
    }

    ctx->verify_checksum = true;
    ctx->total_bytes = ctx->header.new_size;
    ctx->processed_bytes = 0;

    printf("[Delta] Initialized updater\n");
    printf("  Old version: %s (%u bytes)\n", ctx->header.old_version, ctx->header.old_size);
    printf("  New version: %s (%u bytes)\n", ctx->header.new_version, ctx->header.new_size);
    printf("  Patch size: %u bytes\n", ctx->header.patch_size);

    return DELTA_ERR_NONE;
}

/**
 * @brief 清理差分更新上下文
 */
void delta_updater_cleanup(delta_context_t *ctx)
{
    if (!ctx) {
        return;
    }

    if (ctx->old_file) {
        fclose(ctx->old_file);
        ctx->old_file = NULL;
    }

    if (ctx->patch_file) {
        fclose(ctx->patch_file);
        ctx->patch_file = NULL;
    }

    if (ctx->new_file) {
        fclose(ctx->new_file);
        ctx->new_file = NULL;
    }

    if (ctx->buffer) {
        free(ctx->buffer);
        ctx->buffer = NULL;
    }
}

/**
 * @brief 驗證補丁頭部
 */
int delta_updater_validate_header(delta_context_t *ctx)
{
    if (!ctx) {
        return DELTA_ERR_INVALID_PARAM;
    }

    /* 驗證魔數 */
    if (ctx->header.magic != DELTA_MAGIC) {
        return DELTA_ERR_CORRUPT_PATCH;
    }

    /* 驗證版本 */
    if (ctx->header.version > DELTA_VERSION) {
        return DELTA_ERR_UNSUPPORTED;
    }

    /* 驗證舊固件校驗和 */
    if (ctx->verify_checksum) {
        uint8_t old_checksum[32];
        if (calculate_file_sha256(ctx->old_file, old_checksum) != 0) {
            return DELTA_ERR_IO;
        }

        if (memcmp(old_checksum, ctx->header.old_checksum, 32) != 0) {
            printf("[Delta] Old firmware checksum mismatch\n");
            return DELTA_ERR_CHECKSUM;
        }
    }

    /* 驗證舊固件大小 */
    fseek(ctx->old_file, 0, SEEK_END);
    long old_size = ftell(ctx->old_file);
    fseek(ctx->old_file, 0, SEEK_SET);

    if ((uint32_t)old_size != ctx->header.old_size) {
        printf("[Delta] Old firmware size mismatch: expected=%u, actual=%ld\n",
               ctx->header.old_size, old_size);
        return DELTA_ERR_SIZE;
    }

    printf("[Delta] Header validation passed\n");
    return DELTA_ERR_NONE;
}

/**
 * @brief 應用差分補丁
 */
int delta_updater_apply_patch(delta_context_t *ctx,
                               delta_progress_callback_t callback,
                               void *user_data)
{
    if (!ctx) {
        return DELTA_ERR_INVALID_PARAM;
    }

    printf("[Delta] Applying patch...\n");

    /* 讀取並應用差分操作 */
    while (!feof(ctx->patch_file)) {
        /* 讀取操作類型 */
        uint8_t op_type;
        if (fread(&op_type, 1, 1, ctx->patch_file) != 1) {
            break;
        }

        uint32_t offset, length;

        switch (op_type) {
        case DELTA_OP_COPY:
            /* 從舊固件複製數據 */
            if (fread(&offset, sizeof(uint32_t), 1, ctx->patch_file) != 1 ||
                fread(&length, sizeof(uint32_t), 1, ctx->patch_file) != 1) {
                return DELTA_ERR_CORRUPT_PATCH;
            }

            fseek(ctx->old_file, offset, SEEK_SET);

            while (length > 0) {
                size_t to_read = (length > ctx->buffer_size) ? ctx->buffer_size : length;
                size_t read = fread(ctx->buffer, 1, to_read, ctx->old_file);
                if (read != to_read) {
                    return DELTA_ERR_IO;
                }

                size_t written = fwrite(ctx->buffer, 1, read, ctx->new_file);
                if (written != read) {
                    return DELTA_ERR_IO;
                }

                length -= read;
                ctx->processed_bytes += read;
            }
            break;

        case DELTA_OP_ADD:
            /* 添加新數據 */
            if (fread(&length, sizeof(uint32_t), 1, ctx->patch_file) != 1) {
                return DELTA_ERR_CORRUPT_PATCH;
            }

            while (length > 0) {
                size_t to_read = (length > ctx->buffer_size) ? ctx->buffer_size : length;
                size_t read = fread(ctx->buffer, 1, to_read, ctx->patch_file);
                if (read != to_read) {
                    return DELTA_ERR_IO;
                }

                size_t written = fwrite(ctx->buffer, 1, read, ctx->new_file);
                if (written != read) {
                    return DELTA_ERR_IO;
                }

                length -= read;
                ctx->processed_bytes += read;
            }
            break;

        case DELTA_OP_RUN:
            /* 運行長度編碼 */
            uint8_t value;
            if (fread(&value, 1, 1, ctx->patch_file) != 1 ||
                fread(&length, sizeof(uint32_t), 1, ctx->patch_file) != 1) {
                return DELTA_ERR_CORRUPT_PATCH;
            }

            memset(ctx->buffer, value, (length > ctx->buffer_size) ? ctx->buffer_size : length);

            while (length > 0) {
                size_t to_write = (length > ctx->buffer_size) ? ctx->buffer_size : length;
                size_t written = fwrite(ctx->buffer, 1, to_write, ctx->new_file);
                if (written != to_write) {
                    return DELTA_ERR_IO;
                }

                length -= written;
                ctx->processed_bytes += written;
            }
            break;

        default:
            printf("[Delta] Unknown operation type: %u\n", op_type);
            return DELTA_ERR_CORRUPT_PATCH;
        }

        /* 調用進度回調 */
        if (callback) {
            callback(ctx->processed_bytes, ctx->total_bytes, user_data);
        }
    }

    fflush(ctx->new_file);

    printf("[Delta] Patch applied successfully\n");
    printf("  Processed: %u bytes\n", ctx->processed_bytes);

    return DELTA_ERR_NONE;
}

/**
 * @brief 驗證生成的固件
 */
int delta_updater_verify(delta_context_t *ctx)
{
    if (!ctx) {
        return DELTA_ERR_INVALID_PARAM;
    }

    printf("[Delta] Verifying new firmware...\n");

    /* 驗證大小 */
    fseek(ctx->new_file, 0, SEEK_END);
    long new_size = ftell(ctx->new_file);
    fseek(ctx->new_file, 0, SEEK_SET);

    if ((uint32_t)new_size != ctx->header.new_size) {
        printf("[Delta] Size mismatch: expected=%u, actual=%ld\n",
               ctx->header.new_size, new_size);
        return DELTA_ERR_SIZE;
    }

    /* 驗證校驗和 */
    if (ctx->verify_checksum) {
        uint8_t new_checksum[32];
        if (calculate_file_sha256(ctx->new_file, new_checksum) != 0) {
            return DELTA_ERR_IO;
        }

        if (memcmp(new_checksum, ctx->header.new_checksum, 32) != 0) {
            printf("[Delta] Checksum mismatch\n");
            return DELTA_ERR_CHECKSUM;
        }
    }

    printf("[Delta] Verification passed\n");
    return DELTA_ERR_NONE;
}

/**
 * @brief 讀取補丁頭部
 */
int delta_updater_read_header(const char *patch_path, delta_patch_header_t *header)
{
    if (!patch_path || !header) {
        return DELTA_ERR_INVALID_PARAM;
    }

    FILE *fp = fopen(patch_path, "rb");
    if (!fp) {
        return DELTA_ERR_IO;
    }

    size_t read = fread(header, 1, sizeof(delta_patch_header_t), fp);
    fclose(fp);

    if (read != sizeof(delta_patch_header_t)) {
        return DELTA_ERR_IO;
    }

    if (header->magic != DELTA_MAGIC) {
        return DELTA_ERR_CORRUPT_PATCH;
    }

    return DELTA_ERR_NONE;
}

/**
 * @brief 獲取進度百分比
 */
uint8_t delta_updater_get_progress(const delta_context_t *ctx)
{
    if (!ctx || ctx->total_bytes == 0) {
        return 0;
    }

    return (uint8_t)((ctx->processed_bytes * 100) / ctx->total_bytes);
}

/**
 * @brief 設置校驗和驗證
 */
void delta_updater_set_verify(delta_context_t *ctx, bool verify)
{
    if (ctx) {
        ctx->verify_checksum = verify;
    }
}
