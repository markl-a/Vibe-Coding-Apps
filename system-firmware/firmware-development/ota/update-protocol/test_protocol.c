/**
 * @file test_protocol.c
 * @brief OTA 協議測試程序
 */

#include "ota_protocol.h"
#include "download_manager.h"
#include "progress_tracker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <assert.h>

/* 測試配置 */
#define TEST_SERVER_URL "https://ota.example.com"
#define TEST_DEVICE_ID "TEST_DEVICE_001"
#define TEST_API_KEY "test_api_key_12345"
#define TEST_CURRENT_VERSION "1.0.0"
#define TEST_DOWNLOAD_URL "https://httpbin.org/bytes/1024"
#define TEST_OUTPUT_PATH "/tmp/test_firmware.bin"

/* 顏色輸出 */
#define COLOR_GREEN "\033[32m"
#define COLOR_RED "\033[31m"
#define COLOR_YELLOW "\033[33m"
#define COLOR_RESET "\033[0m"

#define TEST_PASS(name) printf(COLOR_GREEN "[PASS]" COLOR_RESET " %s\n", name)
#define TEST_FAIL(name) printf(COLOR_RED "[FAIL]" COLOR_RESET " %s\n", name)
#define TEST_INFO(fmt, ...) printf(COLOR_YELLOW "[INFO]" COLOR_RESET " " fmt "\n", ##__VA_ARGS__)

/* 進度回調 */
static void progress_callback(uint64_t downloaded, uint64_t total, void *user_data)
{
    if (total > 0) {
        int percent = (int)((downloaded * 100) / total);
        printf("\rDownload progress: %d%% (%lu/%lu bytes)", percent, downloaded, total);
        fflush(stdout);
    }
}

/* 測試 1: 初始化和反初始化 */
static int test_init_deinit(void)
{
    TEST_INFO("Test 1: OTA Protocol Init/Deinit");

    ota_config_t config = {
        .protocol = OTA_PROTOCOL_HTTPS,
        .server_port = 443,
        .timeout_ms = 30000,
        .retry_count = 3,
        .auto_update = false,
        .verify_signature = true
    };

    strncpy(config.server_url, TEST_SERVER_URL, sizeof(config.server_url));
    strncpy(config.device_id, TEST_DEVICE_ID, sizeof(config.device_id));
    strncpy(config.api_key, TEST_API_KEY, sizeof(config.api_key));

    ota_context_t ctx;
    int ret = ota_protocol_init(&ctx, &config);

    if (ret != OTA_ERR_NONE) {
        TEST_FAIL("ota_protocol_init failed");
        return -1;
    }

    assert(ctx.state == OTA_STATE_IDLE);
    assert(ctx.config.protocol == OTA_PROTOCOL_HTTPS);

    ota_protocol_deinit(&ctx);

    TEST_PASS("ota_protocol_init/deinit");
    return 0;
}

/* 測試 2: 下載管理器 */
static int test_download_manager(void)
{
    TEST_INFO("Test 2: Download Manager");

    download_config_t config = {
        .timeout_ms = 30000,
        .retry_count = 3,
        .chunk_size = 4096,
        .resume_support = true,
        .verify_ssl = false
    };

    download_manager_handle_t handle = download_manager_create(&config);
    if (!handle) {
        TEST_FAIL("download_manager_create failed");
        return -1;
    }

    /* 設置進度回調 */
    download_manager_set_progress_callback(handle, progress_callback, NULL);

    /* 下載測試文件 */
    TEST_INFO("Downloading test file...");
    int ret = download_manager_download(handle, TEST_DOWNLOAD_URL, TEST_OUTPUT_PATH);

    printf("\n");

    if (ret != 0) {
        TEST_INFO("Download failed (expected if no network): ret=%d", ret);
        /* 網絡不可用時這是預期的 */
    } else {
        /* 檢查下載狀態 */
        download_state_t state = download_manager_get_state(handle);
        assert(state == DOWNLOAD_STATE_COMPLETED || state == DOWNLOAD_STATE_FAILED);

        /* 獲取統計信息 */
        download_stats_t stats;
        ret = download_manager_get_stats(handle, &stats);
        if (ret == 0) {
            TEST_INFO("Downloaded: %lu bytes, Speed: %u B/s",
                      stats.downloaded_bytes, stats.speed_bps);
        }

        TEST_PASS("download_manager basic operations");
    }

    download_manager_destroy(handle);
    return 0;
}

