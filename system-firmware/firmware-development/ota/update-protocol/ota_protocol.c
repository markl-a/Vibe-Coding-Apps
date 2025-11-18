/**
 * @file ota_protocol.c
 * @brief OTA 更新協議實現
 */

#include "ota_protocol.h"
#include "download_manager.h"
#include "progress_tracker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/stat.h>
#include <openssl/sha.h>
#include <openssl/evp.h>
#include <curl/curl.h>

/* HTTP 請求緩衝區 */
typedef struct {
    char *data;
    size_t size;
} http_response_t;

/* HTTP 響應回調 */
static size_t http_response_callback(void *contents, size_t size, size_t nmemb, void *userp)
{
    size_t realsize = size * nmemb;
    http_response_t *mem = (http_response_t *)userp;

    char *ptr = realloc(mem->data, mem->size + realsize + 1);
    if (!ptr) {
        return 0;
    }

    mem->data = ptr;
    memcpy(&(mem->data[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->data[mem->size] = 0;

    return realsize;
}

/**
 * @brief 初始化 OTA 協議
 */
int ota_protocol_init(ota_context_t *ctx, const ota_config_t *config)
{
    if (!ctx || !config) {
        return OTA_ERR_INVALID_PARAM;
    }

    memset(ctx, 0, sizeof(ota_context_t));
    memcpy(&ctx->config, config, sizeof(ota_config_t));
    ctx->state = OTA_STATE_IDLE;

    /* 初始化 CURL */
    curl_global_init(CURL_GLOBAL_DEFAULT);

    /* 初始化下載管理器 */
    download_config_t dl_config = {
        .timeout_ms = config->timeout_ms,
        .retry_count = config->retry_count,
        .chunk_size = 4096
    };

    ctx->download_handle = download_manager_create(&dl_config);
    if (!ctx->download_handle) {
        curl_global_cleanup();
        return OTA_ERR_NO_MEMORY;
    }

    printf("[OTA] Protocol initialized (type=%d)\n", config->protocol);
    return OTA_ERR_NONE;
}

/**
 * @brief 反初始化 OTA 協議
 */
void ota_protocol_deinit(ota_context_t *ctx)
{
    if (!ctx) {
        return;
    }

    if (ctx->download_handle) {
        download_manager_destroy(ctx->download_handle);
        ctx->download_handle = NULL;
    }

    curl_global_cleanup();

    ctx->state = OTA_STATE_IDLE;
    printf("[OTA] Protocol deinitialized\n");
}

/**
 * @brief 檢查固件更新
 */
int ota_protocol_check_update(ota_context_t *ctx,
                               const char *current_version,
                               ota_firmware_info_t *firmware_info)
{
    if (!ctx || !current_version || !firmware_info) {
        return OTA_ERR_INVALID_PARAM;
    }

    ctx->state = OTA_STATE_CHECKING;

    /* 構建檢查更新的 URL */
    char url[512];
    snprintf(url, sizeof(url), "%s/api/firmware/check?device_id=%s&version=%s",
             ctx->config.server_url, ctx->config.device_id, current_version);

    /* 發送 HTTP 請求 */
    CURL *curl = curl_easy_init();
    if (!curl) {
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_NETWORK;
    }

    http_response_t response = {0};
    struct curl_slist *headers = NULL;

    /* 添加 API 密鑰 */
    if (strlen(ctx->config.api_key) > 0) {
        char auth_header[256];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s",
                 ctx->config.api_key);
        headers = curl_slist_append(headers, auth_header);
    }

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, http_response_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, ctx->config.timeout_ms / 1000);

    if (ctx->config.protocol == OTA_PROTOCOL_HTTPS &&
        strlen(ctx->config.cert_path) > 0) {
        curl_easy_setopt(curl, CURLOPT_CAINFO, ctx->config.cert_path);
    }

    CURLcode res = curl_easy_perform(curl);

    if (headers) {
        curl_slist_free_all(headers);
    }
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        if (response.data) {
            free(response.data);
        }
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_NETWORK;
    }

    /* 解析響應（簡化版本，實際應該使用 JSON 解析器）*/
    if (response.data && strstr(response.data, "\"update_available\":true")) {
        /* 解析固件信息 */
        sscanf(response.data,
               "{\"version\":\"%31[^\"]\",\"size\":%u,\"url\":\"%255[^\"]\","
               "\"checksum\":\"%63[^\"]\"}",
               firmware_info->version, &firmware_info->size,
               firmware_info->url, firmware_info->checksum);

        memcpy(&ctx->firmware_info, firmware_info, sizeof(ota_firmware_info_t));

        if (response.data) {
            free(response.data);
        }

        ctx->state = OTA_STATE_IDLE;
        printf("[OTA] New firmware available: %s\n", firmware_info->version);
        return 0; /* 有更新 */
    }

    if (response.data) {
        free(response.data);
    }

    ctx->state = OTA_STATE_IDLE;
    printf("[OTA] No update available\n");
    return 1; /* 無更新 */
}

/**
 * @brief 計算文件 SHA256
 */
static int calculate_sha256(const char *file_path, char *output_hex)
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

    unsigned char hash[SHA256_DIGEST_LENGTH];
    unsigned char buffer[8192];
    size_t bytes;

    EVP_DigestInit_ex(mdctx, EVP_sha256(), NULL);

    while ((bytes = fread(buffer, 1, sizeof(buffer), fp)) > 0) {
        EVP_DigestUpdate(mdctx, buffer, bytes);
    }

    EVP_DigestFinal_ex(mdctx, hash, NULL);
    EVP_MD_CTX_free(mdctx);
    fclose(fp);

    /* 轉換為十六進制字符串 */
    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        sprintf(output_hex + (i * 2), "%02x", hash[i]);
    }
    output_hex[SHA256_DIGEST_LENGTH * 2] = '\0';

    return 0;
}

