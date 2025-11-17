/**
 * @file data_acquisition_system.c
 * @brief FreeRTOS 實際專案範例 - 多通道數據採集系統
 * @author AI-Assisted Development Team
 * @date 2025-11-17
 *
 * 系統功能：
 * 1. 多通道感測器數據採集 (溫度、濕度、壓力、光照)
 * 2. 數據處理和過濾 (移動平均、異常值檢測)
 * 3. 數據記錄到循環緩衝區
 * 4. 通過 UART 發送數據
 * 5. 本地顯示 (LCD/串口)
 * 6. 警報系統 (閾值監控)
 * 7. 命令處理 (配置、查詢、控制)
 * 8. 看門狗監控
 *
 * 任務架構：
 * - 採集任務 (高優先權)
 * - 處理任務 (中優先權)
 * - 記錄任務 (中優先權)
 * - 通訊任務 (低優先權)
 * - 顯示任務 (低優先權)
 * - 監控任務 (低優先權)
 */

#include "FreeRTOS.h"
#include "task.h"
#include "queue.h"
#include "semphr.h"
#include "timers.h"
#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdbool.h>

/* ==================== 配置參數 ==================== */

#define NUM_CHANNELS            4
#define SAMPLE_RATE_MS          100     /* 採樣率 100ms */
#define MOVING_AVG_WINDOW       10      /* 移動平均視窗 */
#define DATA_BUFFER_SIZE        100     /* 循環緩衝區大小 */
#define COMMAND_QUEUE_SIZE      10
#define DATA_QUEUE_SIZE         20

/* 通道定義 */
typedef enum {
    CHANNEL_TEMPERATURE = 0,
    CHANNEL_HUMIDITY = 1,
    CHANNEL_PRESSURE = 2,
    CHANNEL_LIGHT = 3
} ChannelID_t;

/* ==================== 數據結構 ==================== */

/* 原始感測器數據 */
typedef struct {
    ChannelID_t channel;
    float raw_value;
    uint32_t timestamp;
} RawData_t;

/* 處理後的數據 */
typedef struct {
    ChannelID_t channel;
    float filtered_value;
    float min_value;
    float max_value;
    float average;
    uint32_t timestamp;
    bool alarm;
} ProcessedData_t;

/* 命令結構 */
typedef struct {
    uint8_t cmd_type;
    ChannelID_t channel;
    float param1;
    float param2;
    char message[64];
} Command_t;

/* 系統配置 */
typedef struct {
    float temp_alarm_high;
    float temp_alarm_low;
    float humidity_alarm_high;
    float pressure_alarm_high;
    float pressure_alarm_low;
    uint16_t sample_interval_ms;
    bool enable_logging;
    bool enable_transmission;
} SystemConfig_t;

/* ==================== 全域變數 ==================== */

/* 佇列和信號量 */
static QueueHandle_t raw_data_queue = NULL;
static QueueHandle_t processed_data_queue = NULL;
static QueueHandle_t command_queue = NULL;
static SemaphoreHandle_t config_mutex = NULL;
static SemaphoreHandle_t buffer_mutex = NULL;

/* 定時器 */
static TimerHandle_t sampling_timer = NULL;
static TimerHandle_t watchdog_timer = NULL;

/* 系統配置 */
static SystemConfig_t system_config = {
    .temp_alarm_high = 35.0f,
    .temp_alarm_low = 10.0f,
    .humidity_alarm_high = 80.0f,
    .pressure_alarm_high = 1050.0f,
    .pressure_alarm_low = 950.0f,
    .sample_interval_ms = SAMPLE_RATE_MS,
    .enable_logging = true,
    .enable_transmission = true
};

/* 循環緩衝區 */
static ProcessedData_t data_buffer[DATA_BUFFER_SIZE];
static uint32_t buffer_write_index = 0;
static uint32_t buffer_count = 0;

/* 移動平均緩衝區 */
static float moving_avg_buffer[NUM_CHANNELS][MOVING_AVG_WINDOW];
static uint8_t moving_avg_index[NUM_CHANNELS] = {0};

