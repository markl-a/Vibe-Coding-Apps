/**
 * @file test_delta.c
 * @brief 差分更新測試程序
 */

#include "delta_updater.h"
#include "patch_generator.h"
#include "block_diff.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <assert.h>

/* 測試文件路徑 */
#define TEST_OLD_FW "/tmp/test_old_firmware.bin"
#define TEST_NEW_FW "/tmp/test_new_firmware.bin"
#define TEST_PATCH "/tmp/test_firmware.patch"
#define TEST_OUTPUT_FW "/tmp/test_output_firmware.bin"

/* 顏色輸出 */
#define COLOR_GREEN "\033[32m"
#define COLOR_RED "\033[31m"
#define COLOR_YELLOW "\033[33m"
#define COLOR_BLUE "\033[34m"
#define COLOR_RESET "\033[0m"

#define TEST_PASS(name) printf(COLOR_GREEN "[PASS]" COLOR_RESET " %s\n", name)
#define TEST_FAIL(name) printf(COLOR_RED "[FAIL]" COLOR_RESET " %s\n", name)
#define TEST_INFO(fmt, ...) printf(COLOR_YELLOW "[INFO]" COLOR_RESET " " fmt "\n", ##__VA_ARGS__)

/* 進度回調 */
static void progress_callback(uint32_t current, uint32_t total, void *user_data)
{
    int percent = (total > 0) ? (current * 100 / total) : 0;
    printf("\r" COLOR_BLUE "[PROGRESS]" COLOR_RESET " %d%% (%u/%u bytes)",
           percent, current, total);
    fflush(stdout);
}

/* 創建測試固件文件 */
static int create_test_firmware(const char *path, uint32_t size, uint8_t pattern)
{
    FILE *fp = fopen(path, "wb");
    if (!fp) {
        return -1;
    }

    uint8_t *buffer = (uint8_t *)malloc(size);
    if (!buffer) {
        fclose(fp);
        return -1;
    }

    /* 生成測試數據 */
    for (uint32_t i = 0; i < size; i++) {
        buffer[i] = (uint8_t)(pattern + (i % 256));
    }

    size_t written = fwrite(buffer, 1, size, fp);
    free(buffer);
    fclose(fp);

    return (written == size) ? 0 : -1;
}

/* 比較兩個文件是否相同 */
static bool compare_files(const char *file1, const char *file2)
{
    FILE *fp1 = fopen(file1, "rb");
    FILE *fp2 = fopen(file2, "rb");

    if (!fp1 || !fp2) {
        if (fp1) fclose(fp1);
        if (fp2) fclose(fp2);
        return false;
    }

    fseek(fp1, 0, SEEK_END);
    fseek(fp2, 0, SEEK_END);

    long size1 = ftell(fp1);
    long size2 = ftell(fp2);

    if (size1 != size2) {
        fclose(fp1);
        fclose(fp2);
        return false;
    }

    fseek(fp1, 0, SEEK_SET);
    fseek(fp2, 0, SEEK_SET);

    uint8_t buf1[4096], buf2[4096];
    bool identical = true;

    while (!feof(fp1) && !feof(fp2)) {
        size_t read1 = fread(buf1, 1, sizeof(buf1), fp1);
        size_t read2 = fread(buf2, 1, sizeof(buf2), fp2);

        if (read1 != read2 || memcmp(buf1, buf2, read1) != 0) {
            identical = false;
            break;
        }
    }

    fclose(fp1);
    fclose(fp2);

    return identical;
}

/* 測試 1: 塊差分哈希 */
static int test_block_hash(void)
{
    TEST_INFO("Test 1: Block Hash");

    uint8_t data1[16] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15};
    uint8_t data2[16] = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15};
    uint8_t data3[16] = {15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0};

    uint32_t hash1 = block_diff_hash(data1, 16);
    uint32_t hash2 = block_diff_hash(data2, 16);
    uint32_t hash3 = block_diff_hash(data3, 16);

    assert(hash1 == hash2);
    assert(hash1 != hash3);

    TEST_INFO("  Hash1: 0x%08x", hash1);
    TEST_INFO("  Hash2: 0x%08x", hash2);
    TEST_INFO("  Hash3: 0x%08x", hash3);

    TEST_PASS("block hash");
    return 0;
}

