/**
 * @file progress_tracker.c
 * @brief 進度跟踪器實現
 */

#include "progress_tracker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/time.h>
#include <pthread.h>

#define SPEED_SAMPLE_SIZE 10

/* 速度採樣 */
typedef struct {
    uint64_t timestamp_ms;
    uint64_t bytes;
} speed_sample_t;

/* 進度跟踪器內部結構 */
typedef struct {
    progress_info_t info;

    uint64_t start_time_ms;
    uint64_t last_update_ms;

    speed_sample_t samples[SPEED_SAMPLE_SIZE];
    int sample_index;
    int sample_count;

    bool is_running;
    pthread_mutex_t mutex;
} progress_tracker_t;

/* 獲取當前時間戳(毫秒) */
static uint64_t get_timestamp_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)tv.tv_sec * 1000 + tv.tv_usec / 1000;
}

/* 計算平均速度 */
static uint32_t calculate_average_speed(progress_tracker_t *tracker)
{
    if (tracker->sample_count < 2) {
        return 0;
    }

    int oldest_idx = (tracker->sample_index - tracker->sample_count + SPEED_SAMPLE_SIZE)
                     % SPEED_SAMPLE_SIZE;
    int newest_idx = (tracker->sample_index - 1 + SPEED_SAMPLE_SIZE) % SPEED_SAMPLE_SIZE;

    uint64_t time_diff = tracker->samples[newest_idx].timestamp_ms -
                         tracker->samples[oldest_idx].timestamp_ms;
    uint64_t bytes_diff = tracker->samples[newest_idx].bytes -
                          tracker->samples[oldest_idx].bytes;

    if (time_diff == 0) {
        return 0;
    }

    return (uint32_t)((bytes_diff * 1000) / time_diff);
}

/**
 * @brief 創建進度跟踪器
 */
progress_tracker_handle_t progress_tracker_create(void)
{
    progress_tracker_t *tracker = (progress_tracker_t *)calloc(1, sizeof(progress_tracker_t));
    if (!tracker) {
        return NULL;
    }

    pthread_mutex_init(&tracker->mutex, NULL);

    return (progress_tracker_handle_t)tracker;
}

/**
 * @brief 銷毀進度跟踪器
 */
void progress_tracker_destroy(progress_tracker_handle_t handle)
{
    if (!handle) {
        return;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_destroy(&tracker->mutex);
    free(tracker);
}

/**
 * @brief 啟動跟踪
 */
int progress_tracker_start(progress_tracker_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);

    memset(&tracker->info, 0, sizeof(progress_info_t));
    tracker->start_time_ms = get_timestamp_ms();
    tracker->last_update_ms = tracker->start_time_ms;
    tracker->sample_index = 0;
    tracker->sample_count = 0;
    tracker->is_running = true;

    pthread_mutex_unlock(&tracker->mutex);

    return 0;
}

/**
 * @brief 停止跟踪
 */
int progress_tracker_stop(progress_tracker_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);
    tracker->is_running = false;
    pthread_mutex_unlock(&tracker->mutex);

    return 0;
}

/**
 * @brief 更新進度
 */