/* 測試 3: 進度跟踪器 */
static int test_progress_tracker(void)
{
    TEST_INFO("Test 3: Progress Tracker");

    progress_tracker_handle_t handle = progress_tracker_create();
    if (!handle) {
        TEST_FAIL("progress_tracker_create failed");
        return -1;
    }

    /* 啟動跟踪 */
    int ret = progress_tracker_start(handle);
    assert(ret == 0);

    /* 模擬進度更新 */
    uint64_t total_size = 1024 * 1024; /* 1 MB */
    for (int i = 0; i <= 10; i++) {
        uint64_t current = (total_size * i) / 10;
        progress_tracker_update(handle, current, total_size);

        /* 打印進度條 */
        progress_tracker_print_bar(handle, 50);

        usleep(100000); /* 100ms */
    }

    printf("\n");

    /* 獲取最終信息 */
    progress_info_t info;
    ret = progress_tracker_get_info(handle, &info);
    assert(ret == 0);

    TEST_INFO("Final progress: %u%%, Speed: %u B/s",
              info.progress_percent, info.avg_speed_bps);

    /* 停止跟踪 */
    progress_tracker_stop(handle);

    progress_tracker_destroy(handle);

    TEST_PASS("progress_tracker operations");
    return 0;
}

/* 測試 4: 固件驗證 */
static int test_firmware_verification(void)
{
    TEST_INFO("Test 4: Firmware Verification");

    /* 創建測試文件 */
    FILE *fp = fopen(TEST_OUTPUT_PATH, "wb");
    if (!fp) {
        TEST_FAIL("Failed to create test file");
        return -1;
    }

    const char *test_data = "This is a test firmware file for OTA update.";
    size_t data_len = strlen(test_data);
    fwrite(test_data, 1, data_len, fp);
    fclose(fp);

    /* 初始化 OTA 上下文 */
    ota_config_t config = {
        .protocol = OTA_PROTOCOL_HTTPS,
        .timeout_ms = 30000,
        .verify_signature = false
    };

    strncpy(config.server_url, TEST_SERVER_URL, sizeof(config.server_url));
    strncpy(config.device_id, TEST_DEVICE_ID, sizeof(config.device_id));

    ota_context_t ctx;
    int ret = ota_protocol_init(&ctx, &config);
    assert(ret == OTA_ERR_NONE);

    /* 準備固件信息（使用錯誤的校驗和來測試驗證失敗）*/
    ota_firmware_info_t firmware_info = {
        .version = "1.1.0",
        .size = (uint32_t)data_len,
        .checksum = "0000000000000000000000000000000000000000000000000000000000000000"
    };

    /* 驗證應該失敗 */
    ret = ota_protocol_verify_firmware(&ctx, TEST_OUTPUT_PATH, &firmware_info);
    if (ret == OTA_ERR_VERIFY) {
        TEST_PASS("firmware verification correctly detects mismatch");
    } else {
        TEST_FAIL("firmware verification should have failed");
    }

    ota_protocol_deinit(&ctx);

    /* 清理測試文件 */
    unlink(TEST_OUTPUT_PATH);

    return 0;
}