/* 測試 2: 塊比較 */
static int test_block_compare(void)
{
    TEST_INFO("Test 2: Block Compare");

    uint8_t block1[256];
    uint8_t block2[256];
    uint8_t block3[256];

    for (int i = 0; i < 256; i++) {
        block1[i] = i;
        block2[i] = i;
        block3[i] = 255 - i;
    }

    assert(block_diff_compare(block1, block2, 256) == true);
    assert(block_diff_compare(block1, block3, 256) == false);

    TEST_PASS("block compare");
    return 0;
}

/* 測試 3: 運行長度檢測 */
static int test_run_detection(void)
{
    TEST_INFO("Test 3: Run-Length Detection");

    uint8_t data1[64];
    memset(data1, 0xAA, 64);

    uint8_t value;
    uint32_t run_length = block_diff_detect_run(data1, 64, &value);

    assert(run_length == 64);
    assert(value == 0xAA);

    TEST_INFO("  Detected run: length=%u, value=0x%02x", run_length, value);

    /* 測試非RLE數據 */
    uint8_t data2[64];
    for (int i = 0; i < 64; i++) {
        data2[i] = i;
    }

    run_length = block_diff_detect_run(data2, 64, &value);
    assert(run_length == 0 || run_length == 1);

    TEST_PASS("run-length detection");
    return 0;
}

/* 測試 4: 補丁生成 */
static int test_patch_generation(void)
{
    TEST_INFO("Test 4: Patch Generation");

    /* 創建測試固件 */
    const uint32_t fw_size = 8192;  /* 8KB */

    if (create_test_firmware(TEST_OLD_FW, fw_size, 0x00) != 0) {
        TEST_FAIL("Failed to create old firmware");
        return -1;
    }

    if (create_test_firmware(TEST_NEW_FW, fw_size, 0x10) != 0) {
        TEST_FAIL("Failed to create new firmware");
        return -1;
    }

    /* 創建補丁生成器 */
    patch_generator_config_t config = {
        .block_size = 1024,
        .enable_compression = false,
        .verbose = true,
        .match_threshold = 32
    };

    patch_generator_context_t *gen_ctx = patch_generator_create(&config);
    assert(gen_ctx != NULL);

    /* 生成補丁 */
    int ret = patch_generator_generate(gen_ctx, TEST_OLD_FW, TEST_NEW_FW, TEST_PATCH);

    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("patch_generator_generate failed");
        patch_generator_destroy(gen_ctx);
        return -1;
    }

    /* 獲取統計信息 */
    uint32_t copy_bytes, add_bytes, run_bytes;
    patch_generator_get_stats(gen_ctx, &copy_bytes, &add_bytes, &run_bytes);

    TEST_INFO("  Copy bytes: %u", copy_bytes);
    TEST_INFO("  Add bytes: %u", add_bytes);
    TEST_INFO("  Run bytes: %u", run_bytes);
    TEST_INFO("  Compression ratio: %.2f%%",
              patch_generator_get_compression_ratio(gen_ctx));

    patch_generator_destroy(gen_ctx);

    TEST_PASS("patch generation");
    return 0;
}

/* 測試 5: 補丁應用 */
static int test_patch_application(void)
{
    TEST_INFO("Test 5: Patch Application");

    /* 初始化差分更新器 */
    delta_context_t ctx;
    int ret = delta_updater_init(&ctx, TEST_OLD_FW, TEST_PATCH, TEST_OUTPUT_FW);

    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("delta_updater_init failed");
        return -1;
    }

    /* 驗證頭部 */
    ret = delta_updater_validate_header(&ctx);
    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("delta_updater_validate_header failed");
        delta_updater_cleanup(&ctx);
        return -1;
    }

    /* 應用補丁 */
    TEST_INFO("Applying patch...");
    ret = delta_updater_apply_patch(&ctx, progress_callback, NULL);
    printf("\n");

    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("delta_updater_apply_patch failed");
        delta_updater_cleanup(&ctx);
        return -1;
    }

    /* 驗證結果 */
    ret = delta_updater_verify(&ctx);
    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("delta_updater_verify failed");
        delta_updater_cleanup(&ctx);
        return -1;
    }

    delta_updater_cleanup(&ctx);

    /* 比較輸出固件和新固件 */
    if (!compare_files(TEST_OUTPUT_FW, TEST_NEW_FW)) {
        TEST_FAIL("Output firmware does not match new firmware");
        return -1;
    }

    TEST_PASS("patch application");
    return 0;
}

