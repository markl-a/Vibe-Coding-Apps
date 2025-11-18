/**
 * @file test_rollback.c
 * @brief 回滾系統測試程序
 */

#include "rollback.h"
#include "boot_flag.h"
#include "version_check.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <assert.h>

/* 測試文件路徑 */
#define TEST_BOOT_FLAG_PATH "/tmp/test_boot_flag.bin"
#define TEST_PARTITION_A_PATH "/tmp/test_partition_a.bin"
#define TEST_PARTITION_B_PATH "/tmp/test_partition_b.bin"

/* 顏色輸出 */
#define COLOR_GREEN "\033[32m"
#define COLOR_RED "\033[31m"
#define COLOR_YELLOW "\033[33m"
#define COLOR_RESET "\033[0m"

#define TEST_PASS(name) printf(COLOR_GREEN "[PASS]" COLOR_RESET " %s\n", name)
#define TEST_FAIL(name) printf(COLOR_RED "[FAIL]" COLOR_RESET " %s\n", name)
#define TEST_INFO(fmt, ...) printf(COLOR_YELLOW "[INFO]" COLOR_RESET " " fmt "\n", ##__VA_ARGS__)

/* 測試 1: 版本解析和比較 */
static int test_version_parse(void)
{
    TEST_INFO("Test 1: Version Parse and Compare");

    version_t v1, v2, v3;

    /* 解析版本字符串 */
    assert(version_parse("1.0.0", &v1) == 0);
    assert(v1.major == 1 && v1.minor == 0 && v1.patch == 0);

    assert(version_parse("2.5.3", &v2) == 0);
    assert(v2.major == 2 && v2.minor == 5 && v2.patch == 3);

    assert(version_parse("1.2.3.456", &v3) == 0);
    assert(v3.major == 1 && v3.minor == 2 && v3.patch == 3 && v3.build == 456);

    /* 版本比較 */
    assert(version_compare(&v1, &v2) < 0);  /* 1.0.0 < 2.5.3 */
    assert(version_compare(&v2, &v1) > 0);  /* 2.5.3 > 1.0.0 */
    assert(version_compare(&v1, &v1) == 0); /* 1.0.0 == 1.0.0 */

    /* 升級/降級檢查 */
    assert(version_is_upgrade(&v1, &v2) == true);
    assert(version_is_downgrade(&v2, &v1) == true);

    /* 版本轉字符串 */
    char ver_str[32];
    version_to_string(&v2, ver_str, sizeof(ver_str));
    TEST_INFO("  Version: %s", ver_str);

    TEST_PASS("version parse and compare");
    return 0;
}

/* 測試 2: 啟動標誌讀寫 */
static int test_boot_flag(void)
{
    TEST_INFO("Test 2: Boot Flag Read/Write");

    boot_flag_t flag;

    /* 初始化標誌 */
    boot_flag_init(&flag);
    assert(flag.magic == BOOT_FLAG_MAGIC);
    assert(flag.version == BOOT_FLAG_VERSION);
    assert(flag.active_slot == PARTITION_SLOT_A);

    /* 設置一些值 */
    flag.boot_count_a = 3;
    flag.successful_boots_a = 2;
    flag.boot_count_b = 1;

    /* 寫入文件 */
    int ret = boot_flag_write(&flag, TEST_BOOT_FLAG_PATH);
    assert(ret == 0);

    /* 讀取文件 */
    boot_flag_t flag_read;
    ret = boot_flag_read(&flag_read, TEST_BOOT_FLAG_PATH);
    assert(ret == 0);

    /* 驗證數據 */
    assert(flag_read.magic == flag.magic);
    assert(flag_read.version == flag.version);
    assert(flag_read.active_slot == flag.active_slot);
    assert(flag_read.boot_count_a == 3);
    assert(flag_read.successful_boots_a == 2);
    assert(flag_read.boot_count_b == 1);

    /* 驗證標誌 */
    assert(boot_flag_validate(&flag_read) == true);

    /* 增加啟動計數 */
    boot_flag_increment_boot_count(&flag_read, PARTITION_SLOT_A);
    assert(flag_read.boot_count_a == 4);

    /* 標記成功啟動 */
    boot_flag_mark_boot_successful(&flag_read, PARTITION_SLOT_A);
    assert(flag_read.successful_boots_a == 3);
    assert(flag_read.boot_count_a == 0);

    TEST_PASS("boot flag read/write");
    return 0;
}

