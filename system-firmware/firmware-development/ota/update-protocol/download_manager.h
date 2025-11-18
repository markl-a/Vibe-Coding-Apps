/**
 * @file download_manager.h
 * @brief 下載管理器接口
 * @details 支持斷點續傳、進度跟踪、錯誤重試
 */

#ifndef DOWNLOAD_MANAGER_H
#define DOWNLOAD_MANAGER_H

#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 下載狀態 */
typedef enum {
    DOWNLOAD_STATE_IDLE = 0,
    DOWNLOAD_STATE_CONNECTING,
    DOWNLOAD_STATE_DOWNLOADING,
    DOWNLOAD_STATE_PAUSED,
    DOWNLOAD_STATE_COMPLETED,
    DOWNLOAD_STATE_FAILED,
    DOWNLOAD_STATE_CANCELLED
} download_state_t;

/* 下載配置 */
typedef struct {
    uint32_t timeout_ms;        /* 超時時間 */
    uint32_t retry_count;       /* 重試次數 */
    uint32_t chunk_size;        /* 分塊大小 */
    bool resume_support;        /* 支持斷點續傳 */
    bool verify_ssl;            /* 驗證 SSL 證書 */
} download_config_t;

/* 下載統計 */
typedef struct {
    uint64_t total_bytes;       /* 總字節數 */
    uint64_t downloaded_bytes;  /* 已下載字節數 */
    uint32_t speed_bps;         /* 下載速度 (bytes/sec) */
    uint32_t elapsed_time_ms;   /* 已用時間 (ms) */
    uint32_t remaining_time_ms; /* 剩餘時間 (ms) */
    uint8_t progress_percent;   /* 進度百分比 */
} download_stats_t;

/* 下載進度回調 */
typedef void (*download_progress_callback_t)(
    uint64_t downloaded,
    uint64_t total,
    void *user_data
);

/* 下載管理器句柄 */
typedef void* download_manager_handle_t;

/**
 * @brief 創建下載管理器
 * @param config 配置參數
 * @return 下載管理器句柄
 */
download_manager_handle_t download_manager_create(const download_config_t *config);

/**
 * @brief 銷毀下載管理器
 * @param handle 下載管理器句柄
 */
void download_manager_destroy(download_manager_handle_t handle);

/**
 * @brief 下載文件
 * @param handle 下載管理器句柄
 * @param url 下載 URL
 * @param output_path 輸出文件路徑
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_download(download_manager_handle_t handle,
                               const char *url,
                               const char *output_path);

/**
 * @brief 下載文件（異步）
 * @param handle 下載管理器句柄
 * @param url 下載 URL
 * @param output_path 輸出文件路徑
 * @param callback 進度回調
 * @param user_data 用戶數據
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_download_async(download_manager_handle_t handle,
                                     const char *url,
                                     const char *output_path,
                                     download_progress_callback_t callback,
                                     void *user_data);

/**
 * @brief 暫停下載
 * @param handle 下載管理器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_pause(download_manager_handle_t handle);

/**
 * @brief 恢復下載
 * @param handle 下載管理器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_resume(download_manager_handle_t handle);

/**
 * @brief 取消下載
 * @param handle 下載管理器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_cancel(download_manager_handle_t handle);

/**
 * @brief 獲取下載狀態
 * @param handle 下載管理器句柄
 * @return 下載狀態
 */
download_state_t download_manager_get_state(download_manager_handle_t handle);

/**
 * @brief 獲取下載統計
 * @param handle 下載管理器句柄
 * @param stats 統計信息輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int download_manager_get_stats(download_manager_handle_t handle,
                                download_stats_t *stats);

/**
 * @brief 設置進度回調
 * @param handle 下載管理器句柄
 * @param callback 回調函數
 * @param user_data 用戶數據
 */
void download_manager_set_progress_callback(download_manager_handle_t handle,
                                             download_progress_callback_t callback,
                                             void *user_data);

#ifdef __cplusplus
}
#endif

#endif /* DOWNLOAD_MANAGER_H */
