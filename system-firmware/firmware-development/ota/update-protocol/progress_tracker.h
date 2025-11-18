/**
 * @file progress_tracker.h
 * @brief 進度跟踪器接口
 * @details 跟踪下載進度、計算速度和預計剩餘時間
 */

#ifndef PROGRESS_TRACKER_H
#define PROGRESS_TRACKER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* 進度信息 */
typedef struct {
    uint64_t total_bytes;       /* 總字節數 */
    uint64_t current_bytes;     /* 當前字節數 */
    uint32_t speed_bps;         /* 速度 (bytes/sec) */
    uint32_t avg_speed_bps;     /* 平均速度 (bytes/sec) */
    uint32_t elapsed_ms;        /* 已用時間 (ms) */
    uint32_t eta_ms;            /* 預計剩餘時間 (ms) */
    uint8_t progress_percent;   /* 進度百分比 */
} progress_info_t;

/* 進度跟踪器句柄 */
typedef void* progress_tracker_handle_t;

/**
 * @brief 創建進度跟踪器
 * @return 進度跟踪器句柄
 */
progress_tracker_handle_t progress_tracker_create(void);

/**
 * @brief 銷毀進度跟踪器
 * @param handle 進度跟踪器句柄
 */
void progress_tracker_destroy(progress_tracker_handle_t handle);

/**
 * @brief 啟動跟踪
 * @param handle 進度跟踪器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int progress_tracker_start(progress_tracker_handle_t handle);

/**
 * @brief 停止跟踪
 * @param handle 進度跟踪器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int progress_tracker_stop(progress_tracker_handle_t handle);

/**
 * @brief 更新進度
 * @param handle 進度跟踪器句柄
 * @param current_bytes 當前字節數
 * @param total_bytes 總字節數
 * @return 0: 成功, <0: 錯誤碼
 */
int progress_tracker_update(progress_tracker_handle_t handle,
                             uint64_t current_bytes,
                             uint64_t total_bytes);

/**
 * @brief 獲取進度信息
 * @param handle 進度跟踪器句柄
 * @param info 進度信息輸出
 * @return 0: 成功, <0: 錯誤碼
 */
int progress_tracker_get_info(progress_tracker_handle_t handle,
                               progress_info_t *info);

/**
 * @brief 重置跟踪器
 * @param handle 進度跟踪器句柄
 * @return 0: 成功, <0: 錯誤碼
 */
int progress_tracker_reset(progress_tracker_handle_t handle);

/**
 * @brief 打印進度條
 * @param handle 進度跟踪器句柄
 * @param bar_width 進度條寬度
 */
void progress_tracker_print_bar(progress_tracker_handle_t handle, int bar_width);

#ifdef __cplusplus
}
#endif

#endif /* PROGRESS_TRACKER_H */