/* 測試 3: 回滾系統初始化 */
static int test_rollback_init(void)
{
    TEST_INFO("Test 3: Rollback System Init");

    rollback_config_t config = {
        .max_boot_attempts = 3,
        .watchdog_timeout_ms = 30000,
        .auto_rollback = true,
        .verify_checksum = false,
        .partition_a_path = TEST_PARTITION_A_PATH,
        .partition_b_path = TEST_PARTITION_B_PATH,
        .boot_flag_path = TEST_BOOT_FLAG_PATH
    };

    rollback_context_t ctx;
    int ret = rollback_init(&ctx, &config);
    assert(ret == 0);

    /* 檢查初始狀態 */
    partition_slot_t active_slot = rollback_get_active_slot(&ctx);
    TEST_INFO("  Active slot: %c", (active_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    partition_slot_t inactive_slot = rollback_get_inactive_slot(&ctx);
    TEST_INFO("  Inactive slot: %c", (inactive_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    assert(active_slot != inactive_slot);

    rollback_cleanup(&ctx);

    TEST_PASS("rollback system init");
    return 0;
}

/* 測試 4: 分區切換 */
static int test_partition_switch(void)
{
    TEST_INFO("Test 4: Partition Switch");

    rollback_config_t config = {
        .max_boot_attempts = 3,
        .auto_rollback = true,
        .verify_checksum = false,
        .partition_a_path = TEST_PARTITION_A_PATH,
        .partition_b_path = TEST_PARTITION_B_PATH,
        .boot_flag_path = TEST_BOOT_FLAG_PATH
    };

    rollback_context_t ctx;
    rollback_init(&ctx, &config);

    partition_slot_t original_slot = rollback_get_active_slot(&ctx);

    /* 切換到另一個分區 */
    partition_slot_t new_slot = rollback_get_inactive_slot(&ctx);
    int ret = rollback_set_active_slot(&ctx, new_slot);
    assert(ret == 0);

    /* 驗證切換成功 */
    partition_slot_t current_slot = rollback_get_active_slot(&ctx);
    assert(current_slot == new_slot);
    assert(current_slot != original_slot);

    TEST_INFO("  Switched: %c -> %c",
              (original_slot == PARTITION_SLOT_A) ? 'A' : 'B',
              (current_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    rollback_cleanup(&ctx);

    TEST_PASS("partition switch");
    return 0;
}

/* 測試 5: 啟動計數和回滾觸發 */
static int test_rollback_trigger(void)
{
    TEST_INFO("Test 5: Rollback Trigger");

    rollback_config_t config = {
        .max_boot_attempts = 3,
        .auto_rollback = true,
        .verify_checksum = false,
        .partition_a_path = TEST_PARTITION_A_PATH,
        .partition_b_path = TEST_PARTITION_B_PATH,
        .boot_flag_path = TEST_BOOT_FLAG_PATH
    };

    rollback_context_t ctx;
    rollback_init(&ctx, &config);

    /* 模擬失敗的啟動 */
    for (uint32_t i = 0; i < config.max_boot_attempts; i++) {
        if (ctx.current_slot == PARTITION_SLOT_A) {
            ctx.partition_a.boot_count++;
        } else {
            ctx.partition_b.boot_count++;
        }
    }

    /* 檢查是否應該回滾 */
    bool should_rollback = rollback_should_rollback(&ctx);
    assert(should_rollback == true);

    TEST_INFO("  Should rollback: %s", should_rollback ? "yes" : "no");

    /* 執行回滾 */
    partition_slot_t old_slot = ctx.current_slot;
    int ret = rollback_perform(&ctx);
    assert(ret == 0);

    partition_slot_t new_slot = ctx.current_slot;
    assert(new_slot != old_slot);
    assert(ctx.rollback_triggered == true);

    TEST_INFO("  Rolled back: %c -> %c",
              (old_slot == PARTITION_SLOT_A) ? 'A' : 'B',
              (new_slot == PARTITION_SLOT_A) ? 'A' : 'B');

    rollback_cleanup(&ctx);

    TEST_PASS("rollback trigger");
    return 0;
}

/* 測試 6: 成功啟動標記 */
static int test_boot_successful(void)
{
    TEST_INFO("Test 6: Boot Successful Mark");

    rollback_config_t config = {
        .max_boot_attempts = 3,
        .auto_rollback = true,
        .verify_checksum = false,
        .partition_a_path = TEST_PARTITION_A_PATH,
        .partition_b_path = TEST_PARTITION_B_PATH,
        .boot_flag_path = TEST_BOOT_FLAG_PATH
    };

    rollback_context_t ctx;
    rollback_init(&ctx, &config);

    /* 設置一些啟動計數 */
    if (ctx.current_slot == PARTITION_SLOT_A) {
        ctx.partition_a.boot_count = 2;
    } else {
        ctx.partition_b.boot_count = 2;
    }

    /* 標記啟動成功 */
    int ret = rollback_mark_boot_successful(&ctx);
    assert(ret == 0);

    /* 驗證計數器已重置 */
    if (ctx.current_slot == PARTITION_SLOT_A) {
        assert(ctx.partition_a.boot_count == 0);
        TEST_INFO("  Partition A successful boots: %u",
                  ctx.partition_a.successful_boots);
    } else {
        assert(ctx.partition_b.boot_count == 0);
        TEST_INFO("  Partition B successful boots: %u",
                  ctx.partition_b.successful_boots);
    }

    rollback_cleanup(&ctx);

    TEST_PASS("boot successful mark");
    return 0;
}

/* 測試 7: 分區信息獲取 */
static int test_partition_info(void)
{
    TEST_INFO("Test 7: Get Partition Info");

    rollback_config_t config = {
        .max_boot_attempts = 3,
        .auto_rollback = true,
        .verify_checksum = false,
        .partition_a_path = TEST_PARTITION_A_PATH,
        .partition_b_path = TEST_PARTITION_B_PATH,
        .boot_flag_path = TEST_BOOT_FLAG_PATH
    };

    rollback_context_t ctx;
    rollback_init(&ctx, &config);

    partition_info_t info_a, info_b;

    /* 獲取分區 A 信息 */
    int ret = rollback_get_partition_info(&ctx, PARTITION_SLOT_A, &info_a);
    assert(ret == 0);
    assert(info_a.slot == PARTITION_SLOT_A);

    /* 獲取分區 B 信息 */
    ret = rollback_get_partition_info(&ctx, PARTITION_SLOT_B, &info_b);
    assert(ret == 0);
    assert(info_b.slot == PARTITION_SLOT_B);

    TEST_INFO("  Partition A state: %d", info_a.state);
    TEST_INFO("  Partition B state: %d", info_b.state);

    rollback_cleanup(&ctx);

    TEST_PASS("get partition info");
    return 0;
}

/* 清理測試文件 */
static void cleanup_test_files(void)
{
    unlink(TEST_BOOT_FLAG_PATH);
    unlink(TEST_PARTITION_A_PATH);
    unlink(TEST_PARTITION_B_PATH);
}

/* 運行所有測試 */
int main(int argc, char *argv[])
{
    printf("\n");
    printf("========================================\n");
    printf("   Rollback System Test Suite\n");
    printf("========================================\n");
    printf("\n");

    int failed = 0;

    if (test_version_parse() != 0) failed++;
    printf("\n");

    if (test_boot_flag() != 0) failed++;
    printf("\n");

    if (test_rollback_init() != 0) failed++;
    printf("\n");

    if (test_partition_switch() != 0) failed++;
    printf("\n");

    if (test_rollback_trigger() != 0) failed++;
    printf("\n");

    if (test_boot_successful() != 0) failed++;
    printf("\n");

    if (test_partition_info() != 0) failed++;
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