/**
 * @brief 下載固件
 */
int ota_protocol_download_firmware(ota_context_t *ctx,
                                    const ota_firmware_info_t *firmware_info,
                                    const char *output_path)
{
    if (!ctx || !firmware_info || !output_path) {
        return OTA_ERR_INVALID_PARAM;
    }

    ctx->state = OTA_STATE_DOWNLOADING;

    printf("[OTA] Downloading firmware from: %s\n", firmware_info->url);
    printf("[OTA] Output path: %s\n", output_path);

    /* 使用下載管理器下載 */
    int ret = download_manager_download(ctx->download_handle,
                                        firmware_info->url,
                                        output_path);

    if (ret != 0) {
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_DOWNLOAD;
    }

    printf("[OTA] Firmware downloaded successfully\n");
    ctx->state = OTA_STATE_IDLE;
    return OTA_ERR_NONE;
}

/**
 * @brief 驗證固件
 */
int ota_protocol_verify_firmware(ota_context_t *ctx,
                                  const char *firmware_path,
                                  const ota_firmware_info_t *firmware_info)
{
    if (!ctx || !firmware_path || !firmware_info) {
        return OTA_ERR_INVALID_PARAM;
    }

    ctx->state = OTA_STATE_VERIFYING;

    printf("[OTA] Verifying firmware: %s\n", firmware_path);

    /* 檢查文件是否存在 */
    struct stat st;
    if (stat(firmware_path, &st) != 0) {
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_STORAGE;
    }

    /* 驗證文件大小 */
    if ((uint32_t)st.st_size != firmware_info->size) {
        printf("[OTA] Size mismatch: expected=%u, actual=%ld\n",
               firmware_info->size, st.st_size);
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_VERIFY;
    }

    /* 計算並驗證校驗和 */
    char calculated_checksum[65];
    if (calculate_sha256(firmware_path, calculated_checksum) != 0) {
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_VERIFY;
    }

    if (strcasecmp(calculated_checksum, firmware_info->checksum) != 0) {
        printf("[OTA] Checksum mismatch:\n");
        printf("  Expected: %s\n", firmware_info->checksum);
        printf("  Calculated: %s\n", calculated_checksum);
        ctx->state = OTA_STATE_FAILED;
        return OTA_ERR_VERIFY;
    }

    printf("[OTA] Firmware verification successful\n");
    ctx->state = OTA_STATE_IDLE;
    return OTA_ERR_NONE;
}

/**
 * @brief 執行 OTA 更新
 */
int ota_protocol_perform_update(ota_context_t *ctx, const char *firmware_path)
{
    if (!ctx || !firmware_path) {
        return OTA_ERR_INVALID_PARAM;
    }

    ctx->state = OTA_STATE_UPDATING;

    printf("[OTA] Performing firmware update...\n");

    /* 這裡應該調用實際的固件更新邏輯 */
    /* 例如：將固件寫入 flash、更新分區等 */

    /* 模擬更新過程 */
    sleep(2);

    ctx->state = OTA_STATE_SUCCESS;
    printf("[OTA] Firmware update completed successfully\n");

    return OTA_ERR_NONE;
}

/**
 * @brief 報告更新狀態
 */
int ota_protocol_report_status(ota_context_t *ctx,
                                ota_state_t state,
                                ota_error_t error_code)
{
    if (!ctx) {
        return OTA_ERR_INVALID_PARAM;
    }

    char url[512];
    snprintf(url, sizeof(url), "%s/api/firmware/status?device_id=%s",
             ctx->config.server_url, ctx->config.device_id);

    CURL *curl = curl_easy_init();
    if (!curl) {
        return OTA_ERR_NETWORK;
    }

    /* 構建 POST 數據 */
    char post_data[256];
    snprintf(post_data, sizeof(post_data),
             "{\"state\":%d,\"error_code\":%d,\"version\":\"%s\"}",
             state, error_code, ctx->firmware_info.version);

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, ctx->config.timeout_ms / 1000);

    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        return OTA_ERR_NETWORK;
    }

    printf("[OTA] Status reported: state=%d, error=%d\n", state, error_code);
    return OTA_ERR_NONE;
}

/**
 * @brief 註冊事件回調
 */
void ota_protocol_register_callback(ota_context_t *ctx,
                                     ota_event_callback_t callback,
                                     void *user_data)
{
    if (!ctx) {
        return;
    }

    ctx->user_data = user_data;
    /* 實際實現中應該保存回調函數指針 */
}

/**
 * @brief 獲取當前狀態
 */
ota_state_t ota_protocol_get_state(const ota_context_t *ctx)
{
    if (!ctx) {
        return OTA_STATE_IDLE;
    }

    return ctx->state;
}

/**
 * @brief 取消 OTA 更新
 */
int ota_protocol_cancel(ota_context_t *ctx)
{
    if (!ctx) {
        return OTA_ERR_INVALID_PARAM;
    }

    if (ctx->download_handle) {
        download_manager_cancel(ctx->download_handle);
    }

    ctx->state = OTA_STATE_IDLE;
    printf("[OTA] Update cancelled\n");

    return OTA_ERR_NONE;
}
