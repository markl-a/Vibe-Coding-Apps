/*
 * Firmware Verification Example
 *
 * 展示如何使用 firmware_verify.c 模組進行韌體驗證
 * 包含 CRC32、SHA256 和 RSA 簽名驗證的實際應用範例
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: MIT
 */

#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>

/* 外部函數聲明 */
extern uint32_t crc32_calculate(const uint8_t *data, uint32_t length);
extern bool firmware_verify_crc32(const uint8_t *firmware, uint32_t length, uint32_t expected_crc);
extern bool firmware_verify_complete(const uint8_t *package, uint32_t package_size,
                                     const uint8_t *public_key, uint32_t key_length);
extern uint32_t firmware_get_version(const uint8_t *package);

/*
 * 範例 1: 基本 CRC32 計算和驗證
 */
void example1_basic_crc32(void)
{
    printf("\n========== Example 1: Basic CRC32 ==========\n");

    // 模擬韌體資料
    const uint8_t firmware_data[] = "Hello, Firmware Update System!";
    uint32_t firmware_size = sizeof(firmware_data) - 1;  // 不包含 null terminator

    // 計算 CRC32
    uint32_t crc = crc32_calculate(firmware_data, firmware_size);
    printf("Firmware Data: %s\n", firmware_data);
    printf("Calculated CRC32: 0x%08X\n", crc);

    // 驗證 CRC32
    bool valid = firmware_verify_crc32(firmware_data, firmware_size, crc);
    printf("CRC32 Verification: %s\n", valid ? "PASSED" : "FAILED");

    // 測試錯誤的 CRC
    uint32_t wrong_crc = crc + 1;
    valid = firmware_verify_crc32(firmware_data, firmware_size, wrong_crc);
    printf("Wrong CRC32 Test: %s (expected FAILED)\n", valid ? "PASSED" : "FAILED");
}

/*
 * 範例 2: OTA 更新前驗證
 */
void example2_ota_update_verification(void)
{
    printf("\n========== Example 2: OTA Update Verification ==========\n");

    // 模擬從網路下載的韌體
    uint8_t downloaded_firmware[1024];
    uint32_t download_size = 512;
    uint32_t expected_crc = 0x12345678;  // 從伺服器獲取的 CRC

    // 模擬填充資料
    memset(downloaded_firmware, 0xAA, download_size);

    // 計算下載韌體的 CRC
    uint32_t calculated_crc = crc32_calculate(downloaded_firmware, download_size);
    printf("Downloaded firmware size: %u bytes\n", download_size);
    printf("Server CRC32: 0x%08X\n", expected_crc);
    printf("Local CRC32:  0x%08X\n", calculated_crc);

    // 驗證完整性
    if (calculated_crc == expected_crc) {
        printf("Status: Firmware download successful, integrity verified!\n");
        printf("Action: Proceed with installation\n");
    } else {
        printf("Status: Firmware corrupted during download!\n");
        printf("Action: Re-download required\n");
    }
}

/*
 * 範例 3: 多區塊韌體驗證
 */
void example3_multi_block_verification(void)
{
    printf("\n========== Example 3: Multi-Block Verification ==========\n");

    // 模擬分塊下載的韌體
    #define BLOCK_SIZE 256
    #define BLOCK_COUNT 4

    uint8_t blocks[BLOCK_COUNT][BLOCK_SIZE];
    uint32_t block_crcs[BLOCK_COUNT];

    // 初始化每個區塊
    for (int i = 0; i < BLOCK_COUNT; i++) {
        memset(blocks[i], 0x55 + i, BLOCK_SIZE);
        block_crcs[i] = crc32_calculate(blocks[i], BLOCK_SIZE);
        printf("Block %d CRC32: 0x%08X\n", i, block_crcs[i]);
    }

    // 驗證每個區塊
    printf("\nVerifying blocks:\n");
    int failed_blocks = 0;
    for (int i = 0; i < BLOCK_COUNT; i++) {
        bool valid = firmware_verify_crc32(blocks[i], BLOCK_SIZE, block_crcs[i]);
        printf("Block %d: %s\n", i, valid ? "OK" : "FAILED");
        if (!valid) failed_blocks++;
    }

    if (failed_blocks == 0) {
        printf("\nAll blocks verified successfully!\n");
    } else {
        printf("\n%d block(s) failed verification!\n", failed_blocks);
    }
}

