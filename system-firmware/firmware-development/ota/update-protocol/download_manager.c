/**
 * @file download_manager.c
 * @brief 下載管理器實現
 */

#include "download_manager.h"
#include "progress_tracker.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <curl/curl.h>
#include <sys/time.h>

/* 下載管理器內部結構 */
typedef struct {
    download_config_t config;
    download_state_t state;
    download_stats_t stats;

    char url[512];
    char output_path[256];
    FILE *output_file;

    CURL *curl;
    pthread_t download_thread;
    pthread_mutex_t mutex;

    bool cancel_requested;
    bool pause_requested;

    download_progress_callback_t progress_callback;
    void *user_data;

    progress_tracker_handle_t progress_tracker;
} download_manager_t;

/* 獲取當前時間戳(毫秒) */
static uint64_t get_timestamp_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)tv.tv_sec * 1000 + tv.tv_usec / 1000;
}

/* CURL 寫入回調 */
static size_t write_callback(void *ptr, size_t size, size_t nmemb, void *userdata)
{
    download_manager_t *manager = (download_manager_t *)userdata;
    size_t written = 0;

    pthread_mutex_lock(&manager->mutex);

    if (manager->cancel_requested || manager->pause_requested) {
        pthread_mutex_unlock(&manager->mutex);
        return 0; /* 中止下載 */
    }

    if (manager->output_file) {
        written = fwrite(ptr, size, nmemb, manager->output_file);
        fflush(manager->output_file);
    }

    pthread_mutex_unlock(&manager->mutex);

    return written;
}