/* 測試 6: 補丁頭部讀取 */
static int test_read_header(void)
{
    TEST_INFO("Test 6: Read Patch Header");

    delta_patch_header_t header;
    int ret = delta_updater_read_header(TEST_PATCH, &header);

    if (ret != DELTA_ERR_NONE) {
        TEST_FAIL("delta_updater_read_header failed");
        return -1;
    }

    TEST_INFO("  Magic: 0x%08x", header.magic);
    TEST_INFO("  Version: %u", header.version);
    TEST_INFO("  Old size: %u bytes", header.old_size);
    TEST_INFO("  New size: %u bytes", header.new_size);
    TEST_INFO("  Patch size: %u bytes", header.patch_size);
    TEST_INFO("  Block size: %u bytes", header.block_size);

    assert(header.magic == DELTA_MAGIC);
    assert(header.version == DELTA_VERSION);

    TEST_PASS("read patch header");
    return 0;
}

/* 測試 7: 錯誤處理 */
static int test_error_handling(void)
{
    TEST_INFO("Test 7: Error Handling");

    /* 測試 NULL 參數 */
    int ret = delta_updater_init(NULL, NULL, NULL, NULL);
    assert(ret == DELTA_ERR_INVALID_PARAM);

    /* 測試無效文件路徑 */
    delta_context_t ctx;
    ret = delta_updater_init(&ctx, "/nonexistent/old.bin",
                              "/nonexistent/patch.bin",
                              "/nonexistent/new.bin");
    assert(ret == DELTA_ERR_IO);

    /* 測試無效補丁文件 */
    FILE *fp = fopen("/tmp/invalid_patch.bin", "wb");
    if (fp) {
        const char *invalid_data = "This is not a valid patch file";
        fwrite(invalid_data, 1, strlen(invalid_data), fp);
        fclose(fp);

        delta_patch_header_t header;
        ret = delta_updater_read_header("/tmp/invalid_patch.bin", &header);
        assert(ret == DELTA_ERR_CORRUPT_PATCH);

        unlink("/tmp/invalid_patch.bin");
    }

    TEST_PASS("error handling");
    return 0;
}

/* 清理測試文件 */
static void cleanup_test_files(void)
{
    unlink(TEST_OLD_FW);
    unlink(TEST_NEW_FW);
    unlink(TEST_PATCH);
    unlink(TEST_OUTPUT_FW);
}

/* 運行所有測試 */
int main(int argc, char *argv[])
{
    printf("\n");
    printf("========================================\n");
    printf("   Delta Update Test Suite\n");
    printf("========================================\n");
    printf("\n");

    int failed = 0;

    if (test_block_hash() != 0) failed++;
    printf("\n");

    if (test_block_compare() != 0) failed++;
    printf("\n");

    if (test_run_detection() != 0) failed++;
    printf("\n");

    if (test_patch_generation() != 0) failed++;
    printf("\n");

    if (test_patch_application() != 0) failed++;
    printf("\n");

    if (test_read_header() != 0) failed++;
    printf("\n");

    if (test_error_handling() != 0) failed++;
    printf("\n");

    printf("========================================\n");
    if (failed == 0) {
        printf(COLOR_GREEN "All tests passed!" COLOR_RESET "\n");
    } else {
        printf(COLOR_RED "%d test(s) failed!" COLOR_RESET "\n", failed);
    }
    printf("========================================\n");
    printf("\n");

    /* 清理測試文件 */
    cleanup_test_files();

    return failed;
}