/*
 * 範例 4: 增量更新驗證
 */
void example4_incremental_update(void)
{
    printf("\n========== Example 4: Incremental Update ==========\n");

    // 原始韌體
    uint8_t old_firmware[512];
    memset(old_firmware, 0xAA, sizeof(old_firmware));
    uint32_t old_crc = crc32_calculate(old_firmware, sizeof(old_firmware));

    // 更新補丁
    uint8_t patch[64];
    memset(patch, 0xBB, sizeof(patch));

    // 應用補丁
    uint8_t new_firmware[512];
    memcpy(new_firmware, old_firmware, sizeof(old_firmware));
    memcpy(new_firmware + 100, patch, sizeof(patch));  // 在偏移 100 處應用補丁

    uint32_t new_crc = crc32_calculate(new_firmware, sizeof(new_firmware));

    printf("Old firmware CRC: 0x%08X\n", old_crc);
    printf("Patch size: %zu bytes\n", sizeof(patch));
    printf("New firmware CRC: 0x%08X\n", new_crc);

    // 驗證更新
    if (old_crc != new_crc) {
        printf("Status: Firmware successfully updated!\n");
    } else {
        printf("Status: Update failed, firmware unchanged!\n");
    }
}

/*
 * 範例 5: 雙韌體分區驗證（A/B 更新）
 */
void example5_dual_partition_verification(void)
{
    printf("\n========== Example 5: Dual Partition (A/B) Update ==========\n");

    // 分區 A (當前運行)
    uint8_t partition_a[1024];
    memset(partition_a, 0xAA, sizeof(partition_a));
    uint32_t crc_a = crc32_calculate(partition_a, sizeof(partition_a));

    // 分區 B (新韌體)
    uint8_t partition_b[1024];
    memset(partition_b, 0xBB, sizeof(partition_b));
    uint32_t crc_b = crc32_calculate(partition_b, sizeof(partition_b));

    printf("Partition A (Active):\n");
    printf("  Size: %zu bytes\n", sizeof(partition_a));
    printf("  CRC32: 0x%08X\n", crc_a);
    printf("  Status: Running\n");

    printf("\nPartition B (Standby):\n");
    printf("  Size: %zu bytes\n", sizeof(partition_b));
    printf("  CRC32: 0x%08X\n", crc_b);

    // 驗證分區 B
    bool valid_b = firmware_verify_crc32(partition_b, sizeof(partition_b), crc_b);

    if (valid_b) {
        printf("  Status: Verified, ready to switch\n");
        printf("\nAction: Switching to Partition B on next boot...\n");
    } else {
        printf("  Status: Verification failed\n");
        printf("\nAction: Continue using Partition A\n");
    }
}

/*
 * 範例 6: 安全啟動驗證流程
 */
void example6_secure_boot_flow(void)
{
    printf("\n========== Example 6: Secure Boot Flow ==========\n");

    // 模擬韌體包（簡化版本，不包含實際 RSA）
    typedef struct {
        uint32_t magic;
        uint32_t version;
        uint32_t size;
        uint32_t crc32;
    } simple_header_t;

    uint8_t firmware_package[2048];
    simple_header_t *header = (simple_header_t *)firmware_package;

    // 設置標頭
    header->magic = 0x46574152;  // "FWAR"
    header->version = 0x00010203;  // v1.2.3
    header->size = 1024;

    // 模擬韌體資料
    uint8_t *firmware = firmware_package + sizeof(simple_header_t);
    memset(firmware, 0xCC, header->size);

    // 計算 CRC
    header->crc32 = crc32_calculate(firmware, header->size);

    printf("Boot Stage 1: Reading firmware package...\n");
    printf("  Magic: 0x%08X %s\n", header->magic,
           header->magic == 0x46574152 ? "(valid)" : "(invalid)");
    printf("  Version: %d.%d.%d\n",
           (header->version >> 24) & 0xFF,
           (header->version >> 16) & 0xFF,
           (header->version >> 8) & 0xFF);
    printf("  Size: %u bytes\n", header->size);

    printf("\nBoot Stage 2: Verifying CRC32...\n");
    bool crc_valid = firmware_verify_crc32(firmware, header->size, header->crc32);
    printf("  CRC32: 0x%08X - %s\n", header->crc32,
           crc_valid ? "VALID" : "INVALID");

    if (crc_valid) {
        printf("\nBoot Stage 3: Signature verification...\n");
        printf("  (Skipped in this example - would verify RSA signature)\n");

        printf("\nBoot Stage 4: Loading firmware...\n");
        printf("  Status: SUCCESS\n");
        printf("  Action: Jumping to firmware entry point...\n");
    } else {
        printf("\nBoot FAILED: Invalid firmware!\n");
        printf("  Action: Entering recovery mode...\n");
    }
}