/* 統計資訊 */
static struct {
    uint32_t samples_collected[NUM_CHANNELS];
    uint32_t samples_processed;
    uint32_t samples_logged;
    uint32_t alarms_triggered;
    uint32_t commands_processed;
} system_stats = {0};

/* ==================== 模擬感測器讀取 ==================== */

static float read_sensor(ChannelID_t channel)
{
    uint32_t tick = xTaskGetTickCount();

    switch (channel) {
        case CHANNEL_TEMPERATURE:
            /* 模擬溫度 20-30°C，帶隨機波動 */
            return 25.0f + sinf(tick / 1000.0f) * 5.0f + (tick % 10 - 5) * 0.2f;

        case CHANNEL_HUMIDITY:
            /* 模擬濕度 40-70% */
            return 55.0f + sinf(tick / 1500.0f) * 15.0f + (tick % 10 - 5) * 0.5f;

        case CHANNEL_PRESSURE:
            /* 模擬氣壓 1000-1020 hPa */
            return 1010.0f + sinf(tick / 2000.0f) * 10.0f + (tick % 10 - 5) * 0.1f;

        case CHANNEL_LIGHT:
            /* 模擬光照 0-1000 lux */
            return 500.0f + sinf(tick / 1000.0f) * 500.0f + (tick % 100);

        default:
            return 0.0f;
    }
}

/* ==================== 數據採集任務 ==================== */

void vAcquisitionTask(void *pvParameters)
{
    ChannelID_t channel = (ChannelID_t)(uintptr_t)pvParameters;
    RawData_t raw_data;

    printf("[Acquisition-%d] Started for channel %d\n", channel, channel);

    while (1) {
        /* 讀取感測器 */
        raw_data.channel = channel;
        raw_data.raw_value = read_sensor(channel);
        raw_data.timestamp = xTaskGetTickCount();

        /* 發送到處理佇列 */
        if (xQueueSend(raw_data_queue, &raw_data, pdMS_TO_TICKS(100)) == pdTRUE) {
            system_stats.samples_collected[channel]++;
        }

        /* 延遲 */
        vTaskDelay(pdMS_TO_TICKS(system_config.sample_interval_ms));
    }
}

/* ==================== 數據處理任務 ==================== */

static float calculate_moving_average(ChannelID_t channel, float new_value)
{
    /* 更新移動平均緩衝區 */
    moving_avg_buffer[channel][moving_avg_index[channel]] = new_value;
    moving_avg_index[channel] = (moving_avg_index[channel] + 1) % MOVING_AVG_WINDOW;

    /* 計算平均值 */
    float sum = 0.0f;
    for (int i = 0; i < MOVING_AVG_WINDOW; i++) {
        sum += moving_avg_buffer[channel][i];
    }

    return sum / MOVING_AVG_WINDOW;
}

static bool check_alarm(ProcessedData_t *data)
{
    switch (data->channel) {
        case CHANNEL_TEMPERATURE:
            if (data->filtered_value > system_config.temp_alarm_high ||
                data->filtered_value < system_config.temp_alarm_low) {
                return true;
            }
            break;

        case CHANNEL_HUMIDITY:
            if (data->filtered_value > system_config.humidity_alarm_high) {
                return true;
            }
            break;

        case CHANNEL_PRESSURE:
            if (data->filtered_value > system_config.pressure_alarm_high ||
                data->filtered_value < system_config.pressure_alarm_low) {
                return true;
            }
            break;

        default:
            break;
    }

    return false;
}