/* CURL 進度回調 */
static int progress_callback(void *clientp, curl_off_t dltotal, curl_off_t dlnow,
                             curl_off_t ultotal, curl_off_t ulnow)
{
    download_manager_t *manager = (download_manager_t *)clientp;

    pthread_mutex_lock(&manager->mutex);

    if (manager->cancel_requested || manager->pause_requested) {
        pthread_mutex_unlock(&manager->mutex);
        return 1; /* 中止下載 */
    }

    /* 更新統計信息 */
    manager->stats.total_bytes = dltotal;
    manager->stats.downloaded_bytes = dlnow;

    if (dltotal > 0) {
        manager->stats.progress_percent = (uint8_t)((dlnow * 100) / dltotal);
    }

    /* 更新進度跟踪器 */
    if (manager->progress_tracker) {
        progress_tracker_update(manager->progress_tracker, dlnow, dltotal);
    }

    /* 調用用戶回調 */
    if (manager->progress_callback) {
        manager->progress_callback(dlnow, dltotal, manager->user_data);
    }

    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/* 下載線程函數 */
static void* download_thread_func(void *arg)
{
    download_manager_t *manager = (download_manager_t *)arg;
    CURLcode res;

    pthread_mutex_lock(&manager->mutex);
    manager->state = DOWNLOAD_STATE_CONNECTING;
    pthread_mutex_unlock(&manager->mutex);

    /* 執行下載 */
    res = curl_easy_perform(manager->curl);

    pthread_mutex_lock(&manager->mutex);

    if (manager->cancel_requested) {
        manager->state = DOWNLOAD_STATE_CANCELLED;
    } else if (manager->pause_requested) {
        manager->state = DOWNLOAD_STATE_PAUSED;
    } else if (res != CURLE_OK) {
        manager->state = DOWNLOAD_STATE_FAILED;
    } else {
        manager->state = DOWNLOAD_STATE_COMPLETED;
    }

    if (manager->output_file) {
        fclose(manager->output_file);
        manager->output_file = NULL;
    }

    pthread_mutex_unlock(&manager->mutex);

    return NULL;
}

/**
 * @brief 創建下載管理器
 */
download_manager_handle_t download_manager_create(const download_config_t *config)
{
    if (!config) {
        return NULL;
    }

    download_manager_t *manager = (download_manager_t *)calloc(1, sizeof(download_manager_t));
    if (!manager) {
        return NULL;
    }

    memcpy(&manager->config, config, sizeof(download_config_t));
    manager->state = DOWNLOAD_STATE_IDLE;
    pthread_mutex_init(&manager->mutex, NULL);

    /* 創建進度跟踪器 */
    manager->progress_tracker = progress_tracker_create();

    return (download_manager_handle_t)manager;
}

/**
 * @brief 銷毀下載管理器
 */
void download_manager_destroy(download_manager_handle_t handle)
{
    if (!handle) {
        return;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    /* 取消正在進行的下載 */
    download_manager_cancel(handle);

    /* 清理資源 */
    if (manager->progress_tracker) {
        progress_tracker_destroy(manager->progress_tracker);
    }

    pthread_mutex_destroy(&manager->mutex);
    free(manager);
}

/**
 * @brief 下載文件
 */
int download_manager_download(download_manager_handle_t handle,
                               const char *url,
                               const char *output_path)
{
    if (!handle || !url || !output_path) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);

    if (manager->state == DOWNLOAD_STATE_DOWNLOADING) {
        pthread_mutex_unlock(&manager->mutex);
        return -2; /* 已在下載中 */
    }

    /* 保存參數 */
    strncpy(manager->url, url, sizeof(manager->url) - 1);
    strncpy(manager->output_path, output_path, sizeof(manager->output_path) - 1);

    /* 打開輸出文件 */
    manager->output_file = fopen(output_path, "wb");
    if (!manager->output_file) {
        pthread_mutex_unlock(&manager->mutex);
        return -3;
    }

    /* 初始化 CURL */
    manager->curl = curl_easy_init();
    if (!manager->curl) {
        fclose(manager->output_file);
        manager->output_file = NULL;
        pthread_mutex_unlock(&manager->mutex);
        return -4;
    }

    /* 配置 CURL */
    curl_easy_setopt(manager->curl, CURLOPT_URL, url);
    curl_easy_setopt(manager->curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(manager->curl, CURLOPT_WRITEDATA, manager);
    curl_easy_setopt(manager->curl, CURLOPT_XFERINFOFUNCTION, progress_callback);
    curl_easy_setopt(manager->curl, CURLOPT_XFERINFODATA, manager);
    curl_easy_setopt(manager->curl, CURLOPT_NOPROGRESS, 0L);
    curl_easy_setopt(manager->curl, CURLOPT_FOLLOWLOCATION, 1L);
    curl_easy_setopt(manager->curl, CURLOPT_TIMEOUT, manager->config.timeout_ms / 1000);

    if (!manager->config.verify_ssl) {
        curl_easy_setopt(manager->curl, CURLOPT_SSL_VERIFYPEER, 0L);
        curl_easy_setopt(manager->curl, CURLOPT_SSL_VERIFYHOST, 0L);
    }

    /* 重置狀態 */
    memset(&manager->stats, 0, sizeof(download_stats_t));
    manager->cancel_requested = false;
    manager->pause_requested = false;
    manager->state = DOWNLOAD_STATE_DOWNLOADING;

    /* 啟動進度跟踪 */
    if (manager->progress_tracker) {
        progress_tracker_start(manager->progress_tracker);
    }

    pthread_mutex_unlock(&manager->mutex);

    /* 同步執行下載 */
    CURLcode res = curl_easy_perform(manager->curl);

    pthread_mutex_lock(&manager->mutex);

    if (manager->output_file) {
        fclose(manager->output_file);
        manager->output_file = NULL;
    }

    curl_easy_cleanup(manager->curl);
    manager->curl = NULL;

    if (manager->progress_tracker) {
        progress_tracker_stop(manager->progress_tracker);
    }

    if (manager->cancel_requested) {
        manager->state = DOWNLOAD_STATE_CANCELLED;
        pthread_mutex_unlock(&manager->mutex);
        return -5;
    }

    if (res != CURLE_OK) {
        manager->state = DOWNLOAD_STATE_FAILED;
        pthread_mutex_unlock(&manager->mutex);
        return -6;
    }

    manager->state = DOWNLOAD_STATE_COMPLETED;
    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/**
 * @brief 下載文件（異步）
 */
int download_manager_download_async(download_manager_handle_t handle,
                                     const char *url,
                                     const char *output_path,
                                     download_progress_callback_t callback,
                                     void *user_data)
{
    if (!handle || !url || !output_path) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    manager->progress_callback = callback;
    manager->user_data = user_data;

    /* 創建下載線程 */
    /* 簡化實現，實際應使用線程池 */

    return download_manager_download(handle, url, output_path);
}

/**
 * @brief 暫停下載
 */
int download_manager_pause(download_manager_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);
    manager->pause_requested = true;
    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/**
 * @brief 恢復下載
 */
int download_manager_resume(download_manager_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);

    if (manager->state != DOWNLOAD_STATE_PAUSED) {
        pthread_mutex_unlock(&manager->mutex);
        return -2;
    }

    manager->pause_requested = false;
    /* 實際實現中應該從斷點位置繼續下載 */

    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/**
 * @brief 取消下載
 */
int download_manager_cancel(download_manager_handle_t handle)
{
    if (!handle) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);
    manager->cancel_requested = true;
    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/**
 * @brief 獲取下載狀態
 */
download_state_t download_manager_get_state(download_manager_handle_t handle)
{
    if (!handle) {
        return DOWNLOAD_STATE_IDLE;
    }

    download_manager_t *manager = (download_manager_t *)handle;
    download_state_t state;

    pthread_mutex_lock(&manager->mutex);
    state = manager->state;
    pthread_mutex_unlock(&manager->mutex);

    return state;
}

/**
 * @brief 獲取下載統計
 */
int download_manager_get_stats(download_manager_handle_t handle,
                                download_stats_t *stats)
{
    if (!handle || !stats) {
        return -1;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);

    memcpy(stats, &manager->stats, sizeof(download_stats_t));

    /* 從進度跟踪器獲取額外信息 */
    if (manager->progress_tracker) {
        progress_info_t progress_info;
        if (progress_tracker_get_info(manager->progress_tracker, &progress_info) == 0) {
            stats->speed_bps = progress_info.speed_bps;
            stats->elapsed_time_ms = progress_info.elapsed_ms;
            stats->remaining_time_ms = progress_info.eta_ms;
        }
    }

    pthread_mutex_unlock(&manager->mutex);

    return 0;
}

/**
 * @brief 設置進度回調
 */
void download_manager_set_progress_callback(download_manager_handle_t handle,
                                             download_progress_callback_t callback,
                                             void *user_data)
{
    if (!handle) {
        return;
    }

    download_manager_t *manager = (download_manager_t *)handle;

    pthread_mutex_lock(&manager->mutex);
    manager->progress_callback = callback;
    manager->user_data = user_data;
    pthread_mutex_unlock(&manager->mutex);
}