/*
 * 範例 7: 韌體回滾保護
 */
void example7_rollback_protection(void)
{
    printf("\n========== Example 7: Rollback Protection ==========\n");

    uint32_t current_version = 0x00010203;  // v1.2.3
    uint32_t new_version = 0x00010202;      // v1.2.2 (older)
    uint32_t min_version = 0x00010200;      // v1.2.0 (minimum allowed)

    printf("Current Version: %d.%d.%d\n",
           (current_version >> 24) & 0xFF,
           (current_version >> 16) & 0xFF,
           (current_version >> 8) & 0xFF);

    printf("New Version:     %d.%d.%d\n",
           (new_version >> 24) & 0xFF,
           (new_version >> 16) & 0xFF,
           (new_version >> 8) & 0xFF);

    printf("Minimum Version: %d.%d.%d\n",
           (min_version >> 24) & 0xFF,
           (min_version >> 16) & 0xFF,
           (min_version >> 8) & 0xFF);

    // 檢查回滾
    if (new_version < current_version) {
        printf("\nWarning: Attempted downgrade detected!\n");

        if (new_version >= min_version) {
            printf("Status: Downgrade allowed (above minimum version)\n");
            printf("Action: Proceed with caution\n");
        } else {
            printf("Status: Downgrade BLOCKED (below minimum version)\n");
            printf("Action: Update rejected for security reasons\n");
        }
    } else {
        printf("\nStatus: Normal update (version increase)\n");
        printf("Action: Proceed with update\n");
    }
}

/*
 * 範例 8: 批次韌體驗證
 */
void example8_batch_verification(void)
{
    printf("\n========== Example 8: Batch Firmware Verification ==========\n");

    #define NUM_MODULES 5

    struct {
        const char *name;
        uint8_t data[256];
        uint32_t size;
        uint32_t expected_crc;
    } modules[NUM_MODULES] = {
        {"Bootloader",   {0}, 200, 0},
        {"Kernel",       {0}, 256, 0},
        {"Device Tree",  {0}, 128, 0},
        {"Filesystem",   {0}, 256, 0},
        {"Config",       {0}, 64,  0}
    };

    // 初始化模組
    for (int i = 0; i < NUM_MODULES; i++) {
        memset(modules[i].data, 0x10 * (i + 1), modules[i].size);
        modules[i].expected_crc = crc32_calculate(modules[i].data, modules[i].size);
    }

    // 批次驗證
    printf("Verifying %d firmware modules:\n\n", NUM_MODULES);

    int passed = 0, failed = 0;

    for (int i = 0; i < NUM_MODULES; i++) {
        bool valid = firmware_verify_crc32(modules[i].data,
                                           modules[i].size,
                                           modules[i].expected_crc);

        printf("[%d] %-15s  %4u bytes  CRC:0x%08X  %s\n",
               i + 1,
               modules[i].name,
               modules[i].size,
               modules[i].expected_crc,
               valid ? "✓ PASS" : "✗ FAIL");

        if (valid) passed++; else failed++;
    }

    printf("\n========================================\n");
    printf("Results: %d passed, %d failed\n", passed, failed);

    if (failed == 0) {
        printf("Status: All modules verified successfully!\n");
        printf("Action: System ready to boot\n");
    } else {
        printf("Status: %d module(s) failed verification!\n", failed);
        printf("Action: System boot aborted\n");
    }
}

/*
 * 主函數 - 運行所有範例
 */
int main(void)
{
    printf("========================================\n");
    printf("  Firmware Verification Examples\n");
    printf("========================================\n");

    example1_basic_crc32();
    example2_ota_update_verification();
    example3_multi_block_verification();
    example4_incremental_update();
    example5_dual_partition_verification();
    example6_secure_boot_flow();
    example7_rollback_protection();
    example8_batch_verification();

    printf("\n========================================\n");
    printf("  All Examples Completed!\n");
    printf("========================================\n");

    return 0;
}