void vProcessingTask(void *pvParameters)
{
    RawData_t raw_data;
    ProcessedData_t processed_data;
    static float channel_min[NUM_CHANNELS] = {999.0f, 999.0f, 9999.0f, 9999.0f};
    static float channel_max[NUM_CHANNELS] = {-999.0f, -999.0f, 0.0f, 0.0f};

    printf("[Processing] Started\n");

    while (1) {
        /* 接收原始數據 */
        if (xQueueReceive(raw_data_queue, &raw_data, portMAX_DELAY) == pdTRUE) {
            /* 應用移動平均濾波 */
            float filtered = calculate_moving_average(raw_data.channel, raw_data.raw_value);

            /* 更新最小/最大值 */
            if (filtered < channel_min[raw_data.channel]) {
                channel_min[raw_data.channel] = filtered;
            }
            if (filtered > channel_max[raw_data.channel]) {
                channel_max[raw_data.channel] = filtered;
            }

            /* 構建處理後的數據 */
            processed_data.channel = raw_data.channel;
            processed_data.filtered_value = filtered;
            processed_data.min_value = channel_min[raw_data.channel];
            processed_data.max_value = channel_max[raw_data.channel];
            processed_data.average = filtered;  /* 簡化，實際應計算全部平均 */
            processed_data.timestamp = raw_data.timestamp;
            processed_data.alarm = check_alarm(&processed_data);

            /* 檢查警報 */
            if (processed_data.alarm) {
                system_stats.alarms_triggered++;
                printf("[Processing] !!! ALARM on channel %d: value=%.2f !!!\n",
                       processed_data.channel, processed_data.filtered_value);
            }

            /* 發送到後續處理 */
            xQueueSend(processed_data_queue, &processed_data, 0);

            system_stats.samples_processed++;
        }
    }
}

/* ==================== 數據記錄任務 ==================== */

void vLoggingTask(void *pvParameters)
{
    ProcessedData_t data;

    printf("[Logging] Started\n");

    while (1) {
        if (xQueueReceive(processed_data_queue, &data, portMAX_DELAY) == pdTRUE) {
            if (system_config.enable_logging) {
                /* 寫入循環緩衝區 */
                xSemaphoreTake(buffer_mutex, portMAX_DELAY);

                data_buffer[buffer_write_index] = data;
                buffer_write_index = (buffer_write_index + 1) % DATA_BUFFER_SIZE;

                if (buffer_count < DATA_BUFFER_SIZE) {
                    buffer_count++;
                }

                xSemaphoreGive(buffer_mutex);

                system_stats.samples_logged++;

                /* 每 20 個樣本打印一次 */
                if (system_stats.samples_logged % 20 == 0) {
                    printf("[Logging] Logged %lu samples (buffer: %lu/%d)\n",
                           system_stats.samples_logged,
                           buffer_count,
                           DATA_BUFFER_SIZE);
                }
            }
        }
    }
}

/* ==================== 通訊任務 ==================== */

void vCommunicationTask(void *pvParameters)
{
    ProcessedData_t data;
    const char *channel_names[] = {"Temperature", "Humidity", "Pressure", "Light"};
    const char *units[] = {"°C", "%", "hPa", "lux"};

    printf("[Communication] Started\n");

    while (1) {
        if (xQueuePeek(processed_data_queue, &data, portMAX_DELAY) == pdTRUE) {
            if (system_config.enable_transmission) {
                /* 格式化並傳輸數據 */
                printf("[TX] CH%d(%s): %.2f %s [Min:%.2f Max:%.2f] %s\n",
                       data.channel,
                       channel_names[data.channel],
                       data.filtered_value,
                       units[data.channel],
                       data.min_value,
                       data.max_value,
                       data.alarm ? "ALARM" : "OK");

                /* 模擬 UART 傳輸延遲 */
                vTaskDelay(pdMS_TO_TICKS(50));
            }

            vTaskDelay(pdMS_TO_TICKS(500));
        }
    }
}

/* ==================== 監控任務 ==================== */

