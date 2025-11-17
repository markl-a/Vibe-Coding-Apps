/**
 * @file ota_http_update.c
 * @brief HTTP OTA 更新範例
 * @description 展示如何通過 HTTP 協議進行韌體 OTA 更新
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>

// ============================================================================
// OTA 配置
// ============================================================================

#define OTA_SERVER_URL      "https://firmware.example.com"
#define OTA_CHECK_ENDPOINT  "/api/v1/firmware/check"
#define OTA_DOWNLOAD_PATH   "/firmware/device_"

#define CURRENT_FW_VERSION  "1.0.0"
#define DEVICE_ID          "ESP32_DEV_001"
#define HARDWARE_VERSION   "v2.0"

// Flash 分區配置
#define PARTITION_A_ADDR    0x00010000
#define PARTITION_B_ADDR    0x00110000
#define PARTITION_SIZE      (1024 * 1024)  // 1MB
#define BOOT_FLAG_ADDR      0x00009000

// ============================================================================
// OTA 數據結構
// ============================================================================

typedef struct {
    char device_id[32];
    char current_version[16];
    char hardware_version[16];
    uint32_t current_timestamp;
} ota_check_request_t;

typedef struct {
    bool update_available;
    char new_version[16];
    char download_url[256];
    uint32_t firmware_size;
    uint8_t sha256[32];
    char release_notes[512];
    bool force_update;
} ota_check_response_t;

typedef enum {
    OTA_STATE_IDLE = 0,
    OTA_STATE_CHECKING,
    OTA_STATE_DOWNLOADING,
    OTA_STATE_VERIFYING,
    OTA_STATE_INSTALLING,
    OTA_STATE_COMPLETE,
    OTA_STATE_ERROR
} ota_state_t;

typedef struct {
    ota_state_t state;
    uint32_t total_size;
    uint32_t downloaded_size;
    uint8_t progress_percent;
    char error_message[128];
} ota_status_t;

static ota_status_t ota_status = {
    .state = OTA_STATE_IDLE,
    .progress_percent = 0
};

// ============================================================================
// HTTP 客戶端模擬
// ============================================================================

typedef void (*http_data_callback_t)(const uint8_t *data, uint32_t len, void *user_data);

typedef struct {
    int status_code;
    uint32_t content_length;
    char content_type[64];
    uint8_t *body;
    uint32_t body_len;
} http_response_t;

int http_get(const char *url, http_response_t *response) {
    printf("[HTTP] GET %s\n", url);

    // 模擬 HTTP 請求
    response->status_code = 200;
    response->content_length = 1024;
    strcpy(response->content_type, "application/json");

    // 模擬響應數據
    const char *mock_response =
        "{"
        "  \"update_available\": true,"
        "  \"version\": \"1.1.0\","
        "  \"url\": \"https://firmware.example.com/fw_v1.1.0.bin\","
        "  \"size\": 524288,"
        "  \"sha256\": \"abc123...\","
        "  \"release_notes\": \"Bug fixes and new features\""
        "}";

    response->body_len = strlen(mock_response);
    response->body = (uint8_t *)malloc(response->body_len + 1);
    memcpy(response->body, mock_response, response->body_len);
    response->body[response->body_len] = '\0';

    return 0;
}

int http_download(const char *url, http_data_callback_t callback, void *user_data) {
    printf("[HTTP] Downloading %s\n", url);

    // 模擬下載過程
    uint32_t total_size = 524288; // 512KB
    uint32_t chunk_size = 4096;   // 4KB chunks

    for (uint32_t offset = 0; offset < total_size; offset += chunk_size) {
        uint32_t remaining = total_size - offset;
        uint32_t current_chunk = (remaining < chunk_size) ? remaining : chunk_size;

        // 模擬數據塊
        uint8_t *chunk_data = (uint8_t *)malloc(current_chunk);
        memset(chunk_data, 0xFF, current_chunk); // 填充模擬數據

        // 調用回調函數
        if (callback) {
            callback(chunk_data, current_chunk, user_data);
        }

        free(chunk_data);

        // 模擬網絡延遲
        // delay_ms(10);
    }

    return 0;
}

// ============================================================================
// JSON 解析 (簡化版)
// ============================================================================

bool json_parse_check_response(const char *json, ota_check_response_t *response) {
    // 簡化的 JSON 解析 (實際應使用 cJSON 或其他庫)
    printf("[JSON] 解析更新檢查響應\n");

    // 模擬解析結果
    response->update_available = true;
    strcpy(response->new_version, "1.1.0");
    strcpy(response->download_url, "https://firmware.example.com/fw_v1.1.0.bin");
    response->firmware_size = 524288;
    strcpy(response->release_notes, "Bug fixes and performance improvements");
    response->force_update = false;

    return true;
}

// ============================================================================
// Flash 操作
// ============================================================================

int flash_erase_partition(uint32_t address, uint32_t size) {
    printf("[FLASH] 擦除分區 @ 0x%08X, Size: %u bytes\n", address, size);
    // 實際會調用 Flash 驅動程序
    return 0;
}

int flash_write_chunk(uint32_t address, const uint8_t *data, uint32_t size) {
    static uint32_t write_count = 0;
    write_count++;

    if (write_count % 32 == 0) {
        printf("[FLASH] 寫入進度 @ 0x%08X, %u bytes\n", address, size);
    }

    // 實際會調用 Flash 寫入
    return 0;
}

int flash_read(uint32_t address, uint8_t *buffer, uint32_t size) {
    // 實際會從 Flash 讀取數據
    memset(buffer, 0xFF, size);
    return 0;
}

// ============================================================================
// SHA-256 驗證
// ============================================================================

void sha256_compute(const uint8_t *data, uint32_t len, uint8_t *hash) {
    // 實際會使用 mbedtls 或其他加密庫
    printf("[CRYPTO] 計算 SHA-256 哈希 (%u bytes)\n", len);
    memset(hash, 0xAB, 32); // 模擬哈希值
}

bool sha256_verify(const uint8_t *calculated, const uint8_t *expected) {
    printf("[CRYPTO] 驗證 SHA-256 哈希\n");
    // 實際會比較哈希值
    return true; // 模擬驗證成功
}

// ============================================================================
// OTA 更新流程
// ============================================================================

int ota_check_for_updates(ota_check_response_t *response) {
    printf("\n[OTA] 檢查更新...\n");
    ota_status.state = OTA_STATE_CHECKING;

    // 構建請求
    ota_check_request_t request;
    strcpy(request.device_id, DEVICE_ID);
    strcpy(request.current_version, CURRENT_FW_VERSION);
    strcpy(request.hardware_version, HARDWARE_VERSION);
    request.current_timestamp = 1700000000;

    printf("  Device ID: %s\n", request.device_id);
    printf("  Current Version: %s\n", request.current_version);
    printf("  Hardware: %s\n", request.hardware_version);

    // 發送 HTTP 請求
    char url[256];
    snprintf(url, sizeof(url), "%s%s?device_id=%s&version=%s",
             OTA_SERVER_URL, OTA_CHECK_ENDPOINT,
             request.device_id, request.current_version);

    http_response_t http_resp;
    if (http_get(url, &http_resp) != 0) {
        strcpy(ota_status.error_message, "HTTP 請求失敗");
        ota_status.state = OTA_STATE_ERROR;
        return -1;
    }

    // 解析響應
    if (!json_parse_check_response((char *)http_resp.body, response)) {
        strcpy(ota_status.error_message, "JSON 解析失敗");
        ota_status.state = OTA_STATE_ERROR;
        free(http_resp.body);
        return -1;
    }

    free(http_resp.body);

    if (response->update_available) {
        printf("\n[OTA] 發現新版本！\n");
        printf("  新版本: %s\n", response->new_version);
        printf("  當前版本: %s\n", CURRENT_FW_VERSION);
        printf("  大小: %u bytes\n", response->firmware_size);
        printf("  更新說明: %s\n", response->release_notes);
    } else {
        printf("[OTA] 已是最新版本\n");
    }

    return 0;
}

typedef struct {
    uint32_t partition_address;
    uint32_t offset;
    uint32_t total_size;
    uint8_t sha256_ctx[128]; // SHA256 上下文
} download_context_t;

void download_callback(const uint8_t *data, uint32_t len, void *user_data) {
    download_context_t *ctx = (download_context_t *)user_data;

    // 寫入 Flash
    flash_write_chunk(ctx->partition_address + ctx->offset, data, len);

    // 更新 SHA-256
    // sha256_update(&ctx->sha256_ctx, data, len);

    // 更新進度
    ctx->offset += len;
    ota_status.downloaded_size = ctx->offset;
    ota_status.progress_percent = (ctx->offset * 100) / ctx->total_size;

    if (ctx->offset % 32768 == 0 || ctx->offset == ctx->total_size) {
        printf("[OTA] 下載進度: %u%% (%u / %u bytes)\n",
               ota_status.progress_percent,
               ctx->offset,
               ctx->total_size);
    }
}

int ota_download_and_install(const ota_check_response_t *update_info) {
    printf("\n[OTA] 開始下載韌體...\n");
    ota_status.state = OTA_STATE_DOWNLOADING;
    ota_status.total_size = update_info->firmware_size;
    ota_status.downloaded_size = 0;

    // 確定目標分區 (使用非活動分區)
    uint32_t target_partition = PARTITION_B_ADDR; // 簡化，實際會檢查活動分區

    printf("[OTA] 目標分區: 0x%08X\n", target_partition);

    // 擦除目標分區
    printf("[OTA] 擦除目標分區...\n");
    if (flash_erase_partition(target_partition, update_info->firmware_size) != 0) {
        strcpy(ota_status.error_message, "Flash 擦除失敗");
        ota_status.state = OTA_STATE_ERROR;
        return -1;
    }

    // 下載並寫入
    download_context_t dl_ctx = {
        .partition_address = target_partition,
        .offset = 0,
        .total_size = update_info->firmware_size
    };

    printf("[OTA] 開始下載並寫入...\n");
    if (http_download(update_info->download_url, download_callback, &dl_ctx) != 0) {
        strcpy(ota_status.error_message, "下載失敗");
        ota_status.state = OTA_STATE_ERROR;
        return -1;
    }

    printf("[OTA] 下載完成！\n");

    // 驗證韌體
    printf("[OTA] 驗證韌體完整性...\n");
    ota_status.state = OTA_STATE_VERIFYING;

    uint8_t calculated_hash[32];
    uint8_t *firmware_buffer = (uint8_t *)malloc(update_info->firmware_size);
    flash_read(target_partition, firmware_buffer, update_info->firmware_size);
    sha256_compute(firmware_buffer, update_info->firmware_size, calculated_hash);
    free(firmware_buffer);

    if (!sha256_verify(calculated_hash, update_info->sha256)) {
        strcpy(ota_status.error_message, "韌體驗證失敗");
        ota_status.state = OTA_STATE_ERROR;
        return -1;
    }

    printf("[OTA] 韌體驗證成功！\n");

    // 更新啟動標誌
    printf("[OTA] 更新啟動標誌...\n");
    ota_status.state = OTA_STATE_INSTALLING;

    uint32_t boot_flag = 0x01; // 切換到分區 B
    flash_write_chunk(BOOT_FLAG_ADDR, (uint8_t *)&boot_flag, 4);

    ota_status.state = OTA_STATE_COMPLETE;
    printf("[OTA] OTA 更新完成！\n");

    return 0;
}

void ota_reboot_to_new_firmware(void) {
    printf("\n[OTA] 3 秒後重啟到新韌體...\n");

    for (int i = 3; i > 0; i--) {
        printf("  %d...\n", i);
        // delay_ms(1000);
    }

    printf("[SYSTEM] 重啟中...\n");
    // NVIC_SystemReset(); // 實際會調用系統重啟
}

// ============================================================================
// 主程式
// ============================================================================

int main(void) {
    printf("\n");
    printf("========================================\n");
    printf("  HTTP OTA 更新範例\n");
    printf("  當前版本: %s\n", CURRENT_FW_VERSION);
    printf("  設備 ID: %s\n", DEVICE_ID);
    printf("========================================\n");

    // 檢查更新
    ota_check_response_t update_info;
    if (ota_check_for_updates(&update_info) != 0) {
        printf("[ERROR] 檢查更新失敗: %s\n", ota_status.error_message);
        return -1;
    }

    // 如果有更新，執行下載和安裝
    if (update_info.update_available) {
        printf("\n是否進行更新？(模擬自動確認)\n");

        if (ota_download_and_install(&update_info) != 0) {
            printf("[ERROR] OTA 更新失敗: %s\n", ota_status.error_message);
            return -1;
        }

        // 重啟到新韌體
        ota_reboot_to_new_firmware();
    }

    printf("\n[DEMO] OTA 範例完成\n");
    return 0;
}