int progress_tracker_update(progress_tracker_handle_t handle,
                             uint64_t current_bytes,
                             uint64_t total_bytes)
{
    if (!handle) {
        return -1;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);

    if (!tracker->is_running) {
        pthread_mutex_unlock(&tracker->mutex);
        return -2;
    }

    uint64_t now = get_timestamp_ms();

    /* 更新基本信息 */
    tracker->info.current_bytes = current_bytes;
    tracker->info.total_bytes = total_bytes;
    tracker->info.elapsed_ms = (uint32_t)(now - tracker->start_time_ms);

    if (total_bytes > 0) {
        tracker->info.progress_percent = (uint8_t)((current_bytes * 100) / total_bytes);
    }

    /* 添加速度採樣 */
    tracker->samples[tracker->sample_index].timestamp_ms = now;
    tracker->samples[tracker->sample_index].bytes = current_bytes;
    tracker->sample_index = (tracker->sample_index + 1) % SPEED_SAMPLE_SIZE;
    if (tracker->sample_count < SPEED_SAMPLE_SIZE) {
        tracker->sample_count++;
    }

    /* 計算即時速度 */
    uint64_t time_diff = now - tracker->last_update_ms;
    if (time_diff > 0) {
        uint64_t bytes_diff = current_bytes -
            tracker->samples[(tracker->sample_index - 2 + SPEED_SAMPLE_SIZE) % SPEED_SAMPLE_SIZE].bytes;
        tracker->info.speed_bps = (uint32_t)((bytes_diff * 1000) / time_diff);
    }

    /* 計算平均速度 */
    tracker->info.avg_speed_bps = calculate_average_speed(tracker);

    /* 計算預計剩餘時間 */
    if (tracker->info.avg_speed_bps > 0 && total_bytes > current_bytes) {
        uint64_t remaining_bytes = total_bytes - current_bytes;
        tracker->info.eta_ms = (uint32_t)((remaining_bytes * 1000) / tracker->info.avg_speed_bps);
    } else {
        tracker->info.eta_ms = 0;
    }

    tracker->last_update_ms = now;

    pthread_mutex_unlock(&tracker->mutex);

    return 0;
}

/**
 * @brief 獲取進度信息
 */
int progress_tracker_get_info(progress_tracker_handle_t handle,
                               progress_info_t *info)
{
    if (!handle || !info) {
        return -1;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);
    memcpy(info, &tracker->info, sizeof(progress_info_t));
    pthread_mutex_unlock(&tracker->mutex);

    return 0;
}

/**
 * @brief 重置跟踪器
 */
int progress_tracker_reset(progress_tracker_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);

    memset(&tracker->info, 0, sizeof(progress_info_t));
    tracker->sample_index = 0;
    tracker->sample_count = 0;
    tracker->is_running = false;

    pthread_mutex_unlock(&tracker->mutex);

    return 0;
}

/**
 * @brief 打印進度條
 */
void progress_tracker_print_bar(progress_tracker_handle_t handle, int bar_width)
{
    if (!handle) {
        return;
    }

    progress_tracker_t *tracker = (progress_tracker_t *)handle;

    pthread_mutex_lock(&tracker->mutex);

    progress_info_t info = tracker->info;

    pthread_mutex_unlock(&tracker->mutex);

    /* 計算進度條 */
    int filled = (info.progress_percent * bar_width) / 100;
    int empty = bar_width - filled;

    /* 格式化速度 */
    char speed_str[32];
    if (info.speed_bps >= 1024 * 1024) {
        snprintf(speed_str, sizeof(speed_str), "%.2f MB/s",
                 (double)info.speed_bps / (1024 * 1024));
    } else if (info.speed_bps >= 1024) {
        snprintf(speed_str, sizeof(speed_str), "%.2f KB/s",
                 (double)info.speed_bps / 1024);
    } else {
        snprintf(speed_str, sizeof(speed_str), "%u B/s", info.speed_bps);
    }

    /* 格式化大小 */
    char size_str[64];
    double current_mb = (double)info.current_bytes / (1024 * 1024);
    double total_mb = (double)info.total_bytes / (1024 * 1024);
    snprintf(size_str, sizeof(size_str), "%.2f/%.2f MB", current_mb, total_mb);

    /* 格式化時間 */
    char time_str[32];
    uint32_t eta_sec = info.eta_ms / 1000;
    if (eta_sec >= 3600) {
        snprintf(time_str, sizeof(time_str), "%uh%um",
                 eta_sec / 3600, (eta_sec % 3600) / 60);
    } else if (eta_sec >= 60) {
        snprintf(time_str, sizeof(time_str), "%um%us",
                 eta_sec / 60, eta_sec % 60);
    } else {
        snprintf(time_str, sizeof(time_str), "%us", eta_sec);
    }

    /* 打印進度條 */
    printf("\r[");
    for (int i = 0; i < filled; i++) {
        printf("=");
    }
    if (filled < bar_width) {
        printf(">");
        for (int i = 0; i < empty - 1; i++) {
            printf(" ");
        }
    }
    printf("] %3u%% | %s | %s | ETA: %s",
           info.progress_percent, size_str, speed_str, time_str);
    fflush(stdout);
}