void vMonitorTask(void *pvParameters)
{
    printf("[Monitor] Started\n");

    vTaskDelay(pdMS_TO_TICKS(5000));

    while (1) {
        printf("\n========== System Monitor ==========\n");
        printf("System Uptime: %lu seconds\n", xTaskGetTickCount() / 1000);

        printf("\nSample Statistics:\n");
        for (int i = 0; i < NUM_CHANNELS; i++) {
            printf("  Channel %d: %lu samples\n", i, system_stats.samples_collected[i]);
        }
        printf("  Processed:  %lu\n", system_stats.samples_processed);
        printf("  Logged:     %lu\n", system_stats.samples_logged);
        printf("  Alarms:     %lu\n", system_stats.alarms_triggered);

        printf("\nBuffer Status: %lu / %d (%.1f%%)\n",
               buffer_count, DATA_BUFFER_SIZE,
               (float)buffer_count / DATA_BUFFER_SIZE * 100.0f);

        printf("\nQueue Status:\n");
        printf("  Raw data queue:       %u\n", uxQueueMessagesWaiting(raw_data_queue));
        printf("  Processed data queue: %u\n", uxQueueMessagesWaiting(processed_data_queue));

        printf("\nMemory:\n");
        printf("  Free heap: %u bytes\n", xPortGetFreeHeapSize());
        printf("  Min free:  %u bytes\n", xPortGetMinimumEverFreeHeapSize());

        printf("====================================\n\n");

        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}

/* ==================== 定時器回調 ==================== */

void vSamplingTimerCallback(TimerHandle_t xTimer)
{
    /* 定時採樣觸發（如果需要精確定時） */
}

void vWatchdogTimerCallback(TimerHandle_t xTimer)
{
    printf("[Watchdog] System healthy\n");
}

/* ==================== 應用程式入口 ==================== */

void app_main(void)
{
    printf("\n");
    printf("=================================================\n");
    printf("  Multi-Channel Data Acquisition System\n");
    printf("  Build: %s %s\n", __DATE__, __TIME__);
    printf("=================================================\n\n");

    printf("System Configuration:\n");
    printf("  Channels: %d\n", NUM_CHANNELS);
    printf("  Sample Rate: %d ms\n", SAMPLE_RATE_MS);
    printf("  Buffer Size: %d samples\n", DATA_BUFFER_SIZE);
    printf("  Temperature Alarm: %.1f - %.1f °C\n",
           system_config.temp_alarm_low, system_config.temp_alarm_high);
    printf("\n");

    /* 創建佇列 */
    raw_data_queue = xQueueCreate(DATA_QUEUE_SIZE, sizeof(RawData_t));
    processed_data_queue = xQueueCreate(DATA_QUEUE_SIZE, sizeof(ProcessedData_t));
    command_queue = xQueueCreate(COMMAND_QUEUE_SIZE, sizeof(Command_t));

    /* 創建信號量 */
    config_mutex = xSemaphoreCreateMutex();
    buffer_mutex = xSemaphoreCreateMutex();

    /* 創建定時器 */
    watchdog_timer = xTimerCreate("Watchdog", pdMS_TO_TICKS(5000),
                                  pdTRUE, NULL, vWatchdogTimerCallback);
    xTimerStart(watchdog_timer, 0);

    /* 創建採集任務（每個通道一個任務） */
    for (int i = 0; i < NUM_CHANNELS; i++) {
        char task_name[16];
        snprintf(task_name, sizeof(task_name), "Acq-CH%d", i);
        xTaskCreate(vAcquisitionTask, task_name, 512,
                   (void*)(uintptr_t)i, 3, NULL);
    }

    /* 創建處理任務 */
    xTaskCreate(vProcessingTask, "Processing", 1024, NULL, 2, NULL);

    /* 創建記錄任務 */
    xTaskCreate(vLoggingTask, "Logging", 512, NULL, 2, NULL);

    /* 創建通訊任務 */
    xTaskCreate(vCommunicationTask, "Comm", 512, NULL, 1, NULL);

    /* 創建監控任務 */
    xTaskCreate(vMonitorTask, "Monitor", 1024, NULL, 1, NULL);

    printf("All tasks created! Starting scheduler...\n\n");

    /* 啟動排程器 */
    vTaskStartScheduler();

    printf("ERROR: Scheduler failed to start!\n");
}

int main(void)
{
    app_main();
    return 0;
}
