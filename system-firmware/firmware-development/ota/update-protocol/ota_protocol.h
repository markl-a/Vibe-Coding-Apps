/**
 * @file ota_protocol.h
 * @brief OTA 更新協議接口定義
 * @details 支持 HTTP/HTTPS/MQTT 等多種協議進行固件更新
 */

#ifndef OTA_PROTOCOL_H
#define OTA_PROTOCOL_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 協議類型 */
typedef enum {
    OTA_PROTOCOL_HTTP = 0,
    OTA_PROTOCOL_HTTPS,
    OTA_PROTOCOL_MQTT,
    OTA_PROTOCOL_COAP,
    OTA_PROTOCOL_MAX
} ota_protocol_type_t;

/* OTA 狀態 */
typedef enum {
    OTA_STATE_IDLE = 0,
    OTA_STATE_CHECKING,
    OTA_STATE_DOWNLOADING,
    OTA_STATE_VERIFYING,
    OTA_STATE_UPDATING,
    OTA_STATE_SUCCESS,
    OTA_STATE_FAILED,
    OTA_STATE_ROLLBACK
} ota_state_t;

/* 錯誤碼 */
typedef enum {
    OTA_ERR_NONE = 0,
    OTA_ERR_INVALID_PARAM = -1,
    OTA_ERR_NETWORK = -2,
    OTA_ERR_DOWNLOAD = -3,
    OTA_ERR_VERIFY = -4,
    OTA_ERR_STORAGE = -5,
    OTA_ERR_NO_MEMORY = -6,
    OTA_ERR_TIMEOUT = -7,
    OTA_ERR_PROTOCOL = -8,
    OTA_ERR_VERSION = -9,
    OTA_ERR_SIGNATURE = -10
} ota_error_t;

/* 固件信息 */
typedef struct {
    char version[32];           /* 版本號 */
    uint32_t size;              /* 固件大小 */
    char url[256];              /* 下載 URL */
    char checksum[64];          /* SHA256 校驗和 */
    char signature[256];        /* 數字簽名 */
    uint32_t timestamp;         /* 發布時間戳 */
    char description[128];      /* 更新描述 */
} ota_firmware_info_t;

/* OTA 配置 */
typedef struct {
    ota_protocol_type_t protocol;   /* 協議類型 */
    char server_url[256];            /* 服務器地址 */
    uint16_t server_port;            /* 服務器端口 */
    char device_id[64];              /* 設備 ID */
    char api_key[128];               /* API 密鑰 */
    uint32_t timeout_ms;             /* 超時時間 */
    uint32_t retry_count;            /* 重試次數 */
    bool auto_update;                /* 自動更新 */
    bool verify_signature;           /* 驗證簽名 */
    char cert_path[256];             /* 證書路徑 */
} ota_config_t;

/* OTA 上下文 */
typedef struct ota_context {
    ota_config_t config;
    ota_state_t state;
    ota_firmware_info_t firmware_info;
    void *protocol_handle;
    void *download_handle;
    void *user_data;
} ota_context_t;

/* 事件回調類型 */
typedef void (*ota_event_callback_t)(ota_context_t *ctx, ota_state_t state, void *user_data);

/**
 * @brief 初始化 OTA 協議
 * @param ctx OTA 上下文
 * @param config OTA 配置
 * @return 0: 成功, <0: 錯誤碼
 */
int ota_protocol_init(ota_context_t *ctx, const ota_config_t *config);

/**
 * @brief 反初始化 OTA 協議
 * @param ctx OTA 上下文
 */
void ota_protocol_deinit(ota_context_t *ctx);

/**
 * @brief 檢查固件更新
 * @param ctx OTA 上下文
 * @param current_version 當前固件版本
 * @param firmware_info 固件信息輸出
 * @return 0: 有更新, 1: 無更新, <0: 錯誤碼
 */
int ota_protocol_check_update(ota_context_t *ctx,
                               const char *current_version,
                               ota_firmware_info_t *firmware_info);

/**
 * @brief 下載固件
 * @param ctx OTA 上下文
 * @param firmware_info 固件信息
 * @param output_path 輸出路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int ota_protocol_download_firmware(ota_context_t *ctx,
                                    const ota_firmware_info_t *firmware_info,
                                    const char *output_path);

/**
 * @brief 驗證固件
 * @param ctx OTA 上下文
 * @param firmware_path 固件路徑
 * @param firmware_info 固件信息
 * @return 0: 驗證成功, <0: 錯誤碼
 */
int ota_protocol_verify_firmware(ota_context_t *ctx,
                                  const char *firmware_path,
                                  const ota_firmware_info_t *firmware_info);

/**
 * @brief 執行 OTA 更新
 * @param ctx OTA 上下文
 * @param firmware_path 固件路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int ota_protocol_perform_update(ota_context_t *ctx, const char *firmware_path);

/**
 * @brief 報告更新狀態
 * @param ctx OTA 上下文
 * @param state 更新狀態
 * @param error_code 錯誤碼
 * @return 0: 成功, <0: 錯誤碼
 */
int ota_protocol_report_status(ota_context_t *ctx,
                                ota_state_t state,
                                ota_error_t error_code);

/**
 * @brief 註冊事件回調
 * @param ctx OTA 上下文
 * @param callback 回調函數
 * @param user_data 用戶數據
 */
void ota_protocol_register_callback(ota_context_t *ctx,
                                     ota_event_callback_t callback,
                                     void *user_data);

/**
 * @brief 獲取當前狀態
 * @param ctx OTA 上下文
 * @return OTA 狀態
 */
ota_state_t ota_protocol_get_state(const ota_context_t *ctx);

/**
 * @brief 取消 OTA 更新
 * @param ctx OTA 上下文
 * @return 0: 成功, <0: 錯誤碼
 */
int ota_protocol_cancel(ota_context_t *ctx);

#ifdef __cplusplus
}
#endif

#endif /* OTA_PROTOCOL_H */