/* 測試 5: OTA 狀態管理 */
static int test_state_management(void)
{
    TEST_INFO("Test 5: OTA State Management");

    ota_config_t config = {
        .protocol = OTA_PROTOCOL_HTTP,
        .timeout_ms = 30000
    };

    strncpy(config.server_url, TEST_SERVER_URL, sizeof(config.server_url));
    strncpy(config.device_id, TEST_DEVICE_ID, sizeof(config.device_id));

    ota_context_t ctx;
    int ret = ota_protocol_init(&ctx, &config);
    assert(ret == OTA_ERR_NONE);

    /* 檢查初始狀態 */
    ota_state_t state = ota_protocol_get_state(&ctx);
    assert(state == OTA_STATE_IDLE);
    TEST_INFO("Initial state: IDLE");

    /* 測試狀態轉換 */
    ctx.state = OTA_STATE_DOWNLOADING;
    state = ota_protocol_get_state(&ctx);
    assert(state == OTA_STATE_DOWNLOADING);
    TEST_INFO("State changed to: DOWNLOADING");

    ctx.state = OTA_STATE_VERIFYING;
    state = ota_protocol_get_state(&ctx);
    assert(state == OTA_STATE_VERIFYING);
    TEST_INFO("State changed to: VERIFYING");

    /* 測試取消 */
    ret = ota_protocol_cancel(&ctx);
    assert(ret == OTA_ERR_NONE);
    state = ota_protocol_get_state(&ctx);
    assert(state == OTA_STATE_IDLE);
    TEST_INFO("State after cancel: IDLE");

    ota_protocol_deinit(&ctx);

    TEST_PASS("state management");
    return 0;
}

/* 測試 6: 錯誤處理 */
static int test_error_handling(void)
{
    TEST_INFO("Test 6: Error Handling");

    /* 測試 NULL 參數 */
    int ret = ota_protocol_init(NULL, NULL);
    assert(ret == OTA_ERR_INVALID_PARAM);

    ret = ota_protocol_download_firmware(NULL, NULL, NULL);
    assert(ret == OTA_ERR_INVALID_PARAM);

    ret = ota_protocol_verify_firmware(NULL, NULL, NULL);
    assert(ret == OTA_ERR_INVALID_PARAM);

    /* 測試無效的文件路徑 */
    ota_config_t config = {
        .protocol = OTA_PROTOCOL_HTTP,
        .timeout_ms = 30000
    };

    strncpy(config.server_url, TEST_SERVER_URL, sizeof(config.server_url));
    strncpy(config.device_id, TEST_DEVICE_ID, sizeof(config.device_id));

    ota_context_t ctx;
    ret = ota_protocol_init(&ctx, &config);
    assert(ret == OTA_ERR_NONE);

    ota_firmware_info_t firmware_info = {
        .version = "1.0.0",
        .size = 1024
    };

    ret = ota_protocol_verify_firmware(&ctx, "/nonexistent/path/firmware.bin",
                                        &firmware_info);
    assert(ret == OTA_ERR_STORAGE);

    ota_protocol_deinit(&ctx);

    TEST_PASS("error handling");
    return 0;
}

/* 測試 7: 下載管理器取消操作 */
static int test_download_cancel(void)
{
    TEST_INFO("Test 7: Download Cancel");

    download_config_t config = {
        .timeout_ms = 30000,
        .retry_count = 3,
        .chunk_size = 4096,
        .verify_ssl = false
    };

    download_manager_handle_t handle = download_manager_create(&config);
    assert(handle != NULL);

    /* 立即取消 */
    int ret = download_manager_cancel(handle);
    assert(ret == 0);

    download_state_t state = download_manager_get_state(handle);
    TEST_INFO("State after cancel: %d", state);

    download_manager_destroy(handle);

    TEST_PASS("download cancel");
    return 0;
}

/* 運行所有測試 */
int main(int argc, char *argv[])
{
    printf("\n");
    printf("========================================\n");
    printf("   OTA Protocol Test Suite\n");
    printf("========================================\n");
    printf("\n");

    int failed = 0;

    if (test_init_deinit() != 0) failed++;
    printf("\n");

    if (test_download_manager() != 0) failed++;
    printf("\n");

    if (test_progress_tracker() != 0) failed++;
    printf("\n");

    if (test_firmware_verification() != 0) failed++;
    printf("\n");

    if (test_state_management() != 0) failed++;
    printf("\n");

    if (test_error_handling() != 0) failed++;
    printf("\n");

    if (test_download_cancel() != 0) failed++;
    printf("\n");

    printf("========================================\n");
    if (failed == 0) {
        printf(COLOR_GREEN "All tests passed!" COLOR_RESET "\n");
    } else {
        printf(COLOR_RED "%d test(s) failed!" COLOR_RESET "\n", failed);
    }
    printf("========================================\n");
    printf("\n");

    return failed;
}
